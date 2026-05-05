import { EmbedBuilder } from 'discord.js';
import { formatTime, getLogo } from '../../function/fucntion.js';

async function startStream(guildId, song, queue, shoukaku) {
    const serverQueue = queue.get(guildId);
    if (!serverQueue) return;
    if (!song) {
        serverQueue.textChannel.send("🎵 Antrean abis. Cabut dulu ya!").catch(() => null);
        cleanup(guildId, queue, shoukaku);
        return;
    }

    const player = serverQueue.player;
    if (!player) {
        cleanup(guildId, queue, shoukaku);
        return;
    }

    serverQueue.isSkipping = false;

    try {
        await player.playTrack({ track: { encoded: song.encoded } });
    } catch (e) {
        console.error("[PLAY TRACK]", e);
        serverQueue.textChannel.send("Gagal muter lagu ini, skip ke lagu berikutnya...");
        return skipLagu(guildId, queue, shoukaku);
    }

    const LogoPlatform = song.isSpotify ? getLogo(1) : getLogo(2);
    const embed = new EmbedBuilder()
        .setAuthor({ name: 'Now Playing', iconURL: LogoPlatform })
        .setTitle(song.info.title)
        .setURL(song.info.uri)
        .setThumbnail(song.info.artworkUrl || song.info.thumbnail || "")
        .addFields(
            { name: 'Source', value: `\`${song.info.author}\``, inline: true },
            { name: 'Duration', value: `\`${formatTime(song.info.length)}\``, inline: true },
            { name: 'Requester', value: `${song.requester.tag}`, inline: true }
        )
        .setFooter({ text: 'Turtle Music • High Fidelity' });

    serverQueue.textChannel.send({ embeds: [embed] }).catch(() => null);

    player.removeAllListeners('end');
    player.removeAllListeners('error');
    player.removeAllListeners('closed');
    player.removeAllListeners('stuck');

    player.on('end', (data) => {
        if (data.reason === 'replaced' || data.reason === 'REPLACED') return;
        const nextQueue = queue.get(guildId);
        if (!nextQueue) return;
        
        if (nextQueue.isSkipping) {
            nextQueue.isSkipping = false;
            return skipLagu(guildId, queue, shoukaku, true);
        }

        if (nextQueue.repeat) {
            startStream(guildId, nextQueue.songs[0], queue, shoukaku);
        } else {
            skipLagu(guildId, queue, shoukaku);
        }
    });

    player.on('error', (error) => {
        console.error("[PLAYER ERROR]", error);
        const q = queue.get(guildId);
        if (q) {
            q.textChannel.send("Ada masalah teknis pas muter lagu, skip ya!").catch(() => null);
            skipLagu(guildId, queue, shoukaku);
        }
    });

    player.on('stuck', (data) => {
        const q = queue.get(guildId);
        if (q) {
            q.textChannel.send("Lagu stuck, skip ke lagu berikutnya...").catch(() => null);
            skipLagu(guildId, queue, shoukaku);
        }
    });

    player.on('closed', (data) => {
        const q = queue.get(guildId);
        if (q) {
            q.textChannel.send("Koneksi ke audio server terputus.").catch(() => null);
            cleanup(guildId, queue, shoukaku);
        }
    });
}

function skipLagu(guildId, queue, shoukaku, force = false) {
    const serverQueue = queue.get(guildId);
    if (!serverQueue) return;

    if (!serverQueue.repeat || force) {
        serverQueue.songs.shift();
    }

    if (serverQueue.songs.length > 0) {
        startStream(guildId, serverQueue.songs[0], queue, shoukaku);
    } else {
        serverQueue.textChannel.send("🎵 Antrean abis. Cabut dulu ya!").catch(() => null);
        cleanup(guildId, queue, shoukaku);
    }
}

function cleanup(guildId, queue, shoukaku) {
    const serverQueue = queue.get(guildId);
    if (serverQueue?.player) {
        serverQueue.player.removeAllListeners('end');
        serverQueue.player.removeAllListeners('error');
        serverQueue.player.removeAllListeners('closed');
        serverQueue.player.removeAllListeners('stuck');
    }
    try {
        shoukaku.leaveVoiceChannel(guildId);
    } catch {}
    queue.delete(guildId);
}

export { startStream, skipLagu, cleanup };
