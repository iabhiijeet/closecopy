"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, FolderPlus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { useSession } from "@/lib/auth";
import { workspaceApi } from "@/lib/workspaces";

const icons = [
  "📚",
  "🔬",
  "💻",
  "🧠",
  "📊",
  "⚡",
  "🎨",
  "📝",
  "🌐",
  "🎯",
  "💡",
  "🚀",
];

export default function WorkspacesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [icon, setIcon] = useState("📚");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const {
    data: workspaces,
    isPending,
    error,
    refetch,
  } = useQuery({ queryKey: ["workspaces"], queryFn: workspaceApi.list });
  const create = useMutation({
    mutationFn: workspaceApi.create,
    onSuccess: async (workspace) => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setOpen(false);
      setTitle("");
      setDescription("");
      setIcon("📚");
      router.push(`/workspaces/${workspace.id}`);
    },
  });
  const filtered = workspaces?.filter((workspace) =>
    `${workspace.title} ${workspace.description ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const firstName = session?.user.name?.trim().split(/\s+/)[0];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    create.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      icon,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <WorkspaceHeader />
      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <div className="flex flex-col gap-7 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-3">Your research library</p>
            <h1 className="font-heading text-4xl leading-[1.12] tracking-[-0.02em] sm:text-5xl">
              Welcome back{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Find a workspace or start a new line of research.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <label className="relative block sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <span className="sr-only">Search workspaces</span>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search workspaces"
                className="h-11 pl-10"
              />
            </label>
            <Button
              onClick={() => setOpen(true)}
              className="h-11 gap-2 bg-[var(--primary-fill)] px-5 text-[var(--primary-fill-foreground)] hover:opacity-90"
            >
              <Plus className="size-4" /> New workspace
            </Button>
          </div>
        </div>

        <section className="pt-9" aria-labelledby="workspaces-heading">
          <h2
            id="workspaces-heading"
            className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            Your workspaces{" "}
            <span className="font-normal">({workspaces?.length ?? 0})</span>
          </h2>
          {isPending && (
            <p className="py-12 text-sm text-muted-foreground">
              Loading workspaces…
            </p>
          )}
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-border bg-card p-6 text-sm"
            >
              Could not load your workspaces.{" "}
              <button
                onClick={() => refetch()}
                className="ml-2 text-primary underline"
              >
                Try again
              </button>
            </div>
          )}
          {filtered && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {!search && (
                <button
                  onClick={() => setOpen(true)}
                  className="group flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="mb-5 flex size-12 items-center justify-center rounded-full border border-border bg-card text-primary">
                    <FolderPlus className="size-5" />
                  </span>
                  <span className="font-heading text-xl">
                    Create new workspace
                  </span>
                  <span className="mt-2 max-w-48 text-xs leading-relaxed text-muted-foreground">
                    Gather sources, ask questions and make study materials.
                  </span>
                </button>
              )}
              {filtered.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/workspaces/${workspace.id}`}
                  className="group flex min-h-52 flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">
                      {workspace.icon || "📚"}
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="mt-6 line-clamp-2 font-heading text-xl leading-tight">
                    {workspace.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {workspace.description ||
                      "Open your sources, conversations and artifacts."}
                  </p>
                </Link>
              ))}
            </div>
          )}
          {filtered?.length === 0 && !!search && (
            <p className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">
              No workspaces match “{search}”.
            </p>
          )}
        </section>
      </main>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!create.isPending) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90dvh] w-full max-w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl sm:max-w-lg sm:p-8">
          <DialogHeader className="border-b border-border pb-5">
            <DialogTitle className="flex items-center gap-2 font-heading text-2xl">
              <FolderPlus className="size-5 text-primary" /> Create a workspace
            </DialogTitle>
            <DialogDescription>
              A clear home for one research topic.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-xs font-medium">
                Workspace icon
              </legend>
              <div className="grid grid-cols-6 gap-2 rounded-xl border border-border bg-background p-3">
                {icons.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setIcon(option)}
                    aria-label={`Use ${option} icon`}
                    aria-pressed={icon === option}
                    className={`flex h-10 min-w-0 items-center justify-center rounded-lg text-xl transition-colors focus-visible:outline-2 focus-visible:outline-ring ${icon === option ? "bg-primary/15 ring-1 ring-primary" : "hover:bg-muted"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block space-y-2 text-xs font-medium">
              Title
              <Input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={120}
                placeholder="e.g. Breast cancer immunotherapy"
                className="h-11"
              />
            </label>
            <label className="block space-y-2 text-xs font-medium">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                placeholder="What will you study here?"
                className="min-h-24"
              />
            </label>
            {create.error && (
              <p role="alert" className="text-xs text-destructive">
                {create.error.message}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={create.isPending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending || !title.trim()}
                className="bg-[var(--primary-fill)] text-[var(--primary-fill-foreground)]"
              >
                {create.isPending ? "Creating…" : "Create workspace"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
