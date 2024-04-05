import app from "..";
import { getACIDFromJWT } from "../utils/auth";
import { Aphrodite } from "../utils/error";

// Does not have auth requirement in latest version, but ima add it anyway because it's stupid not to
app.post("/datarouter/api/v1/public/data", (c) => {
    const accountId = getACIDFromJWT(c);
    if (!accountId) return c.sendError(Aphrodite.authentication.invalidToken);
    return c.sendStatus(204)
})