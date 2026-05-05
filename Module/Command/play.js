import { resolveTracks, resolvePlaylistBackground } from './handleplay/resolve.js';
import { startStream, cleanup } from './handleplay/stream.js';

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
    if (!node) return message.reply('Lavalink node belum siap, coba lagi nanti!');

    if (idleTimers.has(message.guild.id)) {
        clearTimeout(idleTimers.get(message.guild.id));
        idleTimers.delete(message.guild.id);
    }

    let resolved;
    try {
        resolved = await resolveTracks(query, node);
    } catch (err) {
        return message.reply(err.message);
    }

    let firstTrack;
    let tracksToProcess = resolved.tracksToProcess || [];

    if (resolved.native) {
        firstTrack = resolved.tracks[0];
    } else {
        try {
            const res = await node.rest.resolve(tracksToProcess[0]);
            const loadType = res?.loadType || res?.type;
            
            if (loadType === 'track' || loadType === 'TRACK_LOADED') {
                firstTrack = res.data;
            } else if (loadType === 'playlist' || loadType === 'PLAYLIST_LOADED') {
                firstTrack = res.data.tracks ? res.data.tracks[0] : res.data[0];
            } else if (loadType === 'search' || loadType === 'SEARCH_RESULT') {
                firstTrack = res.data[0];
            }
        } catch (e) {
            return message.reply("Lavalink error! Coba lagi nanti.");
        }
    }

    if (!firstTrack) return message.reply('Gak nemu lagunya, YouTube lagi proteksi ketat kayaknya.');

    firstTrack.isSpotify = resolved.isSpotify;
    firstTrack.requester = message.author;

    serverQueue = queue.get(message.guild.id);

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: channel,
            player: null,
            songs: [firstTrack],
            repeat: false,
            isSkipping: false,
        };
        queue.set(message.guild.id, queueContruct);

        try {
            let player = shoukaku.players.get(message.guild.id);
            if (player) {
                player.removeAllListeners('end');
                player.removeAllListeners('error');
                player.removeAllListeners('closed');
                player.removeAllListeners('stuck');
            } else {
                player = await shoukaku.joinVoiceChannel({
                    guildId: message.guild.id,
                    channelId: channel.id,
                    shardId: message.guild.shardId,
                    deaf: true,
                });
                try { await message.guild.members.me.voice.setDeaf(true, 'Turtle Music Auto Server Deafen'); } catch {}
            }

            queueContruct.player = player;
            startStream(message.guild.id, queueContruct.songs[0], queue, shoukaku);
        } catch (err) {
            console.error("[JOIN VC]", err);
            queue.delete(message.guild.id);
            try { shoukaku.leaveVoiceChannel(message.guild.id); } catch {}
            return message.reply('Gagal join VC! Coba lagi.');
        }

        if (!resolved.native && tracksToProcess.length > 1) {
            resolvePlaylistBackground(tracksToProcess, 1, message, node, queue, startStream);
        } else if (resolved.native && resolved.tracks.length > 1) {
            const q = queue.get(message.guild.id);
            for (let i = 1; i < resolved.tracks.length; i++) {
                const t = resolved.tracks[i];
                t.isSpotify = resolved.isSpotify;
                t.requester = message.author;
                q.songs.push(t);
            }
        }
    } else {
        serverQueue.songs.push(firstTrack);
        
        if (!resolved.native && tracksToProcess.length > 1) {
            message.reply(`📂 **${tracksToProcess.length} lagu** dari playlist sedang diproses...`);
            resolvePlaylistBackground(tracksToProcess, 1, message, node, queue, startStream);
        } else if (resolved.native && resolved.tracks.length > 1) {
            const q = queue.get(message.guild.id);
            for (let i = 1; i < resolved.tracks.length; i++) {
                const t = resolved.tracks[i];
                t.isSpotify = resolved.isSpotify;
                t.requester = message.author;
                q.songs.push(t);
            }
            message.reply(`📂 **${resolved.tracks.length} lagu** dari playlist berhasil ditambahkan!`);
        } else {
            message.reply(`**${firstTrack.info.title}** masuk antrean!`);
        }
    }
}

export default play;