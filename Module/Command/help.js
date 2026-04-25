import { EmbedBuilder } from 'discord.js';
import { getLogo } from '../function/fucntion.js';

async function help(message) {
    const embed = new EmbedBuilder()
        .setAuthor({ 
            name: 'Turtle Music - Command Center', 
            iconURL: message.client.user.displayAvatarURL()
        })
        .setTitle('🎵 Panduan Lengkap Penggunaan Bot')
        .setDescription(`Selamat datang di **Turtle Music**! Gunakan prefix \`${process.env.PREFIX}\` sebelum mengetik command.\n\n---`)
        .setColor('#ff0000')
        .setThumbnail(message.client.user.displayAvatarURL())
        .addFields(
            { 
                name: '🎶 Music Commands', 
                value: `\`${process.env.PREFIX}play [judul/link]\` - Putar lagu (YouTube/Spotify).\n\`${process.env.PREFIX}skip\` - Lewati lagu sekarang.\n\`${process.env.PREFIX}stop\` - Matikan musik & hapus antrean.\n\`${process.env.PREFIX}queue\` - Liat daftar antrean lagu.\n\`${process.env.PREFIX}pause\` - Jeda musik.\n\`${process.env.PREFIX}resume\` - Lanjutin musik. \n\`${process.env.PREFIX}nowplaying\` - Lihat info lagu yang sedang diputar. \n\`${process.env.PREFIX}repeat\` - Aktifkan/Matikan mode repeat.`, 
                inline: false 
            },
            { 
                name: '⚖️ Aturan Perizinan (Permissions)', 
                value: `Agar tertib, beberapa command (seperti \`${process.env.PREFIX}stop\` & \`${process.env.PREFIX}skip\` & \`${process.env.PREFIX}pause\` & \`${process.env.PREFIX}resume\` & \`${process.env.PREFIX}repeat\`) punya aturan:\n\n` +
                       '👑 **Server Owner** - Punya kuasa penuh (Dewa).\n' +
                       '🛠️ **Administrator** - Bisa stop/skip lagu siapa saja.\n' +
                       '🎧 **Requester** - Bisa stop/skip lagu yang DIA request sendiri.\n' +
                       '🚫 **User Biasa** - Gak bisa matiin lagu milik orang lain atau Owner.',
                inline: false
            },
            {
                name: '💡 Tips',
                value: '• Masukin Link Spotify Playlist? Bisa banget! Bot bakal proses di background biar musik langsung jalan.\n• Masukin lagu slowed/reverb? Bot bakal cariin versi terbaik buat lo.',
                inline: false
            }
        )
        .setFooter({ 
            text: 'High Fidelity Audio • Turtle Music', 
            iconURL: message.client.user.displayAvatarURL()
        })
        .setTimestamp();

    return message.channel.send({ embeds: [embed] });
}

export default help;