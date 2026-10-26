import "./lib/env.js";

import express from "express";

import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import cors from "cors";
import { registerRoutes } from "./routes/index.js";

import { inngest } from "./inngest/client.js";
import { serve } from "inngest/express";
import { functions } from "./inngest/index.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";

const app = express();
const port = process.env.PORT ?? 8080;
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

app.disable("x-powered-by");

app.use(
    cors({
        origin: clientUrl,
        credentials: true,
    }),
);

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json({ limit: "2mb" }));

app.use("/api/inngest", serve({ client: inngest, functions }));
registerRoutes(app);

app.get("/", (_req, res) => {
    res.send("Hello World");
});

app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

app.listen(port, () => {
    console.log(`App is listening on ${port}`);
});
