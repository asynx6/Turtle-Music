import { EmbedBuilder } from 'discord.js';
import { formatTime } from '../function/fucntion.js';

async function nowplaying(message, queue) {
    const serverQueue = queue.get(message.guild.id);

    if (!serverQueue || !serverQueue.songs[0]) {
        return message.reply("Lagi nggak ada musik yang muter, sepi amat kayak kuburan! 👻");
    }

    const song = serverQueue.songs[0];
    const player = serverQueue.player;

    const currentTime = player.position;
    const totalTime = song.info.length;
    
    const progressSize = 20;
    const progress = Math.round((currentTime / totalTime) * progressSize);
    const progressBar = "▬".repeat(Math.max(0, progress - 1)) + "🔘" + "▬".repeat(Math.max(0, progressSize - progress));

    const repeatStatus = serverQueue.repeat ? "ON" : "OFF";

    const embed = new EmbedBuilder()
        .setAuthor({ name: 'Sedang Memutar 🎵', iconURL: message.client.user.displayAvatarURL() })
        .setTitle(song.info.title)
        .setURL(song.info.uri)
        .setThumbnail(song.info.artworkUrl || song.info.thumbnail)
        .addFields(
            { 
                name: 'Progress', 
                value: `\`${formatTime(currentTime)}\` ${progressBar} \`${formatTime(totalTime)}\``, 
                inline: false 
            },
            { name: 'Source', value: `\`${song.info.author}\``, inline: true },
            { name: 'Requester', value: `${song.requester.tag}`, inline: true },
            { name: 'Repeat Mode', value: `\`${repeatStatus}\``, inline: true }
        )
        .setFooter({ text: 'Turtle Music • High Audio' })
        .setTimestamp();

    return message.channel.send({ embeds: [embed] });
}

export default nowplaying;