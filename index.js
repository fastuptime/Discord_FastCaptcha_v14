const {
    Client,
    Collection,
    Discord,
    Attachment,
    ActivityType
} = require('discord.js');
const client = new Client({
    intents: 32767
});
const { CaptchaGenerator } = require('captcha-canvas');
const fs  = require('fs');
const colors = require('colors');
const {
    JsonDatabase
} = require('wio.db');
let db = new JsonDatabase({
    databasePath: './databases/verify.json'
});

global.moment = require('moment');
global.config = require('./config.js');

require("./load.js")(client);

client.on('ready', () => {
    console.log(`${colors.bgCyan('[BOT]').black} --> ${colors.green('Bot Başarıyla Aktif Edildi!')} Botun Adı: ${colors.green(client.user.username)} | Botun ID'si: ${colors.green(client.user.id)}`.green);
    client.user.setPresence({
        activities: [{
            name: 'FastCaptcha',
            type: 0
        }],
        status: 'idle'
    });
});

function ID(length) {
    let result = '';
    const characters = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * charactersLength));
    return result;
}

client.on('guildMemberAdd', async (member) => {
    if (member.guild.id !== config.serverID) return;
    member.roles.add(config.role.unregistered);
    const id = ID(5);
    if (db.has(`captcha.${member.id}`)) id = db.get(`captcha.${member.id}.code`);
    else {
        db.set(`captcha.${member.id}`, {
            code: id,
            date: moment().format('DD/MM/YYYY HH:mm:ss')
        });
    }

    const captcha = new CaptchaGenerator()
        .setDimension(170, 470) 
        .setCaptcha({text: `FastC-${id}`, size: 90})
        .setDecoy({opacity: 0.8})
        const buffer = captcha.generateSync();
        captcha.text
    
    fs.writeFileSync(`./captcha/${member.id}.png`, buffer);

    member.send({
        content: `Merhaba ${member}, Sunucuya Hoşgeldin! Lütfen Aşağıdaki Resimdeki Kodu Doğrula!\n\n**Örnek:**\n\`\`\`/verify FastC-12345\`\`\``,
        files: [{
            attachment: `./captcha/${member.id}.png`,
            name: `${member.id}.png`
        }]
    }).finally(() => {
        fs.unlinkSync(`./captcha/${member.id}.png`);
    });
});

client.login(config.token).catch(() => console.log(`${colors.bgRed('[HATA]').black} --> ${colors.red('Botun Tokeni Geçersiz! Lütfen Tokeni Kontrol Ediniz!')}`.red));
