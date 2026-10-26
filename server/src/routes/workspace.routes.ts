import { Router } from "express";
import {
    createWorkspace,
    deleteWorkspace,
    getWorkspace,
    listWorkspaces,
    updateWorkspace,
} from "../controllers/workspace.controller.js";
import { requireAuth } from "../middleware/require-user.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { artifactRoutes } from "./artifact.routes.js";
import { chatRoutes } from "./chat.routes.js";
import { conversationRoutes } from "./conversation.routes.js";
import { sourceRoutes } from "./source.routes.js";

export const workspaceRoutes = Router();

workspaceRoutes.use(requireAuth);

workspaceRoutes.get("/", asyncHandler(listWorkspaces));
workspaceRoutes.post("/", asyncHandler(createWorkspace));
workspaceRoutes.get("/:workspaceId", asyncHandler(getWorkspace));
workspaceRoutes.patch("/:workspaceId", asyncHandler(updateWorkspace));
workspaceRoutes.delete("/:workspaceId", asyncHandler(deleteWorkspace));

// Nested routers inherit `requireAuth` from the workspace router above.
workspaceRoutes.use("/:workspaceId/sources", sourceRoutes);
workspaceRoutes.use("/:workspaceId/artifacts", artifactRoutes);
workspaceRoutes.use("/:workspaceId/conversations", conversationRoutes);
workspaceRoutes.use("/:workspaceId/chat", chatRoutes);