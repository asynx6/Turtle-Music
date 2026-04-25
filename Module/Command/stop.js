async function stop(message, queue, shoukaku, idleTimers) {
    const serverQueue = queue.get(message.guild.id);
    const { channel } = message.member.voice;

    if (!serverQueue) return message.reply("Lagi nggak ada musik yang muter! 😂");

    if (!channel || channel.id !== serverQueue.voiceChannel.id) {
        return message.reply("Masuk ke Voice Channel gue dulu kalau mau matiin!");
    }

    const currentSong = serverQueue.songs[0];
    const requester = currentSong?.requester;
    
    const isUserOwner = message.guild.ownerId === message.author.id;
    const isUserAdmin = message.member.permissions.has('Administrator');
    const isRequesterOwner = message.guild.ownerId === requester?.id;
    const isSongRequester = message.author.id === requester?.id;

    let canStop = false;
    if (isUserOwner) canStop = true;
    else if (isRequesterOwner && !isUserOwner) canStop = false;
    else if (isUserAdmin || isSongRequester) canStop = true;

    if (!canStop) {
        if (isRequesterOwner) {
            return message.reply(`**Kasta Tertinggi!** Ini lagu punya **Owner Discord**, Admin pun nggak boleh stop paksa!`);
        }
        return message.reply(`Lo bukan Admin atau yang request lagu ini!`);
    }

    if (idleTimers && idleTimers.has(message.guild.id)) {
        clearTimeout(idleTimers.get(message.guild.id));
        idleTimers.delete(message.guild.id);
    }

    serverQueue.songs = [];

    if (serverQueue.player) {
        serverQueue.player.removeAllListeners('end');
        serverQueue.player.stopTrack();
    }

    await shoukaku.leaveVoiceChannel(message.guild.id);
    queue.delete(message.guild.id);

    return message.reply("Musik berhenti Cabut dulu ya.");
}

export default stop;