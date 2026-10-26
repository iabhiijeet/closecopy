"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { BookOpen, ExternalLink } from "lucide-react";
import type { Citation } from "@/types";
import { sources } from "@/lib/mock-data";
export default function CitationChip({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false);
  const source = sources.find((s) => s.id === citation.sourceId);
  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger
        render={
          <Button
            variant="ghost"
            size="xs"
            aria-label={"Read citation from " + citation.label}
            onClick={() => setOpen((v) => !v)}
            className="h-auto p-0 hover:bg-transparent"
          />
        }
      >
        <Badge
          variant="outline"
          className="citation-chip font-mono text-[10px] h-5"
        >
          [{citation.label}
          {citation.page ? " · p." + citation.page : ""}]
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-75 p-4">
        <div className="flex gap-2 items-center text-xs mb-2 text-citation-foreground">
          <BookOpen className="size-3.5" />
          {source?.name}
          <ExternalLink className="size-3 ml-auto" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          “{citation.snippet}”
        </p>
        {citation.page && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            PAGE {citation.page} · SAMPLE EXCERPT
          </p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
