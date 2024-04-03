import app from "..";

app.post("/datarouter/api/v1/public/data", (c) => {

    return c.sendStatus(204)

})