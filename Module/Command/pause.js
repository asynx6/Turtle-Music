async function pause(message, queue) {
    const serverQueue = queue.get(message.guild.id);
    const { channel } = message.member.voice;

    if (!serverQueue) return message.reply("Lagi nggak ada musik yang bisa di-pause😂");

    if (!channel || channel.id !== serverQueue.voiceChannel.id) {
        return message.reply("Masuk ke Voice Channel gue dulu kalau mau nge-pause!");
    }

    const player = serverQueue.player;
    
    if (player.paused) {
        return message.reply(`Musiknya kan udah dijeda, nggak perlu di-pause lagi. Ketik \`${prefix}resume\` kalau mau lanjut!`);
    }

    const currentSong = serverQueue.songs[0];
    const requester = currentSong?.requester;
    
    const isUserOwner = message.guild.ownerId === message.author.id;
    const isUserAdmin = message.member.permissions.has('Administrator');
    const isRequesterOwner = message.guild.ownerId === requester?.id;
    const isSongRequester = message.author.id === requester?.id;

    let canPause = false;

    if (isUserOwner) {
        canPause = true;
    } 
    else if (isRequesterOwner && !isUserOwner) {
        canPause = false; 
    }
    else if (isUserAdmin || isSongRequester) {
        canPause = true;
    }

    if (!canPause) {
        if (isRequesterOwner) {
            return message.reply(`**Kasta Tertinggi!** Ini lagu request-an **Owner Discord**, jangan asal di-pause ya!`);
        }
        return message.reply(`Lo bukan Admin atau yang request lagu ini, nggak punya hak!`);
    }

    try {
        await player.setPaused(true); 
        return message.reply(`⏸ **Musik dijeda!** Ketik \`${process.env.PREFIX}resume\` untuk lanjut!`);
    } catch (err) {
        console.error("Error Pause:", err);
        return message.reply("Duh, gagal nge-pause musiknya! Coba lagi nanti.");
    }
}

export default pause;