const {
    EmbedBuilder
} = require("discord.js");
const {
    JsonDatabase
} = require('wio.db');
let db = new JsonDatabase({
    databasePath: './databases/verify.json'
});

module.exports = {
    name: "verify",
    usage: "/verify <code>",
    options: [
        {
            name: "code",
            description: "Doğrulama kodu",
            type: 3, // Integer => 4 | String => 3 | Boolean => 5 | User => 6 | Channel => 7 | Role => 8
            required: true
        }
    ],
    category: "Bot",
    description: "Resimdeki kodu yazarak doğrulama yaparsınız.",
    run: async (client, interaction) => {
        let code = interaction.options.getString("code"); 
        code = code.replace("FastC-","")
        let data = db.get(`captcha.${interaction.user.id}`);
        if (!data) return interaction.reply({
            content: "Veri tabanında sizin için bir doğrulama kodu bulunamadı.",
            ephemeral: true
        });

        if (data.code !== code) return interaction.reply({
            content: "Girdiğiniz kod yanlış. **Büyük-küçük harf** duyarlılığına dikkat edin.",
            ephemeral: true
        });

        let guild = client.guilds.cache.get(config.serverID);
        let member = guild.members.cache.get(interaction.user.id);
        member.roles.add(config.role.registered);
        member.roles.remove(config.role.unregistered);
        db.delete(`captcha.${interaction.user.id}`);
        interaction.reply({
            content: "Doğrulama başarılı. Artık sunucuya erişebilirsiniz. :)",
            ephemeral: true
        });
    }
}