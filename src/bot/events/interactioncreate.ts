import { ChatInputCommandInteraction, EmbedBuilder, Events, ModalSubmitInteraction, type TextBasedChannel } from "discord.js";
import { client } from "../index.js";
import { db } from "../../index.js";
import { users } from "../../database/models/users.js";
import { eq } from "drizzle-orm";
import UUID from "../../utils/uuid.js";
import { profiles } from "../../database/models/profiles.js";

async function handleInteractionCreate(interaction: ChatInputCommandInteraction | ModalSubmitInteraction) {

    if (interaction.isModalSubmit()) {
        switch (interaction.customId) {
            case "registerModal": {
                const displayName = interaction.fields.getTextInputValue('registerModal_displayName');
                const password = interaction.fields.getTextInputValue('registerModal_password');
                const email = interaction.fields.getTextInputValue('registerModal_email');

                if (!displayName || !password || !email) return interaction.followUp({ content: "You must fill out all the fields", });

                const user = interaction.user;
                const [dbUser] = await db.select().from(users).where(eq(users.discordId, user.id));
                if (dbUser) return interaction.followUp({ content: "You are already registered", });

                const accountId = UUID.gr();

                await db.insert(users).values({
                    discordId: user.id,
                    displayName: displayName,
                    password: password,
                    accountId: accountId,
                    email: email,
                });

                const newProfiles = [
                    {
                        id: UUID.g(),
                        accountId: accountId,
                        type: "athena",
                        revision: 0,
                    },
                    {
                        id: UUID.g(),
                        accountId: accountId,
                        type: "common_core",
                        revision: 0,
                    },
                    {
                        id: UUID.g(),
                        accountId: accountId,
                        type: "creative",
                        revision: 0,
                    },
                ];

                await db.insert(profiles).values(newProfiles);

                return interaction.followUp({ content: "You have successfully registered with the display name: " + displayName });
            }
            default: {
                return interaction.followUp({ content: "This modal does not exist", });
            }
        }
    }

    if (interaction.isChatInputCommand()) {

        const command = client.commands.get(interaction.commandName);

        if (!command) await interaction.reply({ content: "This command does not exist", });

        try {
            await command.execute(interaction);
        } catch (error: any) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: "There was an error while executing this command!", });
            } else {
                await interaction.reply({ content: "There was an error while executing this command!", });
            }
        }
        return;
    }
}

export default {
    name: Events.InteractionCreate,
    once: false,
    execute: handleInteractionCreate,
};