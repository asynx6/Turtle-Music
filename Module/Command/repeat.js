async function repeat(message, args, queue) {
    const serverQueue = queue.get(message.guild.id);
    if (!serverQueue) {
        return message.reply("Lagi nggak ada musik yang muter, apa yang mau di-repeat?");
    }

    const { channel } = message.member.voice;
    if (!channel || channel.id !== serverQueue.voiceChannel.id) {
        return message.reply("Masuk ke Voice Channel yang sama dulu dong!");
    }

    const currentSong = serverQueue.songs[0];
    const requester = currentSong.requester;
    
    const isUserOwner = message.guild.ownerId === message.author.id;
    const isUserAdmin = message.member.permissions.has('Administrator');
    const isRequesterOwner = message.guild.ownerId === requester.id;
    const isSongRequester = message.author.id === requester.id;

    let canToggle = false;
    if (isUserOwner) {
        canToggle = true;
    } 
    else if (isRequesterOwner && !isUserOwner) {
        canToggle = false; 
    }
    else if (isUserAdmin || isSongRequester) {
        canToggle = true;
    }

    if (isRequesterOwner && !isUserOwner) {
        return message.reply(`Waduh! Ini lagu punya **Owner Discord**, kasta tertinggi! Gak boleh di-repeat sembarangan!`);
    }

    if (!canToggle) {
        return message.reply(`Lo bukan Admin dan bukan yang request lagu ini, nggak punya hak!`);
    }

    serverQueue.repeat = !serverQueue.repeat;
    const status = serverQueue.repeat ? "**AKTIF**" : "**MATI**";
    
    return message.reply(`🔁**Repeat Mode:** ${status}`);
}

export default repeat;