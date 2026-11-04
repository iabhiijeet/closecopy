import { Inngest } from "inngest";
import { isLocalJobService } from "../lib/job-service.js";

/**
 * Inngest client.
 *
 * Runs in cloud mode by default and talks to Inngest Cloud using
 * `INNGEST_EVENT_KEY` (sending events) and `INNGEST_SIGNING_KEY` (verifying
 * and syncing functions). Set `INNGEST_DEV=1` to target a local dev server
 * instead (e.g. `INNGEST_DEV=1 INNGEST_BASE_URL=http://127.0.0.1:8288`).
 */
export const inngest = new Inngest({
    id: "chaibookbuild",
    isDev: isLocalJobService(),
});

export type SourceCreatedEvent = {
    name: "source/created";
    data: {
        sourceId: string;
        workspaceId: string;
    };
};

export type InngestEvents = SourceCreatedEvent;
