import type { Request, Response } from "express";
import { safeValidateUIMessages } from "ai";
import { streamWorkspaceChat } from "../services/chats.service.js";
import { ValidationError } from "../types/app-error.js";
import { getZodFieldErrors } from "../utils/zod-error.js";
import { chatBodySchema } from "../validators/chat.validator.js";
import { workspaceIdParamSchema } from "../validators/workspace.validator.js";

function parseWorkspaceId(params: Request["params"]) {
    const parsed = workspaceIdParamSchema.safeParse(params);

    if (!parsed.success) {
        throw new ValidationError(
            "Invalid workspace id",
            getZodFieldErrors(parsed.error),
        );
    }

    return parsed.data;
}

function parseChatBody(body: unknown) {
    const parsed = chatBodySchema.safeParse(body);

    if (!parsed.success) {
        throw new ValidationError(
            "Invalid chat request",
            getZodFieldErrors(parsed.error),
        );
    }

    return parsed.data;
}

export async function streamChat(req: Request, res: Response) {
    const { workspaceId } = parseWorkspaceId(req.params);
    const input = parseChatBody(req.body);
    const validation = await safeValidateUIMessages({
        messages: input.messages,
    });

    if (!validation.success) {
        throw new ValidationError("Invalid chat messages", validation.error);
    }

    await streamWorkspaceChat(res, workspaceId, req.session.user.id, {
        conversationId: input.conversationId,
        messages: validation.data,
        model: input.model,
        webSearch: input.webSearch,
    });
}
