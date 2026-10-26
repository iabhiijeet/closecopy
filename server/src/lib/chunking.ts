import { CHUNK_OVERLAP, CHUNK_SIZE } from "./ai-config.js";

export type TextChunk = {
    index: number;
    content: string;
    metadata?: Record<string, unknown>;
};

/** Default maximum characters per chunk when no option is passed. */
const DEFAULT_CHUNK_SIZE = CHUNK_SIZE;

/** Default overlap between consecutive chunks (helps preserve context at boundaries). */
const DEFAULT_CHUNK_OVERLAP = CHUNK_OVERLAP;

/**
 * Separators tried in order, from "most natural" to "most aggressive".
 *
 * Oversized pieces are recursively split with the next separator so a single
 * long paragraph or sentence can never produce an over-limit chunk.
 */
const SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

/**
 * Character-level fallback for text with no usable separators.
 * `chunkOverlap` is clamped so the loop always advances.
 */
function sliceByCharacters(
    text: string,
    chunkSize: number,
    chunkOverlap: number,
) {
    const step = Math.max(1, chunkSize - chunkOverlap);
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += step) {
        chunks.push(text.slice(i, i + chunkSize));

        if (i + chunkSize >= text.length) {
            break;
        }
    }

    return chunks;
}

/**
 * Splits raw text into chunk strings using a recursive separator strategy.
 *
 * **How it works (step by step):**
 * 1. Try splitting on double newlines (`\n\n`) → keeps paragraphs together when possible
 * 2. If that fails, try single newlines (`\n`) → keeps lines together
 * 3. Then sentence boundaries (`. `)
 * 4. Then word boundaries (` `)
 * 5. Last resort: slice by character count with overlap
 *
 * Splits that are still larger than `chunkSize` are recursively split with the
 * next separator instead of being emitted oversized.
 *
 * @param text - Full text to split
 * @param chunkSize - Target max characters per chunk
 * @param chunkOverlap - Characters repeated between adjacent chunks (character fallback only)
 * @param separatorIndex - Separator currently being tried
 * @returns Array of non-empty chunk strings (no `index` or `metadata` yet)
 *
 */
function splitText(
    text: string,
    chunkSize: number,
    chunkOverlap: number,
    separatorIndex = 0,
): string[] {
    const normalized = text.trim();

    if (!normalized) {
        return [];
    }

    if (normalized.length <= chunkSize) {
        return [normalized];
    }

    const separator = SEPARATORS[separatorIndex];

    if (separator === undefined || separator === "") {
        return sliceByCharacters(normalized, chunkSize, chunkOverlap);
    }

    const splits = normalized
        .split(separator)
        .filter((split) => split.trim().length > 0);

    if (splits.length <= 1) {
        return splitText(
            normalized,
            chunkSize,
            chunkOverlap,
            separatorIndex + 1,
        );
    }

    const docs: string[] = [];
    let current: string[] = [];
    let total = 0;

    const flush = () => {
        if (current.length === 0) {
            return;
        }

        const chunk = current.join(separator).trim();
        if (chunk) {
            docs.push(chunk);
        }

        current = [];
        total = 0;
    };

    for (const split of splits) {
        if (split.length > chunkSize) {
            flush();
            docs.push(
                ...splitText(
                    split,
                    chunkSize,
                    chunkOverlap,
                    separatorIndex + 1,
                ),
            );
            continue;
        }

        const separatorLength = current.length > 0 ? separator.length : 0;

        if (
            total + split.length + separatorLength > chunkSize &&
            current.length > 0
        ) {
            flush();
        }

        current.push(split);
        total += split.length + (current.length > 1 ? separator.length : 0);
    }

    flush();

    return docs;
}

/**
 * Public API: split any plain string into numbered `TextChunk` objects.
 *
 * This is the function you call for articles, transcripts, scraped web text, etc.
 * Each chunk gets a sequential `index` and optional shared `metadata`.
 *
 * @param text - The full document text
 * @param options.chunkSize - Max characters per chunk (default: 1000)
 * @param options.chunkOverlap - Overlap for character-level splits (default: 100)
 * @param options.metadata - Extra fields attached to every chunk (e.g. `{ sourceId: "abc" }`)
 * @returns Array of `TextChunk` ready for embedding/storage
 */
export function chunkText(
    text: string,
    options: {
        chunkSize?: number;
        chunkOverlap?: number;
        metadata?: Record<string, unknown>;
    } = {},
): TextChunk[] {
    const chunkSize = Math.max(1, options.chunkSize ?? DEFAULT_CHUNK_SIZE);
    const chunkOverlap = Math.max(
        0,
        Math.min(
            options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP,
            chunkSize - 1,
        ),
    );
    const parts = splitText(text.trim(), chunkSize, chunkOverlap);

    return parts.map((content, index) => ({
        index,
        content,
        metadata: options.metadata,
    }));
}

/**
 * Chunk a multi-page document (e.g. PDF pages) while preserving page numbers.
 *
 * Unlike `chunkText`, this:
 * - processes each page separately (chunks never span two pages)
 * - assigns `metadata.page` (1-based) to every chunk from that page
 * - re-numbers `index` globally across all pages (0, 1, 2, …)
 *
 * Empty or whitespace-only pages are skipped.
 *
 * @param pages - Array of page texts, e.g. from `extractPdfPages()`
 * @param options.chunkSize - Max characters per chunk (default: 1000)
 * @param options.chunkOverlap - Overlap for character-level splits (default: 100)
 * @returns Flat list of chunks from all pages with page metadata
 *
 */
export function chunkPages(
    pages: string[],
    options: {
        chunkSize?: number;
        chunkOverlap?: number;
    } = {},
): TextChunk[] {
    const chunks: TextChunk[] = [];
    let index = 0;

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const pageText = pages[pageIndex].trim();
        if (!pageText) {
            continue;
        }

        const pageChunks = chunkText(pageText, {
            ...options,
            metadata: { page: pageIndex + 1 },
        });

        for (const chunk of pageChunks) {
            chunks.push({
                index,
                content: chunk.content,
                metadata: chunk.metadata,
            });
            index += 1;
        }
    }

    return chunks;
}
