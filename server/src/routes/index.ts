import type { Express } from "express";

import { memoryRoutes } from "./memory.routes.js";
import { workspaceRoutes } from "./workspace.routes.js";

export function registerRoutes(app: Express): void {
    app.use("/api/workspaces", workspaceRoutes);
    app.use("/api/memories", memoryRoutes);
}
