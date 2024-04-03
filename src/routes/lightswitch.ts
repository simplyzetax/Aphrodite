import app from "..";

app.get("/lightswitch/api/service/Fortnite/status", async (c) => {
    return c.json({
        serviceInstanceId: "fortnite",
        status: "UP",
        message: "Fortnite is online",
        maintenanceUri: null,
        overrideCatalogIds: [
            "a7f138b2e51945ffbfdacc1af0541053"
        ],
        allowedActions: [],
        banned: false,
        launcherInfoDTO: {
            "appName": "Fortnite",
            "catalogItemId": "4fe75bbc5a674f4f9b356b5c90567da5",
            "namespace": "fn"
        }
    });
});

app.get("/lightswitch/api/service/bulk/status", async (c) => {
    return c.json([{
        serviceInstanceId: "fortnite",
        status: "UP",
        message: "fortnite is up.",
        maintenanceUri: null,
        overrideCatalogIds: [
            "a7f138b2e51945ffbfdacc1af0541053"
        ],
        allowedActions: [
            "PLAY",
            "DOWNLOAD"
        ],
        banned: false,
        launcherInfoDTO: {
            appName: "Fortnite",
            catalogItemId: "4fe75bbc5a674f4f9b356b5c90567da5",
            namespace: "fn"
        }
    }]);
});