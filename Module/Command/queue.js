import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { formatTime, getLogo } from '../function/fucntion.js';

async function queueee(message, serverQueue) {
    if (!serverQueue || serverQueue.songs.length === 0) {
        return message.reply("Antrean lagi kosong melompong, Putar lagu dulu dong.");
    }

    const songs = serverQueue.songs;
    const songsPerPage = 10;
    let currentPage = 0;

    const generateEmbed = (page) => {
        const start = (page * songsPerPage) + 1; 
        const end = start + songsPerPage;
    
        const currentSongs = songs.slice(start, end);
        const totalPages = Math.ceil((songs.length - 1) / songsPerPage) || 1;

        const currentSong = songs[0];
        const totalDuration = songs.reduce((acc, song) => acc + (song.info.length || 0), 0);

        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: `Antrean Musik - ${message.guild.name}`, 
                iconURL: getLogo(1) 
            })
            .setThumbnail(currentSong.info.artworkUrl || currentSong.info.thumbnail)
            .addFields({ 
                name: '🎵 Sedang Diputar:', 
                value: `[${currentSong.info.title}](${currentSong.info.uri})\n• Requester: \`${currentSong.requester.tag}\``,
                inline: false 
            });

        let queueDescription = "";
        if (currentSongs.length > 0) {
            queueDescription = currentSongs.map((song, index) => {
                const title = song.info?.title || "Loading...";
                return `**${start + index}.** [${title}](${song.info?.uri || '#'}) - \`${formatTime(song.info?.length || 0)}\``;
            }).join('\n');
        } else {
            queueDescription = "*Tidak ada lagu selanjutnya dalam antrean.*";
        }

        embed.addFields({ 
            name: `⏳ Antrean Selanjutnya (Halaman ${page + 1}/${totalPages}):`, 
            value: queueDescription.substring(0, 1024), 
            inline: false 
        });

        embed.setFooter({ 
            text: `Total: ${songs.length} Lagu • Durasi: ${formatTime(totalDuration)} • Halaman ${page + 1}/${totalPages}`,
            iconURL: message.client.user.displayAvatarURL()
        });

        return embed;
    };
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('⬅️ Back')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next ➡️')
            .setStyle(ButtonStyle.Primary)
    );

    const initialEmbed = generateEmbed(currentPage);
    const msg = await message.channel.send({ 
        embeds: [initialEmbed], 
        components: songs.length > songsPerPage + 1 ? [row] : [] 
    });

    if (songs.length <= songsPerPage + 1) return;
    const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000
    });

    collector.on('collect', async (i) => {
        if (i.user.id !== message.author.id) {
            return i.reply({ content: "Lu gak bisa klik tombol ini, Panggil command-nya sendiri.", ephemeral: true });
        }

        const totalPages = Math.ceil((songs.length - 1) / songsPerPage);

        if (i.customId === 'prev') {
            currentPage = currentPage > 0 ? currentPage - 1 : totalPages - 1;
        } else if (i.customId === 'next') {
            currentPage = currentPage + 1 < totalPages ? currentPage + 1 : 0;
        }

        await i.update({ embeds: [generateEmbed(currentPage)], components: [row] });
    });

    collector.on('end', () => {
        msg.edit({ components: [] }).catch(() => null);
    });
}

export default queueee;