const express = require('express');
const Discord = require('discord.js');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

let client;

app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #282c34;
                        color: white;
                    }

                    form {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }

                    label {
                        margin-top: 10px;
                    }

                    input {
                        margin: 5px 0;
                        padding: 8px;
                    }

                    button {
                        margin-top: 10px;
                        padding: 8px;
                        background-color: #61dafb;
                        color: white;
                        cursor: pointer;
                        border: none;
                    }
                </style>
            </head>
            <body>
                <h1>Discord Bot Login</h1>
                <form action="/servers" method="post">
                    <label for="token">Bot Token:</label>
                    <input type="password" id="token" name="token" placeholder="Enter your bot token" required>
                    <button type="submit">Login</button>
                </form>
            </body>
        </html>
    `);
});

app.post('/servers', async (req, res) => {
    const botToken = req.body.token;

    client = new Discord.Client();

    try {
        await client.login(botToken);

        client.once('ready', () => {
            const guilds = client.guilds.cache.map(guild => ({
                id: guild.id,
                name: guild.name,
                iconURL: guild.iconURL({ format: 'png', size: 4096 }) || 'https://via.placeholder.com/100',
                channels: guild.channels.cache.filter(channel => channel.type === 'text').map(channel => ({
                    id: channel.id,
                    name: channel.name,
                })),
            }));

            res.send(`
                <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                display: flex;
                                flex-wrap: wrap;
                                justify-content: space-around;
                                background-color: #282c34;
                                color: white;
                            }

                            .server {
                                text-align: center;
                                margin: 20px;
                                cursor: pointer;
                                background-color: #61dafb;
                                padding: 10px;
                                border-radius: 5px;
                            }

                            .server img {
                                width: 100px;
                                height: 100px;
                                border-radius: 50%;
                                object-fit: cover;
                            }

                            .channel {
                                text-align: center;
                                margin: 20px;
                                cursor: pointer;
                                background-color: #61dafb;
                                padding: 10px;
                                border-radius: 5px;
                            }
                        </style>
                    </head>
                    <body>
                        ${guilds.map(guild => `
                            <div class="server" onclick="window.location.href='/servers/${guild.id}'">
                                <img src="${guild.iconURL}" alt="${guild.name} Logo">
                                <p>${guild.name}</p>
                            </div>
                        `).join('')}
                    </body>
                </html>
            `);
        });
    } catch (error) {
        console.error('Bot login error:', error.message);
        res.status(500).send('Bot login failed.');
    }
});


app.get('/servers/:id', (req, res) => {
    const serverId = req.params.id;
    const guild = client.guilds.cache.get(serverId);

    if (!guild) {
        res.status(404).send('Server not found.');
        return;
    }

    const channelsHTML = guild.channels.cache
        .filter(channel => channel.type === 'text')
        .map(channel => `
            <div class="channel" onclick="window.location.href='/servers/${serverId}/channels/${channel.id}'">
                <p>${channel.name}</p>
            </div>
        `)
        .join('');

    res.send(`
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: space-around;
                        background-color: #282c34;
                        color: white;
                    }

                    .channel {
                        text-align: center;
                        margin: 20px;
                        cursor: pointer;
                        background-color: #61dafb;
                        padding: 10px;
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <h1>${guild.name} Channels</h1>
                ${channelsHTML}
            </body>
        </html>
    `);
});

app.get('/servers/:id/channels/:channelId', (req, res) => {
    const serverId = req.params.id;
    const channelId = req.params.channelId;
    const guild = client.guilds.cache.get(serverId);
    const channel = guild.channels.cache.get(channelId);

    if (!guild || !channel || channel.type !== 'text') {
        res.status(404).send('Server or channel not found.');
        return;
    }

    res.send(`
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        background-color: #282c34;
                        color: white;
                    }

                    form {
                        text-align: center;
                        margin-top: 20px;
                    }

                    textarea {
                        width: 300px;
                        height: 100px;
                    }

                    button {
                        margin-top: 10px;
                        padding: 8px;
                        background-color: #61dafb;
                        color: white;
                        cursor: pointer;
                        border: none;
                    }
                </style>
            </head>
            <body>
                <h1>${guild.name} - ${channel.name}</h1>
                <form action="/servers/${serverId}/channels/${channelId}/send" method="post">
                    <label for="message">Message:</label>
                    <textarea id="message" name="message" required></textarea>
                    <button type="submit">Send Message</button>
                </form>
            </body>
        </html>
    `);
});

app.post('/servers/:id/channels/:channelId/send', async (req, res) => {
    const serverId = req.params.id;
    const channelId = req.params.channelId;
    const guild = client.guilds.cache.get(serverId);
    const channel = guild.channels.cache.get(channelId);

    if (!guild || !channel || channel.type !== 'text') {
        res.status(404).send('Server or channel not found.');
        return;
    }

    const messageContent = req.body.message;

    try {
        const sentMessage = await channel.send(messageContent);
        console.log(`Message sent successfully: ${sentMessage.content}`);
    } catch (error) {
        console.error('Message send error:', error.message);
        res.status(500).send(`Message send failed. Error: ${error.message}`);
    }
});


app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
