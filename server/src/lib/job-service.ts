import { AppError } from "../types/app-error.js";

const UNAVAILABLE_MESSAGE =
    "Source and artifact processing is temporarily unavailable. Please try again shortly.";

/** True when the app is configured to talk to a local Inngest dev server. */
export function isLocalJobService() {
    const flag = process.env.INNGEST_DEV?.trim().toLowerCase();
    return Boolean(flag) && flag !== "0" && flag !== "false";
}

/**
 * Fails fast when the job queue cannot accept work, instead of leaving the
 * client waiting on a source that will never be processed.
 *
 * - Local mode (`INNGEST_DEV` set): the dev server must be reachable.
 * - Cloud mode (default): `INNGEST_EVENT_KEY` must be configured.
 */
export async function requireJobService() {
    if (!isLocalJobService()) {
        if (!process.env.INNGEST_EVENT_KEY?.trim()) {
            console.error(
                "[inngest] Cloud mode requires INNGEST_EVENT_KEY. Add it to server/.env (Inngest dashboard → Manage → Event Keys), or set INNGEST_DEV=1 and run the local dev server.",
            );
            throw new AppError(503, UNAVAILABLE_MESSAGE);
        }

        return;
    }

    const development = process.env.INNGEST_DEV!.trim();
    const baseUrl =
        process.env.INNGEST_BASE_URL ||
        (development.startsWith("http") ? development : "http://127.0.0.1:8288");

    try {
        const response = await fetch(new URL("/health", baseUrl), {
            signal: AbortSignal.timeout(3000),
        });
        if (!response.ok) throw new Error(`Worker returned ${response.status}`);
    } catch {
        console.error(
            `[inngest] Local dev server is not reachable at ${baseUrl}. Start it with "npm run dev:jobs" or unset INNGEST_DEV to use Inngest Cloud.`,
        );
        throw new AppError(503, UNAVAILABLE_MESSAGE);
    }
}
