const {
    glob
} = require("glob");
const {
    promisify
} = require("util");
const globPromise = promisify(glob);
const {
    Collection,
    Discord
} = require("discord.js");
const colors = require('colors');
const {
    JsonDatabase
} = require('wio.db');
const fs = require('fs');
const moment = require('moment');

if (!fs.existsSync('./databases')) fs.mkdirSync('./databases', {
    recursive: true
});
if (!fs.existsSync('./logs')) fs.mkdirSync('./logs', {
    recursive: true
});

const db = new JsonDatabase({
    databasePath: "./databases/commands.json"
});

function clog(message) {
    console.log(`${colors.bgBlue(moment().format('DD/MM/YYYY HH:mm:ss')).black} - ${colors.bgCyan('[KOMUT KULLANIMI]').black} --> ${message}`.green);
    fs.appendFileSync('./logs/commands.log', `${moment().format('DD/MM/YYYY HH:mm:ss')} - [KOMUT KULLANIMI] --> ${message}\n`);
}

module.exports = function(client) {
    client.discord = Discord;
    client.commands = new Collection();
    client.slashCommands = new Collection();


    client.on("interactionCreate", async (interaction) => {
        if (interaction.isCommand()) {
            db.has(`totalCommandUsage`) ? db.add(`totalCommandUsage`, 1) : db.set(`totalCommandUsage`, 1);
            db.has(`totalCommandUsage_User_${interaction.user.id}`) ? db.add(`totalCommandUsage_User_${interaction.user.id}`, 1) : db.set(`totalCommandUsage_User_${interaction.user.id}`, 1);
            db.has(`totalCommandUsage_${interaction.commandName}`) ? db.add(`totalCommandUsage_${interaction.commandName}`, 1) : db.set(`totalCommandUsage_${interaction.commandName}`, 1);

            clog(`${interaction.user.tag} (${interaction.user.id}) tarafından ${colors.green(interaction.commandName)} komutu kullanıldı. Kullanıcı tarafından toplam ${db.get(`totalCommandUsage_User_${interaction.user.id}`)} komut kullanıldı. Bu komut ${db.get(`totalCommandUsage_${interaction.commandName}`)} kez kullanıldı. Toplamda ${db.get(`totalCommandUsage`)} komut kullanıldı.`.green);

            const command = client.slashCommands.get(interaction.commandName);
            if (!command) return interaction.followUp({
                content: 'an Erorr'
            });

            const args = [];

            for (let option of interaction.options.data) {
                if (option.type === 'SUB_COMMAND') {
                    if (option.name) args.push(option.name);
                    option.options?.forEach(x => {
                        if (x.value) args.push(x.value);
                    });
                } else if (option.value) args.push(option.value);
            }
            try {
                command.run(client, interaction)
            } catch (e) {
                interaction.followUp({
                    content: e.message
                });
            }
        }
    });

    handler(client);
    async function handler(client) {
        const slashCommands = await globPromise(
            `${process.cwd()}/commands/*.js`
        );

        const arrayOfSlashCommands = [];
        slashCommands.map((value) => {
            const file = require(value);
            if (!file.name) return;
            client.slashCommands.set(file.name, file);
            arrayOfSlashCommands.push(file);
        });
        client.on("ready", async () => {
            await client.application.commands.set(arrayOfSlashCommands).catch(console.error);
        });
    }
}