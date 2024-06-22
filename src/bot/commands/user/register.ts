import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMemberRoleManager, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction } from "discord.js";
import { and, eq } from "drizzle-orm";
import { db } from "../../..";
import { users } from "../../../database/models/users";

export const data = new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register for an account")
    .addStringOption((option) => option.setName("displayname").setDescription("Your desired display name").setRequired(true)
        .setRequired(true))
    .addStringOption(option => option.setName('email').setDescription('Your email address').setRequired(true))
    .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {

    await interaction.deferReply({ ephemeral: true });

    const user = interaction.user;
    const [dbUser] = await db.select().from(users).where(eq(users.discordId, user.id));
    if (dbUser) return interaction.editReply({ content: "You are already registered", });

    const modal = new ModalBuilder()
        .setCustomId("registerModal")
        .setTitle("Register")

    const displayNameInput = new TextInputBuilder()
        .setCustomId("registerModal_displayName")
        .setLabel("Display Name")
        .setPlaceholder("Enter your desired display name")
        .setRequired(true)
        .setMinLength(3)
        .setStyle(TextInputStyle.Short);

    const emailInput = new TextInputBuilder()
        .setCustomId("registerModal_email")
        .setLabel("Email")
        .setPlaceholder("Enter your email address")
        .setRequired(true)
        .setStyle(TextInputStyle.Short);

    const passwordInput = new TextInputBuilder()
        .setCustomId("registerModal_password")
        .setLabel("Password")
        .setPlaceholder("Enter your desired password")
        .setRequired(true)
        .setMinLength(8)
        .setStyle(TextInputStyle.Short);

    // Assuming displayNameInput and passwordInput are TextInputBuilder instances
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(displayNameInput);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(passwordInput);
    const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    interaction.customId = "registerModal";

    await interaction.showModal(modal);

}