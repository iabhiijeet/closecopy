"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmAction } from "@/components/workspace/ConfirmAction";
import { workspaceApi, type Workspace } from "@/lib/workspaces";

export function WorkspaceSettings({ workspace }: { workspace: Workspace }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState(workspace.title);
  const [description, setDescription] = useState(workspace.description ?? "");
  const [model, setModel] = useState(workspace.defaultModel || "gpt-4o-mini");
  const queryClient = useQueryClient();
  const router = useRouter();
  const save = useMutation({
    mutationFn: () =>
      workspaceApi.update(workspace.id, {
        title: title.trim(),
        description: description.trim(),
        defaultModel: model,
      }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["workspace", workspace.id], updated);
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: () => workspaceApi.remove(workspace.id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ["workspace", workspace.id] });
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      router.replace("/workspaces");
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim()) save.mutate();
  }
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Workspace settings"
        title="Workspace settings"
        onClick={() => {
          setTitle(workspace.title);
          setDescription(workspace.description ?? "");
          setModel(workspace.defaultModel || "gpt-4o-mini");
          save.reset();
          setOpen(true);
        }}
      >
        <Settings2 className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border border-border bg-card p-6 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Workspace settings
            </DialogTitle>
            <DialogDescription>
              Update the details of this research project.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <label className="block space-y-2 text-sm">
              Title
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={120}
              />
            </label>
            <label className="block space-y-2 text-sm">
              Description
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
              />
            </label>
            <label className="block space-y-2 text-sm">
              Default model
              <NativeSelect
                value={model}
                onChange={(event) => setModel(event.target.value)}
              >
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4o">gpt-4o</option>
              </NativeSelect>
            </label>
            {save.error && (
              <p role="alert" className="text-sm text-destructive">
                {save.error.message}
              </p>
            )}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setOpen(false);
                  setDeleting(true);
                }}
              >
                Delete workspace
              </Button>
              <Button type="submit" disabled={save.isPending || !title.trim()}>
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmAction
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this workspace?"
        description="Its sources, conversations and artifacts will be permanently deleted."
        pending={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}
