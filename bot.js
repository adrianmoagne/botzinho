const { Client } = require('discord.js');
const client = new Client();
const PREFIX = '!'
const ytdl = require('ytdl-core');
const queue = new Map();

client.once('ready', () => {
    console.log(`${client.user.tag} logged in`);
});


client.on('message', async (message) => {
    if (message.author.bot) return;
    console.log(`${message.author.tag}: ${message.content}`)
    if (message.content.startsWith(PREFIX)) {
        const [COMAND, ...args] = message.content
            .trim()
            .substring(PREFIX.length)
            .split(/\s+/)
        console.log(COMAND);
        console.log(args);
        const serverQueue = queue.get(message.guild.id);
        console.log(serverQueue);
        console.log(queue);

        if (COMAND === 'kick') {
            if (!message.guild) return message.reply('Você não está em um server');
            if (!message.member.hasPermission) return message.reply('Você não tem permissão para isso');
            const user = message.mentions.users.first();
            console.log(user);
            if (user) {
                const member = message.guild.member(user);
                if (member) {
                    member.kick().then(() => {
                        message.reply(`O ${user.tag} foi de base`);
                    }).catch(err => {
                        // An error happened
                        // This is generally due to the bot not being able to kick the member,
                        // either due to missing permissions or role hierarchy
                        message.reply('I was unable to kick the member');
                        // Log the error
                        console.error(err);
                    });
                } else {
                    // The mentioned user isn't in this guild
                    message.reply("Não está no server!");
                }
            } else {
                message.reply("User wrong");
            }
        }

        if (COMAND === 'play') {
            if (message.member.voice.channel) {
                execute(message, serverQueue, args)
            }
        }

        if (COMAND === 'pause') {
            pause(message, serverQueue);
        }

        if (COMAND === 'resume') {
            resume(serverQueue);
        }
        if (COMAND === 'skip') {
            skip(serverQueue);
        }

        if (COMAND === 'stop') {
            stop(serverQueue);
        }
        if (COMAND === 'clear') {
            if (args.length != 0) {
                message.channel.bulkDelete(parseInt(args[0]));
            }
            else {
                message.channel.bulkDelete(2);
            }
        }

    }
});

async function execute(message, serverQueue, args) {

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
            "You need to be in a voice channel to play music!"
        );


    const songInfo = await ytdl.getInfo(args[0]);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

function pause(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );
    if (!serverQueue)
        return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.pause();
}


function resume(serverQueue) {
    serverQueue.connection.dispatcher.resume();
}

function skip(serverQueue) {
    serverQueue.connection.dispatcher.end();
}

function stop(serverQueue) {
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}
client.login('')