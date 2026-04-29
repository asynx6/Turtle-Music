# 🐢 Turtle Music - High Fidelity Discord Bot
A powerful and optimized Discord music bot built with **Node.js**, **Discord.js**, and **Shoukaku**. This bot is designed for high-quality audio streaming using Spotify metadata and YouTube sources.

---

### 🚀 Getting Started
#### 1. Prerequisites
* **Node.js** v18.0.0 or higher.
* A Discord Bot Token via [Discord Developer Portal](https://discord.com/developers/applications).
* A running **Lavalink** server. 

For a smooth experience, we recommend using a Lavalink setup that already includes essential plugins (LavaSrc, YouTube, etc.). You can find a pre-configured version here:
* 👉 **[GlaceYT/Lavalink Repository](https://github.com/GlaceYT/Lavalink)**

#### 2. Installation
Clone this repository and install the required dependencies:

    ```bash
    git clone https://github.com/asynx6/Turtle-Music.git
    cd Turtle-Music
    npm install

3. Configuration
Create a .env file in the root directory of the project and fill in your credentials as follows:

    ```bash
    DISCORD_TOKEN=
    PREFIX=b!
    
    LAVA_HOST=
    LAVA_PORT=
    LAVA_PASS=
    LAVA_SECURE=false

Note: Set LAVA_SECURE to true if your Lavalink provider uses SSL (https/wss).

4. Running the Bot
Once everything is configured, you can start the bot using:

   ```bash
   node index.js

✨ Features
Spotify Support: Seamlessly play Spotify Tracks, Playlists, and Albums.
High-Fidelity Audio: Powered by Lavalink for crystal-clear sound and low latency.
Smart Queuing: Optimized background synchronization for large playlists.
Stability: Built-in auto-reconnect and error handling to keep the music playing.
Auto-Idle: Built-in timers to disconnect the bot when the voice channel is empty.

🛠️ Built With
Discord.js - Discord API Library.
Shoukaku - Stable Lavalink Wrapper.
LavaSrc - Advanced music source plugins.
