import { Router } from "express";
import { streamChat } from "../controllers/chat.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

export const chatRoutes = Router({ mergeParams: true });

chatRoutes.post("/", asyncHandler(streamChat));
