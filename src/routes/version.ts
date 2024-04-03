import app, { config } from "..";
import { Aphrodite, ApiError } from "../utils/error";
import UAParser from "../utils/version";

app.get("/fortnite/api/version", (c) => {

    const version = UAParser.parse(c.req.header("user-agent"));
    if (!version) return c.sendError(Aphrodite.internal.invalidUserAgent)

    return c.json({
        app: "fortnite",
        serverDate: new Date().toISOString(),
        overridePropertiesVersion: "unknown",
        cln: version.cl,
        build: "444",
        moduleName: "Fortnite-Core",
        buildDate: new Date().toISOString(),
        version: version.season,
        branch: `Release-${version.season}`,
        modules: {
            "Epic-LightSwitch-AccessControlCore": {
                cln: "17237679",
                build: "b2130",
                buildDate: new Date().toISOString(),
                version: "1.0.0",
                branch: "trunk"
            },
            "epic-xmpp-api-v1-base": {
                cln: "5131a23c1470acbd9c94fae695ef7d899c1a41d6",
                build: "b3595",
                buildDate: "2019-07-30T09:11:06.587Z",
                version: "0.0.1",
                branch: "master"
            },
            "epic-common-core": {
                cln: "17909521",
                build: "3217",
                buildDate: "2021-10-25T18:41:12.486Z",
                version: "3.0",
                branch: "TRUNK"
            }
        }
    });
});

app.get("/fortnite/api/v2/versioncheck/:platform", (c) => {
    //Ima add the version check later
    //TODO: Add a middleware that disallows all unknown user agents

    const version = UAParser.parse(c.req.header("user-agent"));
    if (!version) return c.sendError(Aphrodite.internal.invalidUserAgent)

    if (!UAParser.isAllowedBuild(version.build)) {
        return c.json({
            type: "SOFT_UPDATE",
            provided: version.season,
            allowed: config.ALLOWED_SEASONS
        }, 418);
    }

    return c.json({
        type: "NO_UPDATE"
    });
});
