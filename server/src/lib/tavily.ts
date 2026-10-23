import {
    tavily,
    type TavilyClient,
    type TavilySearchOptions,
} from "@tavily/core";

/** Normalized web result used by the chat tool and message citations. */
export type TavilySearchResult = {
    title: string;
    url: string;
    content: string;
    score?: number;
    publishedDate?: string;
};

/** Normalized search response returned by {@link searchWeb}. */
export type TavilySearchResponse = {
    query: string;
    answer?: string;
    results: TavilySearchResult[];
};

/** Per-search overrides. Defaults keep agent latency and credit usage low. */
export type WebSearchOptions = {
    maxResults?: number;
    searchDepth?: "basic" | "advanced" | "fast" | "ultra-fast";
    topic?: "general" | "news" | "finance";
    includeAnswer?: boolean | "basic" | "advanced";
    /** Timeout in seconds. */
    timeout?: number;
};

/** Error raised when Tavily is unavailable, misconfigured, or rejects a query. */
export class TavilyError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        options?: ErrorOptions,
    ) {
        super(message, options);
        this.name = "TavilyError";
    }
}

let client: TavilyClient | null = null;
let clientKey: string | null = null;

/** Returns true when `TAVILY_API_KEY` is present. */
export function isTavilyConfigured(): boolean {
    return Boolean(process.env.TAVILY_API_KEY?.trim());
}

function getApiKey(): string {
    const apiKey = process.env.TAVILY_API_KEY?.trim();

    if (!apiKey) {
        throw new TavilyError("TAVILY_API_KEY is not configured");
    }

    return apiKey;
}

/**
 * Returns a singleton Tavily client.
 *
 * `TAVILY_API_BASE_URL` is optional and mainly useful for proxies or tests.
 */
function getTavilyClient(): TavilyClient {
    const apiKey = getApiKey();
    const apiBaseURL = process.env.TAVILY_API_BASE_URL?.trim() || undefined;
    const cacheKey = `${apiKey}:${apiBaseURL ?? ""}`;

    if (!client || clientKey !== cacheKey) {
        client = tavily({ apiKey, apiBaseURL });
        clientKey = cacheKey;
    }

    return client;
}

function normalizeScore(score: number | undefined): number | undefined {
    return typeof score === "number" && Number.isFinite(score)
        ? score
        : undefined;
}

/**
 * Runs a web search query via Tavily for the chat `web_search` tool.
 *
 * @param query - Natural-language search query from the model
 * @param options - Optional search overrides
 * @returns Normalized results with source URLs and an optional answer summary
 * @throws {TavilyError} When the key is missing or the Tavily request fails
 */
export async function searchWeb(
    query: string,
    options: WebSearchOptions = {},
): Promise<TavilySearchResponse> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
        throw new TavilyError("A non-empty search query is required");
    }

    const searchOptions: TavilySearchOptions = {
        searchDepth: options.searchDepth ?? "basic",
        maxResults: Math.min(Math.max(options.maxResults ?? 5, 1), 20),
        includeAnswer: options.includeAnswer ?? true,
        timeout: options.timeout ?? 20,
        ...(options.topic ? { topic: options.topic } : {}),
    };

    try {
        const response = await getTavilyClient().search(
            normalizedQuery,
            searchOptions,
        );

        return {
            query: normalizedQuery,
            answer:
                typeof response.answer === "string"
                    ? response.answer
                    : undefined,
            results: (response.results ?? []).map((result) => ({
                title: result.title?.trim() || result.url || "Untitled",
                url: result.url ?? "",
                content: result.content ?? "",
                score: normalizeScore(result.score),
                publishedDate: result.publishedDate || undefined,
            })),
        };
    } catch (error) {
        if (error instanceof TavilyError) {
            throw error;
        }

        const responseStatus =
            typeof error === "object" &&
            error !== null &&
            "response" in error &&
            typeof (error as { response?: { status?: unknown } }).response
                ?.status === "number"
                ? (error as { response: { status: number } }).response.status
                : undefined;
        const message = error instanceof Error ? error.message : String(error);
        // The SDK rethrows HTTP failures as plain errors prefixed with the status.
        const messageStatus = /^(\d{3})\b/.exec(message)?.[1];
        const status =
            responseStatus ?? (messageStatus ? Number(messageStatus) : undefined);

        throw new TavilyError(
            `Tavily search failed${status ? ` (HTTP ${status})` : ""}: ${message}`,
            status,
            { cause: error },
        );
    }
}

/**
 * Formats Tavily results into a prompt block for the chat model.
 *
 * Results are labeled `[W1]`, `[W2]`, etc. for inline citation in assistant
 * replies. URLs are always included so the model can attribute claims.
 *
 * @param response - Normalized Tavily search response
 * @returns Multi-line string injected into the tool result
 */
export function formatTavilyResultsForPrompt(
    response: TavilySearchResponse,
): string {
    if (response.results.length === 0) {
        return "No web results were found.";
    }

    const blocks = response.results.map(
        (result, index) =>
            `[W${index + 1}] ${result.title} (${result.url})\n${result.content}`,
    );

    const parts = ["Web search results:"];

    if (response.answer) {
        parts.push(`Summary: ${response.answer}`);
    }

    parts.push(blocks.join("\n\n"));

    return parts.join("\n\n");
}
