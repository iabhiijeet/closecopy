import { MemoryClient } from "mem0ai";
import { AppError, NotFoundError } from "../types/app-error.js";

let client: MemoryClient | null = null;
let clientKey: string | null = null;

/**
 * Returns a singleton Mem0 Platform client.
 *
 * @returns Configured `MemoryClient`
 * @throws When `MEM0_API_KEY` is missing
 */
export function getMem0Client(): MemoryClient {
    const apiKey = process.env.MEM0_API_KEY?.trim();

    if (!apiKey) {
        throw new AppError(
            503,
            "Mem0 is not configured. Set MEM0_API_KEY on the server.",
        );
    }

    const host = process.env.MEM0_HOST?.trim() || undefined;

    if (!client || clientKey !== `${apiKey}:${host ?? ""}`) {
        client = new MemoryClient({ apiKey, ...(host ? { host } : {}) });
        clientKey = `${apiKey}:${host ?? ""}`;
    }

    return client;
}

/** Returns true when `MEM0_API_KEY` is present. */
export function isMem0Configured(): boolean {
    return Boolean(process.env.MEM0_API_KEY?.trim());
}

/**
 * Normalizes an authenticated app user id into the id used by Mem0.
 *
 * The auth id is stable, so leaving `MEM0_USER_ID_PREFIX` unset keeps the
 * existing behaviour. Set the prefix when several apps share one Mem0 project
 * to guarantee isolation between them.
 *
 * @throws When the user id is empty
 */
export function getMem0UserId(userId: string): string {
    const normalized = userId.trim();

    if (!normalized) {
        throw new Error("A non-empty user id is required for Mem0");
    }

    const prefix = process.env.MEM0_USER_ID_PREFIX?.trim();
    return prefix ? `${prefix}:${normalized}` : normalized;
}

/** Mem0 entity filters. Entity ids must be nested under `filters`. */
function getUserFilters(userId: string): Record<string, unknown> {
    const appId = process.env.MEM0_APP_ID?.trim();
    return {
        user_id: getMem0UserId(userId),
        ...(appId ? { app_id: appId } : {}),
    };
}

/** Message shape accepted by Mem0 for inferred memory extraction. */
export type Mem0Message = {
    role: "user" | "assistant";
    content: string;
};

/** Normalized memory record returned by the app's memory APIs. */
export type AppMemory = {
    id: string;
    memory: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, unknown> | null;
    categories?: string[];
    source: "manual" | "learned";
};

type RawMemory = {
    id: string;
    memory?: string;
    data?: { memory?: string } | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    metadata?: Record<string, unknown> | null;
    categories?: string[];
};

type Mem0AddResponse =
    | RawMemory[]
    | {
          results?: RawMemory[];
          eventId?: string;
          event_id?: string;
          status?: string;
          message?: string;
      };

function extractMemories(result: unknown): RawMemory[] {
    if (Array.isArray(result)) {
        return result as RawMemory[];
    }

    if (result && typeof result === "object" && "results" in result) {
        const results = (result as { results?: unknown }).results;
        return Array.isArray(results) ? (results as RawMemory[]) : [];
    }

    return [];
}

function mapMemory(record: RawMemory): AppMemory {
    const metadata = record.metadata ?? null;
    const source: AppMemory["source"] =
        metadata?.source === "manual" ? "manual" : "learned";
    const createdAt = record.createdAt ?? new Date().toISOString();
    const updatedAt = record.updatedAt ?? createdAt;

    return {
        id: record.id,
        // Mem0 returns verbatim adds as `{ data: { memory } }`.
        memory: record.memory ?? record.data?.memory ?? "",
        createdAt:
            createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        updatedAt:
            updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
        metadata,
        categories: record.categories,
        source,
    };
}

type OwnedMemoryRecord = RawMemory & {
    userId?: string;
    owner?: string | null;
};

/**
 * Loads a memory and verifies it belongs to the authenticated user.
 *
 * Mem0's `get` usually returns `userId`/`owner`; when it does not, we scan the
 * user's memory pages so a memory id from another user cannot be mutated.
 *
 * @throws {NotFoundError} When the memory is missing or owned by another user
 */
async function findOwnedMemoryRecord(
    userId: string,
    memoryId: string,
): Promise<RawMemory> {
    const client = getMem0Client();
    const expectedOwner = getMem0UserId(userId);

    let record: OwnedMemoryRecord | null;

    try {
        record = (await client.get(memoryId)) as unknown as OwnedMemoryRecord;
    } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";

        if (message.includes("404") || message.includes("not found")) {
            throw new NotFoundError("Memory not found");
        }

        throw error;
    }

    if (!record) {
        throw new NotFoundError("Memory not found");
    }

    const owner = record.userId ?? record.owner ?? undefined;

    if (owner) {
        if (owner !== expectedOwner) {
            throw new NotFoundError("Memory not found");
        }

        return record;
    }

    for (let page = 1; page <= 10; page += 1) {
        const result = await client.getAll({
            filters: getUserFilters(userId),
            page,
            pageSize: 100,
        });

        const match = result.results?.find((memory) => memory.id === memoryId);

        if (match) {
            return match as RawMemory;
        }

        if (!result.next || (result.results?.length ?? 0) < 100) {
            break;
        }
    }

    throw new NotFoundError("Memory not found");
}

/**
 * Lists all memories stored for a user (up to 100).
 *
 * @param userId - Authenticated user's id
 * @returns Array of memories, or `[]` when Mem0 is not configured
 */
export async function listUserMemories(userId: string): Promise<AppMemory[]> {
    if (!isMem0Configured()) {
        return [];
    }

    const page = await getMem0Client().getAll({
        filters: getUserFilters(userId),
        page: 1,
        pageSize: 100,
    });

    return (page.results ?? []).map(mapMemory);
}

/**
 * Semantic search over a user's memories for RAG chat context.
 *
 * @param userId - Authenticated user's id
 * @param query - Current user message or search text
 * @returns Top matching memories (up to 8), or `[]` when Mem0 is off or query is empty
 */
export async function searchUserMemories(
    userId: string,
    query: string,
): Promise<AppMemory[]> {
    const normalizedQuery = query.trim();

    if (!isMem0Configured() || !normalizedQuery) {
        return [];
    }

    const response = await getMem0Client().search(normalizedQuery, {
        filters: getUserFilters(userId),
        topK: 8,
        threshold: 0.1,
    });

    return (response.results ?? [])
        .map(mapMemory)
        .filter((memory) => memory.memory.length > 0);
}

/**
 * Creates a single user memory (manual or explicit text).
 *
 * Uses `infer: false` by default, so Mem0 stores the supplied text verbatim and
 * returns the created record synchronously.
 *
 * @param userId - Owner of the memory
 * @param input - Memory text, optional infer flag, optional metadata
 * @returns Created memory record
 * @throws When Mem0 returns no created record
 */
export async function addUserMemory(
    userId: string,
    input: {
        memory: string;
        infer?: boolean;
        metadata?: Record<string, unknown>;
    },
): Promise<AppMemory> {
    const memory = input.memory.trim();

    if (!memory) {
        throw new Error("Memory text is required");
    }

    const appId = process.env.MEM0_APP_ID?.trim();
    const response = (await getMem0Client().add(
        [{ role: "user", content: memory }],
        {
            userId: getMem0UserId(userId),
            ...(appId ? { appId } : {}),
            infer: input.infer ?? false,
            metadata: input.metadata,
        },
    )) as unknown as Mem0AddResponse;

    const first = extractMemories(response)[0];
    if (!first) {
        throw new Error(
            "Mem0 did not return a created memory. Use infer: false for synchronous adds.",
        );
    }

    return mapMemory(first);
}

/**
 * Extracts inferred memories from a conversation transcript (fire-and-forget in chat).
 *
 * Mem0 v3 processes inferred adds asynchronously and returns an event envelope
 * rather than the created memory records.
 *
 * @param userId - Owner of extracted memories
 * @param messages - Recent user/assistant turns
 * @param metadata - Optional metadata (e.g. `{ source: "learned", conversationId }`)
 * @returns Event status, or `undefined` when Mem0 is off or messages are empty
 */
export async function addMemoriesFromMessages(
    userId: string,
    messages: Mem0Message[],
    metadata?: Record<string, unknown>,
): Promise<{ eventId?: string; status?: string } | undefined> {
    const usableMessages = messages.filter(
        (message) => message.content.trim().length > 0,
    );

    if (!isMem0Configured() || usableMessages.length === 0) {
        return undefined;
    }

    const appId = process.env.MEM0_APP_ID?.trim();
    const response = (await getMem0Client().add(usableMessages, {
        userId: getMem0UserId(userId),
        ...(appId ? { appId } : {}),
        infer: true,
        metadata,
    })) as unknown as Mem0AddResponse;

    if (Array.isArray(response)) {
        return undefined;
    }

    return {
        eventId: response.eventId ?? response.event_id,
        status: response.status,
    };
}

/**
 * Updates the text of an existing memory after verifying ownership.
 *
 * @param userId - Authenticated user's id
 * @param memoryId - Mem0 memory id
 * @param input - New memory text
 * @returns Updated memory record
 * @throws {NotFoundError} When the memory is missing or owned by another user
 * @throws When Mem0 returns no updated record
 */
export async function updateUserMemory(
    userId: string,
    memoryId: string,
    input: { memory: string },
): Promise<AppMemory> {
    const memory = input.memory.trim();

    if (!memory) {
        throw new Error("Memory text is required");
    }

    await findOwnedMemoryRecord(userId, memoryId);

    const response = (await getMem0Client().update(memoryId, {
        text: memory,
    })) as unknown as RawMemory | RawMemory[];

    const updated = Array.isArray(response) ? response[0] : response;
    if (!updated?.id) {
        throw new Error("Mem0 did not return an updated memory");
    }

    return mapMemory(updated);
}

/**
 * Permanently deletes a memory from Mem0 after verifying ownership.
 *
 * @param userId - Authenticated user's id
 * @param memoryId - Mem0 memory id to delete
 * @returns Resolves when deletion completes
 * @throws {NotFoundError} When the memory is missing or owned by another user
 */
export async function deleteUserMemory(
    userId: string,
    memoryId: string,
): Promise<void> {
    await findOwnedMemoryRecord(userId, memoryId);
    await getMem0Client().delete(memoryId);
}
