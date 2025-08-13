A simple Discord bot that joins a specified voice channel and continuously plays all `.mp3` files in a folder. Includes a modern web interface for uploading songs, skipping tracks, viewing the queue, a progress bar, and now the ability to click a song in the queue to play it immediately—all protected by a LAN-only password.

---

## Features

- Joins a predetermined Discord voice channel and loops `.mp3` files in the `music/` folder
- Automatically detects new `.mp3` files added to the folder
- Web UI for:
  - Uploading `.mp3` files
  - Skipping currently playing track
  - Viewing the current song and upcoming queue
  - Live progress bar for the current track
  - **Click any song in the queue to play it immediately**
- Simple password protection to restrict LAN access to the web UI

---

## Requirements

- Node.js v16 or newer
- Discord bot token with `GUILD_VOICE_STATES` and `GUILDS` intents enabled
- FFmpeg installed on your system (required by `fluent-ffmpeg`)

---

## Installation

1. Clone this repo or copy the files to your machine.

2. Install dependencies:

   ```bash
   npm install
   ```
3. Create a `.env` file in the root folder with the following variables:
  
   ```bash
   DISCORD_TOKEN=your-bot-token-here
   GUILD_ID=your-discord-server-id
   VOICE_CHANNEL_ID=your-target-voice-channel-id
   WEBUI_PASSWORD=your-desired-password
   ```
4. Create a `music` folder in the root directory and place some `.mp3` files there, or upload them via the Web UI.

---

## Usage

Start the bot with:

   ```bash
   node bot.js
   ```
- The bot will join the specified voice channel and start playing all `.mp3` files in the `music` folder.
- Access the web UI at: `http://localhost:3000`
- You will be prompted for the password set in `.env`.
- Upload new `.mp3` files and skip songs using the web interface.
- **Click any song in the queue in the web UI to play it instantly.**

## Notes
- The bot watches the `music` folder and auto-queues new `.mp3` files added manually or via the `web ui`.
- The web UI uses a cookie-based simple password protection - suitable for LAN environments.
- Ensure FFmpeg is installed and available in your system path.

## Dependencies

- [discord.js](https://discord.js.org/)  
- [@discordjs/voice](https://discord.js.org/#/docs/voice/)  
- [express](https://expressjs.com/)  
- [multer](https://github.com/expressjs/multer)  
- [chokidar](https://github.com/paulmillr/chokidar)  
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)  
- [ffprobe-static](https://github.com/eugeneware/ffprobe-static)  
- [cookie-parser](https://github.com/expressjs/cookie-parser)  

---

## License

MIT License — feel free to modify and use for personal or LAN party purposes.

---

Made with ❤️.. or pain.. by Noni..
