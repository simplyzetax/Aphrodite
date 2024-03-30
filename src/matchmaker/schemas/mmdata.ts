import { z } from "zod";

const mmDataSchema = z.object({
    playerId: z.string(),
    partyPlayerIds: z.array(z.string()),
    bucketId: z.string(),
    attributes: z.object({
        "player.season": z.number(),
        "player.option.partyId": z.string(),
        "player.userAgent": z.string(),
        "player.platform": z.string(),
        "player.option.linkType": z.string(),
        "player.preferredSubregion": z.string(),
        "player.input": z.string(),
        "playlist.revision": z.number(),
        "player.option.customKey": z.string().optional(),
        "player.option.fillTeam": z.boolean(),
        "player.option.linkCode": z.string().optional(),
        "player.option.uiLanguage": z.string(),
        "player.privateMMS": z.boolean(),
        "player.option.spectator": z.boolean(),
        "player.inputTypes": z.any(),
        "player.option.groupBy": z.string(),
        "player.option.microphoneEnabled": z.boolean(),
    }),
    expireAt: z.string(),
    nonce: z.string(),
});

export type MMData = z.infer<typeof mmDataSchema>;

export default mmDataSchema;