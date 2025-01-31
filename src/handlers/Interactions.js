const { MessageActionRow, MessageButton } = require("discord.js");
const CRUD = require("./Database.js");

const row = new MessageActionRow().addComponents(
    new MessageButton()
        .setCustomId("dismiss")
        .setLabel("Dismiss")
        .setStyle("SECONDARY"),
    new MessageButton()
        .setCustomId("block")
        .setLabel("Block")
        .setStyle("DANGER")
);

function ButtonInteraction(interaction) {
    // Handler for button interactions, located below messages

    const hasAuth = interaction.member.roles.cache.some(
        role => role.name === "APFP Auth"
    ); // Checks if user has privelege to approve / deny requests (APFP Auth)
    if (!hasAuth && interaction.customId !== "deny")
        return interaction.reply({
            content: "You do not have authorization to do this",
            ephemeral: true,
        });

    switch (
        interaction.customId // Check which button was clicked
    ) {
        case "approve":
            if (!interaction.message.embeds[0])
                return interaction.reply({
                    content: "Image has already been approved / denied",
                    ephemeral: true,
                }); // Checks if request has already been approved / denied
            CRUD.create({
                uid: interaction.message.embeds[0].author.name,
                img: interaction.message.embeds[0].thumbnail.url,
                aimg: interaction.message.embeds[0].image.url,
            });
            return interaction.update({
                components: [],
                content: "Image request approved",
            });
        case "deny":
            if (!interaction.message.embeds[0])
                return interaction.reply({
                    content: "Image has already been approved / denied",
                    ephemeral: true,
                }); // Checks if request has already been approved / denied
            if (
                interaction.user.id !==
                    interaction.message.embeds[0].author.name &&
                !hasAuth
            )
                return interaction.reply({
                    content: "You do not have authorization to do this",
                    ephemeral: true,
                });
            if (!hasAuth)
                return interaction.update({
                    components: [],
                    content: "Image request denied",
                });
            else
                return interaction.update({
                    components: [row],
                    content: "Image request denied",
                });
        case "block":
            interaction.member.roles.add(
                interaction.guild.roles.cache.find(
                    role => role.name == "APFP Blacklist"
                )
            ); // Adds blacklist role
            return interaction.update({
                components: [],
                content: "User blocked from further requests",
            });
        case "dismiss":
            return interaction.update({
                components: [],
                content: "Image request denied",
            });
        default:
            // Runs if somehow a different buttonId was given
            return interaction.reply({
                content: "Invalid button Id",
                ephemeral: true,
            });
    }
}

async function CommandInteraction(client, interaction) {
    // Handler for / commands
    const bgChannel = interaction.guild.channels.cache.find(
        channel => channel.name === "apfp-requests"
    ).id; // Gets id of apfp-requests channel from name search

    if (interaction.channel.name !== "apfp-requests")
        return interaction.reply({
            content: `This command must be run in <#${bgChannel}>`,
            ephemeral: true,
        });

    const command = client.commands.get(interaction.commandName); // Get / command

    if (!command) return;
    try {
        // Dispatch command to command files accordingly
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        return interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
        });
    }
}

module.exports = {
    ButtonInteraction,
    CommandInteraction,
};
