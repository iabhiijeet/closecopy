import express from 'express'

import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import cors from "cors";
import { registerRoutes } from "./routes/index.js";
// import { errorHandler } from "./middleware/error-handler.middleware.js";

import { inngest } from "./inngest/client.js";
import { serve } from "inngest/express";
import {functions} from "./inngest/index.js";
const app = express();
const PORT = process.env.PORT;
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";


app.use(
    cors({
        origin: clientUrl,
        credentials: true,
    }),
);
const port = process.env.PORT ?? 8080;

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json());

app.use("/api/inngest", serve({ client: inngest, functions }));

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(port, ()=>{
    console.log(`App is listening on ${port}`);
})