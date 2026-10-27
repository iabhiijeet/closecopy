import { apiBaseUrl, apiFetch, ApiError } from "@/lib/api";

export type Workspace = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  defaultModel: string;
  createdAt: string;
  updatedAt: string;
};
export type Source = {
  id: string;
  type: "PDF" | "WEBSITE" | "YOUTUBE" | "TEXT" | "MARKDOWN";
  title: string;
  content: string | null;
  url: string | null;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  createdAt: string;
  metadata?: {
    fileUrl?: string;
    processingError?: string;
    pageCount?: number;
  } | null;
};
export type Conversation = {
  id: string;
  title: string | null;
  updatedAt: string;
};
export type Citation = {
  sourceId?: string;
  sourceTitle?: string;
  url?: string;
  page?: number;
  excerpt?: string;
};
export type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: Citation[] | null;
};
export type Artifact = {
  id: string;
  title: string;
  type: string;
  status: string;
  content: unknown;
  createdAt: string;
  metadata?: { error?: string } | null;
};

const root = "/api/workspaces";
export const workspaceApi = {
  list: () => apiFetch<Workspace[]>(root),
  create: (input: { title: string; description?: string; icon?: string }) =>
    apiFetch<Workspace>(root, { method: "POST", body: JSON.stringify(input) }),
  get: (id: string) => apiFetch<Workspace>(`${root}/${encodeURIComponent(id)}`),
  update: (
    id: string,
    input: { title: string; description: string; defaultModel: string },
  ) =>
    apiFetch<Workspace>(`${root}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiFetch<void>(`${root}/${encodeURIComponent(id)}`, { method: "DELETE" }),
  sources: (id: string) =>
    apiFetch<Source[]>(`${root}/${encodeURIComponent(id)}/sources`),
  addText: (id: string, input: { title: string; content: string }) =>
    apiFetch<Source>(`${root}/${encodeURIComponent(id)}/sources`, {
      method: "POST",
      body: JSON.stringify({ type: "TEXT", ...input }),
    }),
  importWebsite: (id: string, url: string) =>
    apiFetch<Source>(
      `${root}/${encodeURIComponent(id)}/sources/import/website`,
      { method: "POST", body: JSON.stringify({ url }) },
    ),
  importYoutube: (id: string, url: string) =>
    apiFetch<Source>(
      `${root}/${encodeURIComponent(id)}/sources/import/youtube`,
      {
        method: "POST",
        body: JSON.stringify({ url }),
      },
    ),
  uploadPdf: (id: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiFetch<Source>(
      `${root}/${encodeURIComponent(id)}/sources/upload`,
      { method: "POST", body },
    );
  },
  conversations: (id: string) =>
    apiFetch<Conversation[]>(`${root}/${encodeURIComponent(id)}/conversations`),
  createConversation: (id: string) =>
    apiFetch<Conversation>(`${root}/${encodeURIComponent(id)}/conversations`, {
      method: "POST",
      body: "{}",
    }),
  removeConversation: (id: string, conversationId: string) =>
    apiFetch<void>(
      `${root}/${encodeURIComponent(id)}/conversations/${encodeURIComponent(conversationId)}`,
      { method: "DELETE" },
    ),
  removeSource: (id: string, sourceId: string) =>
    apiFetch<void>(
      `${root}/${encodeURIComponent(id)}/sources/${encodeURIComponent(sourceId)}`,
      { method: "DELETE" },
    ),
  retrySource: (id: string, sourceId: string) =>
    apiFetch<{ sourceIds: string[] }>(
      `${root}/${encodeURIComponent(id)}/sources/reprocess`,
      { method: "POST", body: JSON.stringify({ sourceIds: [sourceId] }) },
    ),
  messages: (id: string, conversationId: string) =>
    apiFetch<ChatMessage[]>(
      `${root}/${encodeURIComponent(id)}/conversations/${encodeURIComponent(conversationId)}/messages`,
    ),
  artifacts: (id: string) =>
    apiFetch<Artifact[]>(`${root}/${encodeURIComponent(id)}/artifacts`),
  removeArtifact: (id: string, artifactId: string) =>
    apiFetch<void>(
      `${root}/${encodeURIComponent(id)}/artifacts/${encodeURIComponent(artifactId)}`,
      { method: "DELETE" },
    ),
  createArtifact: (id: string, type: string, sourceIds?: string[]) =>
    apiFetch<Artifact>(`${root}/${encodeURIComponent(id)}/artifacts`, {
      method: "POST",
      body: JSON.stringify({ type, sourceIds }),
    }),
};

export async function streamChat(
  workspaceId: string,
  text: string,
  conversationId: string | null,
  history: ChatMessage[],
  options: {
    model: "gpt-4o-mini" | "gpt-4o";
    webSearch: boolean;
    signal?: AbortSignal;
  },
  onText: (text: string) => void,
): Promise<string | null> {
  const response = await fetch(
    `${apiBaseUrl}${root}/${encodeURIComponent(workspaceId)}/chat`,
    {
      method: "POST",
      credentials: "include",
      signal: options.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: conversationId || undefined,
        model: options.model,
        webSearch: options.webSearch,
        messages: [
          ...history.map((message) => ({
            id: message.id,
            role: message.role.toLowerCase(),
            parts: [{ type: "text", text: message.content }],
          })),
          {
            id: crypto.randomUUID(),
            role: "user",
            parts: [{ type: "text", text }],
          },
        ],
      }),
    },
  );
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("closecopy:session-expired"));
    const body = await response.json().catch(() => null);
    throw new ApiError(
      body?.message ?? body?.error ?? "Could not send message",
      response.status,
    );
  }
  const id = response.headers.get("X-Conversation-Id") || conversationId;
  if (!response.body) throw new Error("Chat response has no stream");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    if (done && buffer) {
      lines.push(buffer);
      buffer = "";
    }
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          errorText?: string;
        };
        if (event.type === "text-delta" && event.delta) {
          answer += event.delta;
          onText(answer);
        }
        if (event.type === "error")
          throw new Error(event.errorText || "Chat failed");
      } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      }
    }
    if (done) break;
  }
  if (!answer.trim())
    throw new Error("No reply was returned. Please try again.");
  return id;
}
