import { Router } from "express";
import {
    createConversation,
    deleteConversation,
    getConversationMessages,
    listConversations,
} from "../controllers/conversation.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

export const conversationRoutes = Router({ mergeParams: true });

conversationRoutes.get("/", asyncHandler(listConversations));
conversationRoutes.post("/", asyncHandler(createConversation));
conversationRoutes.get(
    "/:conversationId/messages",
    asyncHandler(getConversationMessages),
);
conversationRoutes.delete(
    "/:conversationId",
    asyncHandler(deleteConversation),
);
