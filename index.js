import 'dotenv/config';
import { Client, GatewayIntentBits, ActivityType, EmbedBuilder} from 'discord.js';
import { Shoukaku, Connectors } from 'shoukaku';
// Import Command
import play from './Module/Command/play.js';
import stop from './Module/Command/stop.js';
import skip from './Module/Command/skip.js';
import help from './Module/Command/help.js';
import queueee from './Module/Command/queue.js';
import resume from './Module/Command/resume.js';
import pause from './Module/Command/pause.js';
import nowplaying from './Module/Command/nowplaying.js';
import repeat from './Module/Command/repeat.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const Nodes = [{
    name: 'Main-Node',
    url: `${process.env.LAVA_HOST}:${process.env.LAVA_PORT}`,
    auth: process.env.LAVA_PASS,
    secure: process.env.LAVA_SECURE === 'true'
}];

const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);
const queue = new Map();
const idleTimers = new Map();

shoukaku.on('ready', (name) => console.log(`[LAVALINK] Node ${name} is connected.`));
shoukaku.on('error', (name, error) => console.error(`[LAVALINK] Node ${name} error:`, error));

client.once("ready", () => {
    console.log(`[DISCORD] Bot is online as ${client.user.tag}`);
    client.user.setPresence({ status: 'dnd' });
    client.user.setActivity(`${process.env.PREFIX}help | Turtle Music`, { type: ActivityType.Listening });
});
client.on('voiceStateUpdate', (oldState, newState) => {
    const guildId = oldState.guild.id;
    const serverQueue = queue.get(guildId);
    if (!serverQueue) return;

    const botMember = oldState.guild.members.me;
    const botChannel = botMember.voice.channel;
    if (botChannel) {
        const humans = botChannel.members.filter(m => !m.user.bot).size;

        if (humans === 0) {
            if (!idleTimers.has(guildId)) {
                const timer = setTimeout(() => {
                    const currentQueue = queue.get(guildId);
                    if (currentQueue) {
                        currentQueue.textChannel.send("Karena udah nggak ada orang, gue cabut ya.");
                        
                        if (currentQueue.player) currentQueue.player.stopTrack();
                        shoukaku.leaveVoiceChannel(guildId).catch(() => null);
                        queue.delete(guildId);
                    }
                    idleTimers.delete(guildId);
                }, 60000);

                idleTimers.set(guildId, timer);
            }
        } else {
            if (idleTimers.has(guildId)) {
                clearTimeout(idleTimers.get(guildId));
                idleTimers.delete(guildId);
            }
        }
    }
    const isBotAffected = oldState.member.id === client.user.id && !newState.channelId;
    
    if (isBotAffected) {
        if (idleTimers.has(guildId)) {
            clearTimeout(idleTimers.get(guildId));
            idleTimers.delete(guildId);
        }
        if (serverQueue.player) {
            serverQueue.player.stopTrack();
        }
        shoukaku.leaveVoiceChannel(guildId).catch(() => null); 
        queue.delete(guildId);
    }
});
client.on('messageCreate', async (message) => {

    const mentionRegex = new RegExp(`^<@!?${client.user.id}>( |)$`);
    if (mentionRegex.test(message.content)) {
        const embedMention = new EmbedBuilder()
            .setAuthor({ 
                name: `Halo! Aku ${client.user.username}`, 
                iconURL: client.user.displayAvatarURL() 
            })
            .setTitle('🎵 Musik Berkualitas, Tanpa Ribet!')
            .setDescription(
                `Hai <@${message.author.id}>! Perlu bantuan muter lagu?\n\n` +
                `Gue siap nemenin lo dengerin playlist **Spotify** atau **YouTube** dengan suara jernih.`
            )
            .addFields(
                { name: '❓ Bingung Cara Pakenya?', value: `Ketik \`${process.env.PREFIX}help\` buat liat semua daftar perintah gue.`, inline: true },
                { name: '⌨️ Prefix Gue:', value: `\`${process.env.PREFIX}\``, inline: true }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/915960742740639843/1487441613423775794/633f7d5dc42733f6deb2bbadd78180ed.jpg?ex=69c92773&is=69c7d5f3&hm=1d34867734da87b498574db57f5068cb3df344fdead94ebac86ab2a13de729b9&')
            .setFooter({ text: 'Music High Audio - Turtle Music', iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [embedMention] });
    }
    if (message.author.bot || !message.content.startsWith(process.env.PREFIX)) return;
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    try {
        if (command === 'play' || command === 'p') {
            play(message, args, shoukaku, queue, idleTimers);
        } 
        else if (command === 'stop' || command === 's') {
            stop(message, queue, shoukaku);
        }
        else if (command === 'skip' || command === 'sk') {
            skip(message, queue);
        }
        else if (command === 'help' || command === 'h') {
            help(message);
        } 
        else if (command === 'queue' || command === 'q') {
            queueee(message, queue.get(message.guild.id));
        }
        else if (command === 'resume' || command === 'r') {
            resume(message, queue);
        }
        else if (command === 'pause' || command === 'ps') {
            pause(message, queue);
        }
        else if (command === 'nowplaying' || command === 'np') {
            nowplaying(message, queue);
        }
        else if (command === 'repeat' || command === 'rp') {
            repeat(message, args, queue);
        }
        else {
            message.reply("Command gak ada, coba ketik \`${process.env.PREFIX}help\` buat liat daftar command yang ada.");
        }
    } catch (err) {
        console.error("Handler Error:", err);
        message.reply("Ada error pas jalanin command itu!");
    }
});

client.login(process.env.DISCORD_TOKEN);