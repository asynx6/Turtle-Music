async function resume(message, queue) {
    const serverQueue = queue.get(message.guild.id);
    const { channel } = message.member.voice;

    if (!serverQueue) return message.reply("Lagi nggak ada musik yang bisa dilanjutin😂");

    if (!channel || channel.id !== serverQueue.voiceChannel.id) {
        return message.reply("Masuk ke Voice Channel gue dulu kalau mau lanjutin musik!");
    }

    const player = serverQueue.player;

    if (!player.paused) {
        return message.reply("Musiknya kan lagi jalan, nggak perlu di-resume lagi!");
    }

    const currentSong = serverQueue.songs[0];
    const requester = currentSong?.requester;
    
    const isUserOwner = message.guild.ownerId === message.author.id;
    const isUserAdmin = message.member.permissions.has('Administrator');
    const isRequesterOwner = message.guild.ownerId === requester?.id;
    const isSongRequester = message.author.id === requester?.id;

    let canResume = false;

    if (isUserOwner) {
        canResume = true;
    } 
    else if (isRequesterOwner && !isUserOwner) {
        canResume = false; 
    }
    else if (isUserAdmin || isSongRequester) {
        canResume = true;
    }

    if (!canResume) {
        if (isRequesterOwner) {
            return message.reply(`**Kasta Tertinggi!** Ini lagu request-an **Owner Discord**, cuma beliau yang boleh lanjutin!`);
        }
        return message.reply(`Lo bukan Admin atau yang request lagu ini, nggak punya hak!`);
    }

    try {
        await player.setPaused(false); 
        return message.reply("▶ **Musik dilanjutkan!** Selamat dengerin lagi ya.");
    } catch (err) {
        console.error("Error Resume:", err);
        return message.reply("Duh, gagal lanjutin musiknya! Coba lagi nanti.");
    }
}

export default resume;