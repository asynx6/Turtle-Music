async function skip(message, queue) {
    const serverQueue = queue.get(message.guild.id);
    const { channel } = message.member.voice;
    
    if (!serverQueue || !serverQueue.songs || serverQueue.songs.length === 0) {
        return message.reply("Lagi nggak ada musik yang muter, apa yang mau di-skip? 🤔");
    }

    if (!channel || channel.id !== serverQueue.voiceChannel.id) {
        return message.reply("Masuk ke Voice Channel dulu kalau mau nge-skip!");
    }

    const currentSong = serverQueue.songs[0];
    const requester = currentSong.requester;

    const isUserOwner = message.guild.ownerId === message.author.id;
    const isUserAdmin = message.member.permissions.has('Administrator');
    const isRequesterOwner = message.guild.ownerId === requester.id;
    const isSongRequester = message.author.id === requester.id;

    let canSkip = false;
    if (isUserOwner) {
        canSkip = true;
    } 
    else if (isRequesterOwner && !isUserOwner) {
        canSkip = false;
    }
    else if (isUserAdmin || isSongRequester) {
        canSkip = true;
    }

    if (!canSkip) {
        if (isRequesterOwner) {
            return message.reply(`Waduh! Ini lagu punya **Owner Discord**, kasta tertinggi! Nggak ada yang boleh skip selain beliau!`);
        }
        return message.reply(`Lo bukan Admin dan bukan yang request lagu ini, nggak punya hak!`);
    }

    if (serverQueue.player) {
        serverQueue.isSkipping = true;
        serverQueue.player.stopTrack();
        return message.reply(`⏭ Musik **${currentSong.info.title}** di-skip!`);
    } else {
        return message.reply("Gagal skip, player-nya lagi nggak ngerespon nih.");
    }
}

export default skip;