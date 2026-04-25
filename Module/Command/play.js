import { EmbedBuilder } from 'discord.js';
import { formatTime, getLogo } from '../function/fucntion.js';
import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
const { getData, getTracks } = spotifyUrlInfo(fetch);

async function play(message, args, shoukaku, queue, idleTimers) {
    const query = args.join(' ');
    if (!query) return message.reply('Masukan Judul Lagu atau link!');

    const { channel } = message.member.voice;
    if (!channel) return message.reply('Minimal Masuk voice dulu dong!');

    let serverQueue = queue.get(message.guild.id);
    if (serverQueue && channel.id !== serverQueue.voiceChannel.id) {
        return message.reply(`Gue lagi dipake di <#${serverQueue.voiceChannel.id}>!`);
    }

    const node = shoukaku.options.nodeResolver(shoukaku.nodes);
    let tracksToProcess = [];
    const isSpotify = /open\.spotify\.com/.test(query);
    const isYoutubeLink = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(query);
    if (isSpotify) {
        try {
            const data = await getData(query);
            const artist = data.artists?.[0]?.name || "";
            const trackName = data.name;

            if (data.type === 'track') {
                tracksToProcess.push(`ytsearch:${trackName} ${artist}`);
            } else if (data.type === 'playlist' || data.type === 'album') {
                const loadingMsg = await message.channel.send(`⏳ Membongkar playlist **${data.name}**...`);
                const tracks = await getTracks(query);
                
                tracksToProcess = tracks.map(t => {
                    const tArtist = t.artists?.[0]?.name || "";
                    return `ytsearch:${t.name} ${tArtist}`;
                });
                await loadingMsg.delete().catch(() => null);
            }
        } catch (err) {
            return message.reply("Gagal bongkar link Spotify!");
        }
    } else if (isYoutubeLink) {
        tracksToProcess.push(query);
    } else {
        tracksToProcess.push(`ytsearch:${query}`);
    }

    if (idleTimers.has(message.guild.id)) {
        clearTimeout(idleTimers.get(message.guild.id));
        idleTimers.delete(message.guild.id);
    }

    let res;
    try {
        res = await node.rest.resolve(tracksToProcess[0]);
    } catch (e) {
        return message.reply("Lavalink error! Coba lagi nanti.");
    }
    
    let firstTrack;
    const loadType = res?.loadType || res?.type;
    
    if (loadType === 'track' || loadType === 'TRACK_LOADED') {
        firstTrack = res.data;
    } else if (loadType === 'playlist' || loadType === 'PLAYLIST_LOADED') {
        firstTrack = res.data.tracks ? res.data.tracks[0] : res.data[0];
    } else if (loadType === 'search' || loadType === 'SEARCH_RESULT') {
        firstTrack = res.data[0];
    }

    if (!firstTrack && isYoutubeLink) {
        const fallbackRes = await node.rest.resolve(`ytsearch:${query}`);
        firstTrack = fallbackRes?.data?.[0];
    }

    if (!firstTrack) return message.reply('Gak nemu lagunya, YouTube lagi proteksi ketat kayaknya.');

    firstTrack.isSpotify = isSpotify;
    firstTrack.requester = message.author;

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: channel,
            player: null,
            songs: [firstTrack],
            repeat: false,
        };
        queue.set(message.guild.id, queueContruct);

        try {
            const player = await shoukaku.joinVoiceChannel({
                guildId: message.guild.id,
                channelId: channel.id,
                shardId: message.guild.shardId,
                deaf: true
            });
            queueContruct.player = player;
            startStream(message.guild.id, queueContruct.songs[0], queue, shoukaku);
        } catch (err) {
            queue.delete(message.guild.id);
            return message.reply('Gagal join VC!');
        }
    } else {
        serverQueue.songs.push(firstTrack);
        return message.reply(`**${firstTrack.info.title}** masuk antrean!`);
    }

    if (tracksToProcess.length > 1) {
        (async () => {
            const currentQueue = queue.get(message.guild.id);
            for (let i = 1; i < tracksToProcess.length; i++) {
                if (!queue.has(message.guild.id)) break;
                let r = await node.rest.resolve(tracksToProcess[i]);
                let t = r?.data?.tracks?.[0] || r?.data?.[0] || r?.data;
                if (t && t.info) {
                    t.isSpotify = true;
                    t.requester = message.author;
                    currentQueue.songs.push(t);
                }
            }
        })();
    }
}

async function startStream(guildId, song, queue, shoukaku) {
    const serverQueue = queue.get(guildId);
    if (!serverQueue || !song) return;

    const player = serverQueue.player;
    try {
        await player.playTrack({ track: { encoded: song.encoded } });
    } catch (e) {
        console.error(e);
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

    serverQueue.textChannel.send({ embeds: [embed] });

    player.removeAllListeners('end');
    player.removeAllListeners('error');

    player.on('end', (data) => {
        if (data.reason === 'REPLACED') return;
        const nextQueue = queue.get(guildId);
        if (!nextQueue) return;
        if (nextQueue.repeat) {
            startStream(guildId, nextQueue.songs[0], queue, shoukaku);
        } else {
            skipLagu(guildId, queue, shoukaku);
        }
    });
    player.on('error', (error) => {
        console.error("Player Error:", error);
        serverQueue.textChannel.send("Ada masalah teknis pas muter lagu, skip ya!");
        skipLagu(guildId, queue, shoukaku);
    });
}

function skipLagu(guildId, queue, shoukaku) {
    const serverQueue = queue.get(guildId);
    if (!serverQueue) return;
    if (!serverQueue.repeat) {
        serverQueue.songs.shift();
    }

    if (serverQueue.songs.length > 0) {
        startStream(guildId, serverQueue.songs[0], queue, shoukaku);
    } else {
        serverQueue.textChannel.send("🎵 Antrean abis. Cabut dulu ya!");
        shoukaku.leaveVoiceChannel(guildId);
        queue.delete(guildId);
    }
}

export default play;