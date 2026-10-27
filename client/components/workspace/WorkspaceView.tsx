"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUp,
  BookOpen,
  FileText,
  Globe2,
  Layers3,
  MessageCircle,
  Plus,
  Search,
  Upload,
  Copy,
  Download,
  RefreshCw,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { ArtifactContent } from "@/components/workspace/ArtifactContent";
import { ConfirmAction } from "@/components/workspace/ConfirmAction";
import { MarkdownContent } from "@/components/workspace/MarkdownContent";
import { toast } from "sonner";
import { artifactDocument, downloadArtifact } from "@/lib/artifact-document";
import { streamChat, workspaceApi, type ChatMessage } from "@/lib/workspaces";
import {
  useWorkspaceUiStore,
  type WorkspacePanel,
} from "@/stores/use-workspace-ui-store";

const panelLabels: Record<WorkspacePanel, string> = {
  sources: "Sources",
  chat: "Ask",
  artifacts: "Artifacts",
};
const artifactTools = [
  {
    type: "SUMMARY",
    label: "Summary",
    description: "A concise source overview",
    icon: BookOpen,
  },
  {
    type: "TAKEAWAYS",
    label: "Key takeaways",
    description: "The main findings",
    icon: FileText,
  },
  {
    type: "FLASHCARDS",
    label: "Flashcards",
    description: "Cards for quick review",
    icon: Layers3,
  },
  {
    type: "QUIZ",
    label: "Practice quiz",
    description: "Check understanding",
    icon: MessageCircle,
  },
  {
    type: "MINDMAP",
    label: "Mind map",
    description: "Connect core ideas",
    icon: Globe2,
  },
  {
    type: "REPORT",
    label: "Report",
    description: "A structured brief",
    icon: FileText,
  },
] as const;
const promptIdeas = [
  {
    label: "Summarize sources",
    prompt: "Summarize the main findings across my sources.",
  },
  {
    label: "Find connections",
    prompt: "What themes and connections appear across these sources?",
  },
  {
    label: "Compare claims",
    prompt: "Where do these sources agree or disagree? Cite the passages.",
  },
];

export function WorkspaceView({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();
  const activePanel = useWorkspaceUiStore((state) => state.activePanel);
  const setActivePanel = useWorkspaceUiStore((state) => state.setActivePanel);
  const [sourceMode, setSourceMode] = useState<"text" | "website" | "youtube">(
    "text",
  );
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceContent, setSourceContent] = useState("");
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draftMessages, setDraftMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [model, setModel] = useState<"gpt-4o-mini" | "gpt-4o" | null>(null);
  const [webSearch, setWebSearch] = useState(false);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedExcerpt, setSelectedExcerpt] = useState<string | null>(null);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null,
  );
  const [excludedSources, setExcludedSources] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "source" | "artifact" | "conversation";
    id: string;
  } | null>(null);
  const streamController = useRef<AbortController | null>(null);
  const messageEnd = useRef<HTMLDivElement>(null);
  useEffect(() => () => streamController.current?.abort(), []);

  const workspace = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => workspaceApi.get(workspaceId),
  });
  const sources = useQuery({
    queryKey: ["sources", workspaceId],
    queryFn: () => workspaceApi.sources(workspaceId),
    enabled: !!workspace.data,
    refetchInterval: (query) =>
      query.state.data?.some(
        (source) =>
          source.status === "PENDING" || source.status === "PROCESSING",
      )
        ? 5000
        : false,
  });
  const conversations = useQuery({
    queryKey: ["conversations", workspaceId],
    queryFn: () => workspaceApi.conversations(workspaceId),
    enabled: !!workspace.data,
  });
  const messages = useQuery({
    queryKey: ["messages", workspaceId, conversationId],
    queryFn: () => workspaceApi.messages(workspaceId, conversationId!),
    enabled: !!conversationId && !sending,
  });
  useEffect(() => {
    messageEnd.current?.scrollIntoView({ block: "end" });
  }, [draftMessages, messages.data]);
  const artifacts = useQuery({
    queryKey: ["artifacts", workspaceId],
    queryFn: () => workspaceApi.artifacts(workspaceId),
    enabled: !!workspace.data,
    refetchInterval: (query) =>
      query.state.data?.some(
        (artifact) =>
          artifact.status === "PENDING" || artifact.status === "PROCESSING",
      )
        ? 5000
        : false,
  });
  const addSource = useMutation({
    mutationFn: () =>
      sourceMode === "text"
        ? workspaceApi.addText(workspaceId, {
            title: sourceTitle.trim(),
            content: sourceContent.trim(),
          })
        : sourceMode === "website"
          ? workspaceApi.importWebsite(workspaceId, url.trim())
          : workspaceApi.importYoutube(workspaceId, url.trim()),
    onSuccess: () => {
      setSourceTitle("");
      setSourceContent("");
      setUrl("");
      setShowSourceForm(false);
      queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] });
    },
    onError: () =>
      queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] }),
  });
  const upload = useMutation({
    mutationFn: (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf"))
        throw new Error("Choose a PDF file.");
      if (file.size > 10 * 1024 * 1024)
        throw new Error("PDF files must be 10 MB or smaller.");
      return workspaceApi.uploadPdf(workspaceId, file);
    },
    onSuccess: () => {
      setShowSourceForm(false);
      queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] });
      toast.success("PDF added. Processing has started.");
    },
  });
  const generate = useMutation({
    mutationFn: (type: string) =>
      workspaceApi.createArtifact(
        workspaceId,
        type,
        sources.data
          ?.filter(
            (source) =>
              source.status === "READY" && !excludedSources.includes(source.id),
          )
          .map((source) => source.id),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artifacts", workspaceId] });
      setActivePanel("artifacts");
      toast.success("Artifact queued. It will appear in Studio when ready.");
    },
    onError: () =>
      queryClient.invalidateQueries({ queryKey: ["artifacts", workspaceId] }),
  });
  const retrySource = useMutation({
    mutationFn: (sourceId: string) =>
      workspaceApi.retrySource(workspaceId, sourceId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] }),
    onError: (error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) return;
      if (deleteTarget.type === "source")
        return workspaceApi.removeSource(workspaceId, deleteTarget.id);
      if (deleteTarget.type === "artifact")
        return workspaceApi.removeArtifact(workspaceId, deleteTarget.id);
      return workspaceApi.removeConversation(workspaceId, deleteTarget.id);
    },
    onSuccess: async () => {
      if (deleteTarget?.type === "source") setSelectedSourceId(null);
      if (deleteTarget?.type === "artifact") setSelectedArtifactId(null);
      if (deleteTarget?.type === "conversation") {
        setConversationId(null);
        setDraftMessages([]);
      }
      await Promise.all(
        ["sources", "artifacts", "conversations"].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key, workspaceId] }),
        ),
      );
      setDeleteTarget(null);
    },
  });
  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy. Please try again.");
    }
  }

  function submitSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addSource.mutate();
  }
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (!text || sending) return;
    setQuestion("");
    setChatError("");
    setSending(true);
    const controller = new AbortController();
    streamController.current = controller;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "USER",
      content: text,
      citations: null,
    };
    const assistantId = crypto.randomUUID();
    const history = messages.data ?? [];
    setDraftMessages([
      ...history,
      userMessage,
      { id: assistantId, role: "ASSISTANT", content: "", citations: null },
    ]);
    let activeConversation = conversationId;
    try {
      if (!activeConversation) {
        const created = await workspaceApi.createConversation(workspaceId);
        activeConversation = created.id;
        setConversationId(created.id);
        queryClient.setQueryData(["messages", workspaceId, created.id], []);
        await queryClient.invalidateQueries({
          queryKey: ["conversations", workspaceId],
        });
      }
      const id = await streamChat(
        workspaceId,
        text,
        activeConversation,
        history,
        {
          model:
            model ??
            (workspace.data?.defaultModel === "gpt-4o"
              ? "gpt-4o"
              : "gpt-4o-mini"),
          webSearch,
          signal: controller.signal,
        },
        (content) =>
          setDraftMessages([
            ...history,
            userMessage,
            { id: assistantId, role: "ASSISTANT", content, citations: null },
          ]),
      );
      if (id) setConversationId(id);
      if (id) {
        const saved = await workspaceApi.messages(workspaceId, id);
        queryClient.setQueryData(["messages", workspaceId, id], saved);
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["conversations", workspaceId],
        }),
        id
          ? queryClient.invalidateQueries({
              queryKey: ["messages", workspaceId, id],
            })
          : Promise.resolve(),
      ]);
      setDraftMessages([]);
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) {
        setChatError(
          cause instanceof Error
            ? cause.message
            : "Could not send your message.",
        );
        setQuestion(text);
      }
      setDraftMessages([]);
    } finally {
      setSending(false);
      streamController.current = null;
      if (activeConversation)
        queryClient.invalidateQueries({
          queryKey: ["messages", workspaceId, activeConversation],
        });
    }
  }

  if (workspace.isPending)
    return (
      <div className="min-h-screen bg-background">
        <WorkspaceHeader />
        <main className="container-page py-12 text-sm text-muted-foreground">
          Opening workspace…
        </main>
      </div>
    );
  if (workspace.error || !workspace.data)
    return (
      <div className="min-h-screen bg-background">
        <WorkspaceHeader />
        <main className="container-page py-12">
          <p role="alert">
            {workspace.error?.message || "Workspace not found"}
          </p>
          <Link
            href="/workspaces"
            className="mt-4 inline-block text-primary underline"
          >
            Back to workspaces
          </Link>
        </main>
      </div>
    );

  const shownMessages = draftMessages.length
    ? draftMessages
    : (messages.data ?? []);
  const selectedSource = sources.data?.find(
    (source) => source.id === selectedSourceId,
  );
  const selectedArtifact = artifacts.data?.find(
    (artifact) => artifact.id === selectedArtifactId,
  );
  const visibleSources = sources.data?.filter((source) =>
    source.title.toLowerCase().includes(sourceSearch.trim().toLowerCase()),
  );
  const selectedSources =
    sources.data?.filter(
      (source) =>
        source.status === "READY" && !excludedSources.includes(source.id),
    ) ?? [];
  const hasReadySources = selectedSources.length > 0;
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <WorkspaceHeader workspace={workspace.data} />
      <main className="flex min-h-0 w-full flex-1 flex-col">
        <div
          className="mx-3 my-3 flex shrink-0 gap-1 rounded-xl border border-border bg-card p-1 sm:mx-5 lg:hidden"
          role="tablist"
          aria-label="Workspace panels"
        >
          {(Object.keys(panelLabels) as WorkspacePanel[]).map((panel) => (
            <button
              key={panel}
              role="tab"
              aria-selected={activePanel === panel}
              onClick={() => setActivePanel(panel)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium ${activePanel === panel ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
            >
              {panelLabels[panel]}
            </button>
          ))}
        </div>
        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(235px,0.95fr)_minmax(420px,1.75fr)_minmax(255px,1fr)]">
          <section
            aria-label="Sources"
            className={`${activePanel === "sources" ? "block" : "hidden"} h-full min-w-0 overflow-y-auto border border-border bg-card p-4 lg:block lg:border-0 lg:border-r lg:border-border`}
          >
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em]">
                Sources{" "}
                <span className="font-normal text-muted-foreground">
                  {sources.data?.length ?? 0}
                </span>
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSourceForm((value) => !value)}
                className="ml-auto h-8"
              >
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
            <label className="relative mb-4 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <span className="sr-only">Search sources</span>
              <Input
                value={sourceSearch}
                onChange={(event) => setSourceSearch(event.target.value)}
                placeholder="Search sources"
                className="h-9 pl-9 text-xs"
              />
            </label>
            {sources.isPending && (
              <p className="text-xs text-muted-foreground">Loading sources…</p>
            )}
            {sources.error && (
              <p role="alert" className="text-xs text-destructive">
                {sources.error.message}
              </p>
            )}
            {sources.data?.length === 0 && !showSourceForm && (
              <div className="my-10 rounded-xl border border-dashed border-border p-6 text-center">
                <FileText className="mx-auto mb-3 size-6 text-primary" />
                <p className="text-sm font-medium">No sources yet</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Add a PDF, webpage, video or note to ground your answers.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSourceForm(true)}
                  className="mt-4"
                >
                  <Plus className="size-3.5" /> Add first source
                </Button>
              </div>
            )}
            {sources.data &&
              sources.data.length > 0 &&
              visibleSources?.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No sources match your search.
                </p>
              )}
            {!!sources.data?.some((source) => source.status === "READY") && (
              <p className="mb-3 text-[11px] text-muted-foreground">
                {selectedSources.length} selected for Studio. Chat searches all
                sources.
              </p>
            )}
            <ul className="space-y-2">
              {visibleSources?.map((source) => (
                <li
                  key={source.id}
                  className="flex flex-wrap items-start gap-2"
                >
                  <input
                    type="checkbox"
                    checked={
                      source.status === "READY" &&
                      !excludedSources.includes(source.id)
                    }
                    disabled={source.status !== "READY"}
                    aria-label={`Use ${source.title} in Studio`}
                    onChange={(event) =>
                      setExcludedSources((current) =>
                        event.target.checked
                          ? current.filter((id) => id !== source.id)
                          : [...current, source.id],
                      )
                    }
                    className="mt-4 shrink-0 accent-primary"
                  />
                  <button
                    onClick={() => {
                      setSelectedSourceId(source.id);
                      setSelectedExcerpt(null);
                    }}
                    className={`min-w-0 flex-1 rounded-xl border p-3 text-left hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring ${selectedSourceId === source.id ? "border-primary/50" : "border-border"}`}
                  >
                    <span className="flex items-start gap-2">
                      <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block break-words text-xs font-medium">
                          {source.title}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {source.type.toLowerCase()} ·{" "}
                          {source.status.toLowerCase()}
                        </span>
                      </span>
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete source ${source.title}`}
                    title="Delete source"
                    className="mt-2 text-muted-foreground"
                    onClick={() => {
                      remove.reset();
                      setDeleteTarget({ type: "source", id: source.id });
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                  {source.status === "FAILED" && (
                    <div className="w-full rounded-lg bg-destructive/5 p-2 text-xs">
                      <p className="text-destructive">
                        {source.metadata?.processingError ||
                          "This source could not be processed."}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={retrySource.isPending}
                        onClick={() => retrySource.mutate(source.id)}
                        className="mt-1"
                      >
                        <RefreshCw className="size-3" /> Retry processing
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {selectedSource && (
              <div className="mt-4 rounded-xl border border-border bg-background p-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="float-right"
                  aria-label="Close source preview"
                  onClick={() => setSelectedSourceId(null)}
                >
                  <X className="size-3.5" />
                </Button>
                <p className="text-xs font-medium">{selectedSource.title}</p>
                {selectedExcerpt && (
                  <p className="citation-chip mt-3 rounded-md border p-2 text-xs leading-relaxed">
                    {selectedExcerpt}
                  </p>
                )}
                {selectedSource.content && (
                  <p className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                    {selectedSource.content}
                  </p>
                )}
                {(selectedSource.url || selectedSource.metadata?.fileUrl) && (
                  <a
                    href={
                      selectedSource.url || selectedSource.metadata?.fileUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-xs text-primary underline"
                  >
                    Open original source ↗
                  </a>
                )}
              </div>
            )}
            <Dialog open={showSourceForm} onOpenChange={setShowSourceForm}>
              <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl border border-border bg-card p-6 sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl">
                    Add a source
                  </DialogTitle>
                  <DialogDescription>
                    Upload a PDF, paste text, or import a link.
                  </DialogDescription>
                </DialogHeader>
                <div className="mb-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={sourceMode === "text" ? "secondary" : "ghost"}
                    onClick={() => setSourceMode("text")}
                  >
                    Text
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={sourceMode === "website" ? "secondary" : "ghost"}
                    onClick={() => setSourceMode("website")}
                  >
                    Website
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={sourceMode === "youtube" ? "secondary" : "ghost"}
                    onClick={() => setSourceMode("youtube")}
                  >
                    YouTube
                  </Button>
                </div>
                <form onSubmit={submitSource} className="space-y-2">
                  {sourceMode === "text" ? (
                    <>
                      <Input
                        value={sourceTitle}
                        onChange={(e) => setSourceTitle(e.target.value)}
                        required
                        maxLength={200}
                        placeholder="Source title"
                        aria-label="Source title"
                      />
                      <Textarea
                        value={sourceContent}
                        onChange={(e) => setSourceContent(e.target.value)}
                        required
                        placeholder="Paste your text here"
                        aria-label="Source text"
                        className="min-h-28"
                      />
                    </>
                  ) : (
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                      placeholder={
                        sourceMode === "youtube"
                          ? "https://youtube.com/watch?v=…"
                          : "https://example.com/article"
                      }
                      aria-label={
                        sourceMode === "youtube" ? "YouTube URL" : "Website URL"
                      }
                    />
                  )}
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={addSource.isPending}
                    className="w-full"
                  >
                    <Plus className="size-4" />{" "}
                    {addSource.isPending ? "Adding…" : "Add source"}
                  </Button>
                </form>
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-6 text-sm font-medium hover:border-primary/50 focus-within:ring-2 focus-within:ring-ring">
                  <Upload className="size-4" />{" "}
                  {upload.isPending ? "Uploading…" : "Upload PDF"}
                  <input
                    type="file"
                    accept="application/pdf"
                    aria-label="Upload PDF"
                    className="sr-only"
                    disabled={upload.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) upload.mutate(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <p className="text-center text-xs text-muted-foreground">
                  PDF files up to 10 MB
                </p>
                {(addSource.error || upload.error) && (
                  <p role="alert" className="mt-3 text-xs text-destructive">
                    {addSource.error?.message || upload.error?.message}
                  </p>
                )}
              </DialogContent>
            </Dialog>
          </section>
          <section
            aria-label="Chat"
            className={`${activePanel === "chat" ? "flex" : "hidden"} h-full min-h-0 min-w-0 flex-col border border-border bg-card lg:flex lg:border-y-0`}
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4 text-primary" />
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em]">
                  Chat
                </h2>
              </div>
              <NativeSelect
                size="sm"
                className="min-w-0 max-w-48 flex-1"
                aria-label="Conversation"
                disabled={sending}
                value={conversationId ?? ""}
                onChange={(event) => {
                  setConversationId(event.target.value || null);
                  setDraftMessages([]);
                }}
              >
                <option value="">New conversation</option>
                {conversations.data?.map((conversation) => (
                  <option key={conversation.id} value={conversation.id}>
                    {conversation.title || "Conversation"}
                  </option>
                ))}
              </NativeSelect>
              <Button
                variant="outline"
                size="sm"
                disabled={sending}
                onClick={() => {
                  setConversationId(null);
                  setDraftMessages([]);
                }}
                className="ml-auto h-8"
              >
                <Plus className="size-3.5" /> New chat
              </Button>
              {conversationId && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={sending}
                  aria-label="Delete conversation"
                  title="Delete conversation"
                  onClick={() => {
                    remove.reset();
                    setDeleteTarget({
                      type: "conversation",
                      id: conversationId,
                    });
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
            {conversations.error && (
              <p role="alert" className="px-4 pt-2 text-xs text-destructive">
                Could not load conversation history.{" "}
                <button
                  onClick={() => conversations.refetch()}
                  className="underline"
                >
                  Try again
                </button>
              </p>
            )}
            <div
              aria-live="polite"
              className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5"
            >
              {messages.isPending && conversationId && !sending && (
                <p className="text-xs text-muted-foreground">
                  Loading conversation…
                </p>
              )}
              {messages.error && (
                <p role="alert" className="text-xs text-destructive">
                  {messages.error.message}
                </p>
              )}
              {shownMessages.length === 0 &&
                (!conversationId || !messages.isPending) && (
                  <div className="m-auto w-full max-w-lg py-8 text-center">
                    <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MessageCircle className="size-5" />
                    </div>
                    <p className="font-heading text-2xl">
                      Ask about your sources
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Get answers grounded in the material you add here.
                    </p>
                    <div className="mt-7 space-y-2 text-left">
                      {promptIdeas.map((idea) => (
                        <button
                          key={idea.label}
                          onClick={() => {
                            setQuestion(idea.prompt);
                            questionRef.current?.focus();
                          }}
                          className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          <span className="block text-sm font-medium">
                            {idea.label}
                          </span>
                          <span className="mt-1 block truncate text-xs text-muted-foreground">
                            {idea.prompt}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              {shownMessages.map((message) => (
                <article
                  key={message.id}
                  className={`max-w-[90%] rounded-xl px-4 py-3 text-sm leading-relaxed ${message.role === "USER" ? "ml-auto bg-primary/10" : "border border-border bg-background"}`}
                >
                  {message.content ? (
                    <MarkdownContent
                      content={message.content}
                      citationCount={message.citations?.length ?? 0}
                      onCitation={(index) => {
                        const citation = message.citations?.[index];
                        if (citation?.sourceId) {
                          setSelectedSourceId(citation.sourceId);
                          setSelectedExcerpt(citation.excerpt || null);
                          setActivePanel("sources");
                        } else if (
                          citation?.url &&
                          /^https?:\/\//i.test(citation.url)
                        )
                          window.open(
                            citation.url,
                            "_blank",
                            "noopener,noreferrer",
                          );
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {sending ? "Thinking…" : ""}
                    </p>
                  )}
                  {message.citations?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {message.citations.map((citation, index) =>
                        citation.sourceId ? (
                          <button
                            key={`${citation.sourceId}-${index}`}
                            title={citation.excerpt}
                            onClick={() => {
                              setSelectedSourceId(citation.sourceId!);
                              setSelectedExcerpt(citation.excerpt || null);
                              setActivePanel("sources");
                            }}
                            className="citation-chip rounded-md border px-2 py-0.5 text-[10px] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-ring"
                          >
                            {citation.sourceTitle || `Source ${index + 1}`}
                            {citation.page ? ` · p.${citation.page}` : ""}
                          </button>
                        ) : (
                          <a
                            key={`web-${index}`}
                            href={citation.url}
                            target="_blank"
                            rel="noreferrer"
                            title={citation.excerpt}
                            className="citation-chip rounded-md border px-2 py-0.5 text-[10px]"
                          >
                            {citation.sourceTitle || `Source ${index + 1}`} ↗
                          </a>
                        ),
                      )}
                    </div>
                  ) : null}
                  {message.role === "ASSISTANT" && message.content && (
                    <button
                      onClick={() => copyText(message.content)}
                      aria-label="Copy answer"
                      title="Copy answer"
                      className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <Copy className="size-3" /> Copy
                    </button>
                  )}
                </article>
              ))}
              <div ref={messageEnd} />
            </div>
            <form onSubmit={send} className="border-t border-border p-4">
              <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-primary">
                <Textarea
                  ref={questionRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      if (!sending) event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  aria-label="Ask a question"
                  placeholder="Ask anything, or add sources to ground your chat…"
                  className="min-h-10 max-h-36 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                {sending ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label="Stop response"
                    title="Stop response"
                    onClick={() => streamController.current?.abort()}
                  >
                    <Square className="size-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    disabled={
                      !question.trim() ||
                      (!!conversationId && messages.isPending)
                    }
                    aria-label="Send message"
                    className="shrink-0 bg-[var(--primary-fill)] text-[var(--primary-fill-foreground)]"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <NativeSelect
                  size="sm"
                  aria-label="Chat model"
                  disabled={sending}
                  value={
                    model ??
                    (workspace.data.defaultModel === "gpt-4o"
                      ? "gpt-4o"
                      : "gpt-4o-mini")
                  }
                  onChange={(event) =>
                    setModel(event.target.value as "gpt-4o-mini" | "gpt-4o")
                  }
                >
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                </NativeSelect>
                <label className="flex h-7 items-center gap-1.5 rounded-lg border border-border px-2 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    disabled={sending}
                    checked={webSearch}
                    onChange={(event) => setWebSearch(event.target.checked)}
                    className="accent-primary"
                  />{" "}
                  Web search
                </label>
              </div>
              {chatError && (
                <p role="alert" className="mt-2 text-xs text-destructive">
                  {chatError}
                </p>
              )}
            </form>
          </section>
          <section
            aria-label="Artifacts"
            className={`${activePanel === "artifacts" ? "block" : "hidden"} min-w-0 rounded-2xl border border-border bg-card p-4 lg:block lg:h-full lg:overflow-y-auto lg:rounded-none lg:border-0 lg:border-l lg:border-border`}
          >
            <div className="mb-5 flex items-center gap-2">
              <Layers3 className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em]">
                Studio
              </h2>
              <span className="ml-auto text-[11px] text-muted-foreground">
                Learning tools
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Generate from sources
              </h3>
              {!hasReadySources && (
                <span className="rounded-md bg-citation px-2 py-1 text-[10px] text-citation-foreground">
                  Select a ready source
                </span>
              )}
            </div>
            {hasReadySources && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Using {selectedSources.length} selected{" "}
                {selectedSources.length === 1 ? "source" : "sources"}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {artifactTools.map((tool) => (
                <button
                  key={tool.type}
                  type="button"
                  disabled={generate.isPending || !hasReadySources}
                  onClick={() => generate.mutate(tool.type)}
                  className="flex min-h-28 min-w-0 flex-col items-start rounded-xl border border-border bg-background p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                >
                  <span className="mb-3 flex size-8 items-center justify-center rounded-lg border border-border text-primary">
                    <tool.icon className="size-4" />
                  </span>
                  <span className="text-xs font-semibold">{tool.label}</span>
                  <span className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                    {tool.description}
                  </span>
                </button>
              ))}
            </div>
            {generate.error && (
              <p role="alert" className="mt-3 text-xs text-destructive">
                {generate.error.message}
              </p>
            )}
            <div className="mt-7 border-t border-border pt-5">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Created artifacts{" "}
                <span className="font-normal">
                  ({artifacts.data?.length ?? 0})
                </span>
              </h3>
              {artifacts.isPending && (
                <p className="text-xs text-muted-foreground">
                  Loading artifacts…
                </p>
              )}
              {artifacts.error && (
                <p role="alert" className="text-xs text-destructive">
                  {artifacts.error.message}
                </p>
              )}
              {artifacts.data?.length === 0 && (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <Layers3 className="mx-auto mb-3 size-5 text-primary" />
                  <p className="text-xs font-medium">No artifacts yet</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Choose a tool above after adding a source.
                  </p>
                </div>
              )}
              <ul className="space-y-2">
                {artifacts.data?.map((artifact) => (
                  <li
                    key={artifact.id}
                    className="rounded-xl border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium">{artifact.title}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {artifact.status.toLowerCase()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete artifact ${artifact.title}`}
                        title="Delete artifact"
                        onClick={() => {
                          remove.reset();
                          setDeleteTarget({
                            type: "artifact",
                            id: artifact.id,
                          });
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                    {artifact.status === "FAILED" && (
                      <div className="mt-2 text-xs">
                        <p className="text-destructive">
                          {artifact.metadata?.error ||
                            "Generation failed. Please try again."}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          disabled={generate.isPending || !hasReadySources}
                          onClick={() => generate.mutate(artifact.type)}
                        >
                          Generate again
                        </Button>
                      </div>
                    )}
                    {artifact.status === "READY" &&
                      artifact.content != null && (
                        <button
                          onClick={() => setSelectedArtifactId(artifact.id)}
                          className="mt-2 text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          Open artifact
                        </button>
                      )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>
      <Dialog
        open={!!selectedArtifact}
        onOpenChange={(open) => {
          if (!open) setSelectedArtifactId(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] w-full max-w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-border bg-card p-6 sm:max-w-2xl sm:p-8">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="font-heading text-2xl">
              {selectedArtifact?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedArtifact?.type.toLowerCase()} · Generated from your
              workspace sources
            </DialogDescription>
          </DialogHeader>
          {selectedArtifact && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyText(artifactDocument(selectedArtifact))}
              >
                <Copy className="size-3.5" /> Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadArtifact(selectedArtifact)}
              >
                <Download className="size-3.5" /> Download Markdown
              </Button>
            </div>
          )}
          {selectedArtifact && (
            <ArtifactContent
              key={selectedArtifact.id}
              artifact={selectedArtifact}
            />
          )}
        </DialogContent>
      </Dialog>
      <ConfirmAction
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete this ${deleteTarget?.type ?? "item"}?`}
        description="This will permanently remove it from this workspace."
        pending={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
