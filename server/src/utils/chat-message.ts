import { isTextUIPart, type UIMessage } from "ai";

/**
 * Extracts and concatenates all text parts from a UI message.
 *
 * AI SDK v5+ messages are represented as `parts`; older payloads may still
 * contain a `content` string, so both shapes are supported.
 *
 * @param message - UI message from the client or the streamed response
 * @returns Trimmed plain text (empty string when the message has no text)
 */
export function getTextFromUIMessage(message: UIMessage): string {
    const parts = Array.isArray(message.parts) ? message.parts : [];
    const text = parts
        .filter(isTextUIPart)
        .map((part) => part.text)
        .join("")
        .trim();

    if (text) {
        return text;
    }

    // Backwards compatibility for clients that still send `content`.
    const legacyContent = (message as UIMessage & { content?: unknown }).content;
    return typeof legacyContent === "string" ? legacyContent.trim() : "";
}

/**
 * Returns the text of the most recent user message.
 *
 * @param messages - Full client message history
 * @returns Trimmed text, or an empty string when no user text exists
 */
export function getLastUserMessageText(messages: UIMessage[]): string {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index];
        if (!message || message.role !== "user") {
            continue;
        }

        const text = getTextFromUIMessage(message);
        if (text) {
            return text;
        }
    }

    return "";
}

/**
 * Builds a short conversation title from the first user message.
 *
 * @param text - User message text
 * @param maxLength - Maximum title length (default 60)
 * @returns Single-line title, or `"New conversation"` for blank input
 */
export function buildConversationTitle(text: string, maxLength = 60): string {
    const normalized = text.replace(/\s+/g, " ").trim();

    if (!normalized) {
        return "New conversation";
    }

    if (normalized.length <= maxLength) {
        return normalized;
    }

    const truncated = normalized.slice(0, maxLength - 1).trimEnd();
    return `${truncated}…`;
}
