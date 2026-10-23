import { tool } from "ai";
import { z } from "zod";
import {
    formatTavilyResultsForPrompt,
    searchWeb,
    type TavilySearchResponse,
} from "./tavily.js";

export type WebSearchToolOptions = {
    /** Injected search implementation (defaults to Tavily). */
    search?: (query: string) => Promise<TavilySearchResponse>;
    /** Called after a successful search so the caller can persist citations. */
    onResults?: (response: TavilySearchResponse) => void;
};

/**
 * Builds the `web_search` agent tool.
 *
 * The tool result is a prompt-ready block with `[W1]`-style source labels, so
 * the model can cite web sources inline. `onResults` lets the chat pipeline
 * add those sources to the persisted assistant message citations.
 */
export function createWebSearchTool(options: WebSearchToolOptions = {}) {
    const search = options.search ?? searchWeb;

    return tool({
        description:
            "Search the web for up-to-date information outside the workspace sources.",
        inputSchema: z.object({
            query: z
                .string()
                .min(1)
                .describe("The search query for current web information"),
        }),
        execute: async ({ query }) => {
            const results = await search(query);
            options.onResults?.(results);
            return formatTavilyResultsForPrompt(results);
        },
    });
}
