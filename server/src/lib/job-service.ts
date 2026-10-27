import { AppError } from "../types/app-error.js";

/** Fail promptly when a local development worker has not been started. */
export async function requireLocalJobService() {
    const development = process.env.INNGEST_DEV?.trim();
    if (!development) return;
    const baseUrl = process.env.INNGEST_BASE_URL || (development.startsWith("http") ? development : "http://127.0.0.1:8288");
    try {
        const response = await fetch(new URL("/health", baseUrl), { signal: AbortSignal.timeout(3000) });
        if (!response.ok) throw new Error(`Worker returned ${response.status}`);
    } catch {
        throw new AppError(503, "Source and artifact processing is temporarily unavailable. Please try again shortly.");
    }
}
