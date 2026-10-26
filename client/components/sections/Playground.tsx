"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { motion } from "framer-motion";
import {
  ArrowUp,
  ArrowUpRight,
  FileText,
  MessageSquare,
  Sparkles,
  Network,
  ListChecks,
  Plus,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  sources,
  citations,
  chatScripts,
  artifactTypes,
} from "@/lib/mock-data";
import type { Source, ChatMessage, ArtifactType } from "@/types";
import Logo from "@/components/landing/Logo";
import SectionHeading from "@/components/landing/SectionHeading";
import Reveal from "@/components/landing/Reveal";
import SourceList from "@/components/landing/SourceList";
import Typewriter from "@/components/landing/Typewriter";
import CitationChip from "@/components/landing/CitationChip";
import Shimmer from "@/components/landing/Shimmer";
import GenerateDialog from "@/components/landing/GenerateDialog";
import ArtifactRenderer from "@/components/artifacts/ArtifactRenderer";
import ArtifactActions from "@/components/landing/ArtifactActions";
const desktopQuery = "(min-width: 768px)";
function subscribeDesktop(cb: () => void) {
  const m = matchMedia(desktopQuery);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
export default function Playground() {
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    () => matchMedia(desktopQuery).matches,
    () => false,
  );
  const [localSources, setLocalSources] = useState<Source[]>(sources),
    [prompt, setPrompt] = useState(""),
    [busy, setBusy] = useState(false),
    [messages, setMessages] = useState<ChatMessage[]>([]),
    [artifact, setArtifact] = useState<ArtifactType | null>(null),
    [pendingQuiz, setPendingQuiz] = useState(false),
    [preview, setPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null),
    chatRef = useRef<HTMLDivElement>(null);
  const streamingDone = useCallback(() => {
    setBusy(false);
    if (pendingQuiz) {
      setArtifact("quiz");
      setPendingQuiz(false);
      toast.success("Your sample quiz is ready. Open it in Artifacts.");
    }
  }, [pendingQuiz]);
  function send(text: string) {
    if (!text.trim() || busy) return;
    const isQuiz = /quiz|test/i.test(text);
    const script = chatScripts.find(
      (s) => s.prompt.toLowerCase() === text.trim().toLowerCase(),
    );
    const answer =
      script?.answer ??
      "Here’s how your sample sources connect to “" +
        text.trim() +
        "”: they describe creativity as a practice of observing, connecting, and experimenting. Start by collecting a few observations, combine two unexpected ideas, and test a small version. This demo uses prewritten answers; a real workspace would retrieve passages specific to your question.";
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text.trim() },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: answer,
        citations,
      },
    ]);
    setPrompt("");
    setBusy(true);
    setPendingQuiz(isQuiz);
  }
  useEffect(() => {
    const viewport = chatRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    );
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages, busy]);
  const generated = useCallback((type: ArtifactType) => {
    setArtifact(type);
  }, []);
  function upload(files: FileList | null) {
    if (!files?.length) return;
    const added = Array.from(files).map((f, i): Source => ({
      id: "local-" + Date.now() + "-" + i,
      name: f.name,
      type: f.name.toLowerCase().endsWith(".pdf") ? "pdf" : "doc",
      meta: "Local demo · " + Math.ceil(f.size / 1024) + " KB",
      snippet:
        "This file is displayed locally. Its contents are not read, indexed, or sent to a server in this demo.",
    }));
    setLocalSources((s) => [...s, ...added]);
    toast.success(
      added.length +
        " source" +
        (added.length > 1 ? "s" : "") +
        " added locally. Chat continues to use the sample sources.",
    );
    if (fileRef.current) fileRef.current.value = "";
  }
  const sidebar = (
    <div className="p-4 h-full">
      <div className="flex justify-between items-center mb-5">
        <span className="app-label">
          Sources{" "}
          <span className="text-foreground ml-1">
            {String(localSources.length).padStart(2, "0")}
          </span>
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Add a local source"
                onClick={() => fileRef.current?.click()}
              />
            }
          >
            <Plus />
          </TooltipTrigger>
          <TooltipContent>Add a source locally</TooltipContent>
        </Tooltip>
      </div>
      <ScrollArea className="h-83">
        <SourceList
          items={localSources}
          onAdd={() => fileRef.current?.click()}
        />
      </ScrollArea>
      <p className="text-[9px] text-muted-foreground mt-4 flex gap-1.5">
        <Upload className="size-3" /> Files stay on your device.
      </p>
    </div>
  );
  const chat = (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Sparkles className="size-3.5 text-primary" />
        <p className="text-[11px]">Your curious corner</p>
        <Badge
          variant="outline"
          className="ml-auto text-[8px] h-4 text-muted-foreground"
        >
          DEMO
        </Badge>
      </div>
      <div className="flex-1 min-h-0" ref={chatRef}>
        <ScrollArea className="h-full">
          <div className="p-5 space-y-5">
            {!messages.length ? (
              <div className="pt-8 pb-3 text-center">
                <span className="size-11 rounded-xl border border-primary/15 bg-primary/8 text-primary grid place-items-center mx-auto mb-4">
                  <Logo markOnly markClassName="size-8" />
                </span>
                <h3 className="text-lg tracking-tight">
                  Let’s make a little connection.
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-70 mx-auto mt-3">
                  Three sources. Plenty of possibilities.
                  <br />
                  Try a prompt below, or ask your own question.
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={
                    m.role === "user"
                      ? "ml-10 p-3 rounded-xl rounded-tr-sm border border-border bg-secondary text-xs"
                      : "flex items-start gap-2.5"
                  }
                >
                  {m.role === "assistant" ? (
                    <>
                      <Logo
                        markOnly
                        markClassName="size-5"
                        className="shrink-0 mt-0.5"
                      />
                      <div className="text-xs text-foreground/75 leading-[1.9]">
                        {busy && i === messages.length - 1 ? (
                          <Typewriter
                            text={m.content}
                            speed={12}
                            onComplete={streamingDone}
                          />
                        ) : (
                          m.content
                        )}
                        {(!busy || i !== messages.length - 1) && (
                          <div className="flex gap-1.5 flex-wrap mt-3">
                            {m.citations?.slice(0, 2).map((c) => (
                              <CitationChip key={c.sourceId} citation={c} />
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    m.content
                  )}
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="p-4 mt-auto border-t border-border">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {chatScripts.slice(1).map((s) => (
            <Button
              key={s.prompt}
              variant="outline"
              className="rounded-full text-[9px] h-6 px-2.5 text-muted-foreground"
              disabled={busy}
              onClick={() => send(s.prompt)}
            >
              {s.prompt}
              <ArrowUpRight className="size-2.5" />
            </Button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(prompt);
          }}
          className="relative"
        >
          <Textarea
            aria-label="Ask about the sample sources"
            placeholder="What would you like to explore?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(prompt);
              }
            }}
            className="min-h-17 resize-none bg-background/40 pr-12 text-[11px]"
            maxLength={1000}
          />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="submit"
                  disabled={busy || !prompt.trim()}
                  size="icon-sm"
                  className="absolute right-2 bottom-2 gradient-button"
                  aria-label="Send message"
                />
              }
            >
              <ArrowUp className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Send · Enter</TooltipContent>
          </Tooltip>
        </form>
        <p
          className="text-[8px] mt-2 text-muted-foreground text-center"
          role="status"
        >
          {busy
            ? "Connecting ideas from the sample sources…"
            : "Sample answers · No files are uploaded · Shift + Enter for a new line"}
        </p>
      </div>
    </div>
  );
  const artifacts = (
    <div className="p-4">
      <div className="flex justify-between items-center mb-5">
        <span className="app-label">Artifacts</span>
        <GenerateDialog onGenerate={generated} />
      </div>
      {busy && pendingQuiz ? (
        <Card className="p-4 gap-3 bg-background/40">
          <span className="text-[10px] flex gap-2 text-primary">
            <Sparkles className="size-3" /> Making your quiz…
          </span>
          <Shimmer />
        </Card>
      ) : artifact ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 bg-primary/5 border border-primary/20 gap-3">
            <ListChecks className="size-6 text-primary" />
            <div>
              <p className="text-xs font-medium">
                {artifactTypes.find((a) => a.id === artifact)?.label}: Creative
                thinking
              </p>
              <p className="text-[9px] text-muted-foreground mt-2">
                Generated from your sample sources
              </p>
            </div>
            <Button
              variant="outline"
              className="text-[10px] h-8"
              onClick={() => setPreview(true)}
            >
              Open artifact <ArrowUpRight className="size-3" />
            </Button>
          </Card>
        </motion.div>
      ) : (
        <div className="border border-dashed border-border rounded-xl py-10 px-4 text-center">
          <Network className="size-6 text-primary/50 mx-auto mb-3" />
          <p className="text-xs text-foreground/70">
            Your next creation goes here.
          </p>
          <p className="text-[10px] leading-relaxed mt-2 text-muted-foreground">
            Try “Make a quiz” or generate an artifact from your sources.
          </p>
        </div>
      )}
      <p className="text-[9px] text-muted-foreground leading-relaxed mt-5">
        A starting point for your own thinking.
        <br />
        Source attributions included.
      </p>
    </div>
  );
  return (
    <section aria-label="Interactive playground" className="section-space">
      <div className="container-page">
        <SectionHeading
          eyebrow="LESS EXPLAINING. MORE EXPLORING."
          title={
            <>
              A little <span className="serif text-primary">curiosity</span>{" "}
              looks good on you.
            </>
          }
          description="Ask a question, follow a citation, or create something useful."
        />
        <Input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.epub,.doc,.docx,.txt,.md"
          onChange={(e) => upload(e.target.files)}
          aria-label="Choose local demo sources"
        />
        <Reveal>
          <Card className="glass p-0 gap-0 rounded-2xl">
            <div className="border-b border-border flex items-center justify-between gap-3 p-4">
              <span className="text-xs flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-success" /> Creative
                thinking{" "}
                <span className="text-muted-foreground hidden sm:inline">
                  / sample workspace
                </span>
              </span>
              <Badge
                variant="outline"
                className="text-[8px] border-primary/20 text-primary"
              >
                YOUR INTERACTIVE PLAYGROUND
              </Badge>
            </div>
            <div className="hidden md:block h-112">
              {desktop && (
                <ResizablePanelGroup orientation="horizontal">
                  <ResizablePanel defaultSize="24%" minSize="18%">
                    {sidebar}
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize="50%" minSize="32%">
                    {chat}
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize="26%" minSize="20%">
                    {artifacts}
                  </ResizablePanel>
                </ResizablePanelGroup>
              )}
            </div>
            <Tabs defaultValue="chat" className="md:hidden gap-0">
              <TabsList className="w-full h-10! rounded-none bg-background/30">
                <TabsTrigger value="sources">
                  <FileText />
                  Sources
                </TabsTrigger>
                <TabsTrigger value="chat">
                  <MessageSquare />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="artifacts">
                  <Network />
                  Artifacts
                  {artifact && (
                    <span className="size-1.5 bg-primary rounded-full" />
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="sources" className="h-112">
                {!desktop && sidebar}
              </TabsContent>
              <TabsContent value="chat" className="h-112">
                {!desktop && chat}
              </TabsContent>
              <TabsContent value="artifacts" className="h-112">
                {!desktop && artifacts}
              </TabsContent>
            </Tabs>
          </Card>
        </Reveal>
        <Dialog open={preview} onOpenChange={setPreview}>
          <DialogContent
            className="sm:max-w-3xl max-h-[85svh] overflow-y-auto p-6"
            data-lenis-prevent
          >
            <DialogTitle>
              Creative thinking ·{" "}
              {artifactTypes.find((a) => a.id === artifact)?.label}
            </DialogTitle>
            <DialogDescription>
              Created locally from the sample sources.
            </DialogDescription>
            {artifact && (
              <div className="py-5">
                <ArtifactRenderer type={artifact} />
                <div className="mt-5 flex justify-end">
                  <ArtifactActions type={artifact} />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <p className="text-center text-[9px] text-muted-foreground mt-5">
          This is a frontend demo. No account, upload, or API call required.
        </p>
      </div>
    </section>
  );
}
