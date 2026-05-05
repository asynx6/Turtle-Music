import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
const { getData, getTracks } = spotifyUrlInfo(fetch);

async function resolveTracks(query, node) {
    const isSpotify = /open\.spotify\.com/.test(query);
    const isYoutubeLink = /youtube\.com|youtu\.be/.test(query);
    const isLink = /^(https?:\/\/)/.test(query);
    if (isLink) {
        try {
            const res = await node.rest.resolve(query);
            const loadType = res?.loadType || res?.type;

            if (loadType === 'track' || loadType === 'TRACK_LOADED') {
                if (res.data) return { tracks: [res.data], isSpotify, native: true };
            } else if (loadType === 'playlist' || loadType === 'PLAYLIST_LOADED') {
                const tracks = res.data?.tracks || res.data;
                if (tracks) return { tracks: Array.isArray(tracks) ? tracks : [tracks], isSpotify, native: true };
            } else if ((loadType === 'search' || loadType === 'SEARCH_RESULT') && res.data?.length > 0) {
                return { tracks: res.data, isSpotify, native: true };
            }
        } catch (e) {}
    }

    let tracksToProcess = [];
    if (isSpotify) {
        try {
            const data = await getData(query);
            if (data.type === 'track') {
                const artist = data.artists?.map(a => a.name).join(', ') || "";
                tracksToProcess.push(`ytsearch:${artist} - ${data.name}`);
            } else if (data.type === 'playlist' || data.type === 'album') {
                const tracks = await getTracks(query);
                tracksToProcess = tracks.map(t => {
                    const artist = t.artists?.map(a => a.name).join(', ') || "";
                    return `ytsearch:${artist} - ${t.name}`;
                });
            }
        } catch (err) {
            throw new Error("Gagal bongkar link Spotify!");
        }
    } else if (isYoutubeLink && isLink) {
        tracksToProcess.push(`ytsearch:${query}`);
    } else if (isLink) {
        tracksToProcess.push(query);
    } else {
        tracksToProcess.push(`ytsearch:${query}`);
    }

    return { tracksToProcess, isSpotify, native: false };
}

async function resolvePlaylistBackground(tracksToProcess, startIndex, message, node, queue, startStream) {
    let added = 0;
    let failed = 0;

    for (let i = startIndex; i < tracksToProcess.length; i++) {
        const currentQueue = queue.get(message.guild.id);
        if (!currentQueue) break;

        try {
            const r = await node.rest.resolve(tracksToProcess[i]);
            const loadType = r?.loadType || r?.type;
            let t = null;

            if (loadType === 'track' || loadType === 'TRACK_LOADED') {
                t = r.data;
            } else if (loadType === 'search' || loadType === 'SEARCH_RESULT') {
                t = r.data?.[0];
            } else if (loadType === 'playlist' || loadType === 'PLAYLIST_LOADED') {
                t = r.data?.tracks?.[0] || r.data?.[0];
            }

            if (t && t.info) {
                t.isSpotify = true;
                t.requester = message.author;
                
                const q = queue.get(message.guild.id);
                if (q) {
                    q.songs.push(t);
                    added++;
                } else break;
            } else failed++;
        } catch (err) {
            failed++;
        }
    }

    const currentQueue = queue.get(message.guild.id);
    if (currentQueue && added > 0) {
        const failMsg = failed > 0 ? ` (${failed} gagal)` : '';
        message.channel.send(`✅ **${added} lagu** dari playlist berhasil ditambahkan!${failMsg}`);
    }
}

export { resolveTracks, resolvePlaylistBackground };
