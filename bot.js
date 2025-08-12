require('dotenv').config();

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const cookieParser = require('cookie-parser');
const chokidar = require('chokidar');
const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');

ffmpeg.setFfprobePath(require('ffprobe-static').path);

const app = express();
const PORT = process.env.PORT || 3000;
const MUSIC_DIR = path.join(__dirname, 'music');
const PUBLIC_DIR = path.join(__dirname, 'public');

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

let player = createAudioPlayer();
let connection;
let queue = [];
let currentTrack = null;
let trackStartTime = null;
let currentTrackDuration = 0;

function loadMp3Files() {
  return fs.readdirSync(MUSIC_DIR)
    .filter(f => f.endsWith('.mp3'))
    .map(f => path.join(MUSIC_DIR, f));
}

function getDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
}

async function playNext() {
  if (queue.length === 0) {
    console.log('Queue is empty, nothing to play.');
    currentTrack = null;
    return;
  }

  const nextTrack = queue.shift();
  currentTrack = path.basename(nextTrack);
  trackStartTime = Date.now();

  try {
    currentTrackDuration = await getDuration(nextTrack);
  } catch {
    currentTrackDuration = 0;
  }

  const resource = createAudioResource(nextTrack);
  player.play(resource);

  // Re-add current track to end of queue for looping
  queue.push(nextTrack);
}

function watchMusicFolder() {
  chokidar.watch(MUSIC_DIR, { ignoreInitial: true })
    .on('add', filePath => {
      if (filePath.endsWith('.mp3')) {
        console.log('New file detected:', filePath);
        queue.push(filePath);
      }
    });
}

// Web UI auth
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  const allowed = req.cookies?.auth === process.env.WEBUI_PASSWORD;
  const exemptPaths = ['/login', '/auth', '/status', '/skip', '/upload', '/play', '/pause'];
  const isStaticAsset = req.path.endsWith('.css') || req.path.endsWith('.js') || req.path.endsWith('.ico');

  if (allowed || exemptPaths.includes(req.path) || isStaticAsset) return next();
  if (req.method === 'POST' && req.path === '/auth') return next();

  res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

app.use(express.static(PUBLIC_DIR));

app.post('/auth', (req, res) => {
  const { password } = req.body;
  if (password === process.env.WEBUI_PASSWORD) {
    res.cookie('auth', password, { httpOnly: true });
    return res.redirect('/');
  }
  res.send(`<script>alert("Wrong password!"); window.location = "/";</script>`);
});

const storage = multer.diskStorage({
  destination: MUSIC_DIR,
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  console.log('Uploaded:', req.file.originalname);
  queue.push(path.join(MUSIC_DIR, req.file.originalname));
  res.redirect('/');
});

app.post('/skip', (req, res) => {
  player.stop(true);
  res.json({ status: 'skipped' });
});

app.post('/play', (req, res) => {
  if (player) player.unpause();
  res.json({ status: 'playing' });
});

app.post('/pause', (req, res) => {
  if (player) player.pause();
  res.json({ status: 'paused' });
});

app.get('/status', (req, res) => {
  const elapsed = trackStartTime ? (Date.now() - trackStartTime) / 1000 : 0;
  res.json({
    current: currentTrack,
    duration: currentTrackDuration,
    elapsed: elapsed,
    queue: queue.map(f => path.basename(f))
  });
});

app.listen(PORT, () => {
  console.log(`Web UI available at http://localhost:${PORT}`);
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity('Music', { type: 'PLAYING' });

  const guild = await client.guilds.fetch(GUILD_ID);
  const channel = await guild.channels.fetch(VOICE_CHANNEL_ID);

  connection = joinVoiceChannel({
    channelId: VOICE_CHANNEL_ID,
    guildId: GUILD_ID,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    connection.subscribe(player);

    queue = loadMp3Files();
    if (queue.length > 0) await playNext();

    player.on(AudioPlayerStatus.Idle, () => {
      playNext(); // loop behavior handled inside playNext
    });

    watchMusicFolder();
    console.log('Bot is playing music in the voice channel.');
  } catch (err) {
    console.error('Error connecting to voice channel:', err);
  }
});

client.login(TOKEN);
