"use client";
import { useReducedMotionPreference as useReducedMotion } from "@/components/landing/useReducedMotionPreference";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  Sparkles,
  Quote,
  Layers,
  Search,
  Lock,
  ArrowUpRight,
  FileText,
  Network,
  ListChecks,
  MessageSquare,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import SpotlightCard from "@/components/landing/SpotlightCard";
import SectionHeading from "@/components/landing/SectionHeading";
import Reveal from "@/components/landing/Reveal";
import CitationChip from "@/components/landing/CitationChip";
import { citations, sources } from "@/lib/mock-data";
const featureData = [
  {
    title: "A conversation with your knowledge.",
    text: "Ask a question. Connect the dots. Get answers grounded in the things you actually read.",
    Icon: MessageSquare,
    large: true,
  },
  {
    title: "Trust it. Then trace it.",
    text: "Every insight has a starting point. Follow a citation straight back to its source.",
    Icon: Quote,
  },
  {
    title: "Many sources. One bigger picture.",
    text: "Bring your books, links, and notes together. Find the thread that runs through them.",
    Icon: Layers,
  },
  {
    title: "Make more than a mental note.",
    text: "Turn what you learn into something you can study, share, or build on.",
    Icon: Sparkles,
    large: true,
  },
  {
    title: "Find the idea, not just the word.",
    text: "Search by meaning and get to the passage you were thinking of.",
    Icon: Search,
  },
  {
    title: "Your space. Your knowledge.",
    text: "A private place for your work, with control over who gets to see it.",
    Icon: Lock,
  },
];
function FeatureVisual({ index }: { index: number }) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const [query, setQuery] = useState("");
  if (index === 0)
    return (
      <div className="relative h-37 sm:h-40 flex flex-col gap-3 justify-center px-2 sm:px-6">
        <motion.div
          className="self-end rounded-xl rounded-tr-sm bg-secondary border border-border px-4 py-2.5 text-[10px] max-w-60"
          initial={{ opacity: 0, x: 10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          How do these ideas connect?
        </motion.div>
        <motion.div
          className="rounded-xl rounded-tl-sm border border-primary/15 bg-primary/5 px-4 py-3 text-[10px] max-w-75"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          viewport={{ once: true }}
        >
          <span className="flex gap-2 items-center mb-2 text-primary">
            <Sparkles className="size-3" /> A shared thread
          </span>
          <span className="text-muted-foreground">
            Your sources connect creativity to deliberate practice.
          </span>
          <div className="mt-2">
            <CitationChip citation={citations[0]} />
          </div>
        </motion.div>
      </div>
    );
  if (index === 1)
    return (
      <div
        className="h-37 py-6 px-2"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="space-y-2 mb-4">
          {[90, 100, 70].map((w, i) => (
            <motion.div
              key={w}
              animate={{ opacity: hover && i === 1 ? 1 : 0.35 }}
              className={
                "h-1.5 rounded-full " +
                (i === 1 ? "bg-citation/60" : "bg-foreground/20")
              }
              style={{ width: w + "%" }}
            />
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="xs"
                className="citation-chip font-mono text-[9px] h-6"
                onFocus={() => setHover(true)}
                onBlur={() => setHover(false)}
              />
            }
          >
            [Source 1 · p.14] <ArrowUpRight className="size-2.5" />
          </TooltipTrigger>
          <TooltipContent>
            “Creativity emerges when familiar ideas are connected in unfamiliar
            ways.”
          </TooltipContent>
        </Tooltip>
      </div>
    );
  if (index === 2)
    return (
      <div className="h-37 flex items-center justify-center group">
        <div className="relative w-40 h-23">
          {sources.map((s, i) => (
            <motion.div
              key={s.id}
              className="absolute inset-0 rounded-lg border border-border bg-popover p-3"
              initial={{ rotate: (i - 1) * 8, y: i * 3 }}
              whileHover={{ rotate: (i - 1) * 15, y: -5 }}
              style={{ zIndex: 3 - i }}
            >
              <FileText className="size-4 text-primary mb-2" />
              <p className="text-[8px] truncate">{s.name}</p>
              <div className="h-1 bg-foreground/10 rounded w-20 mt-2" />
            </motion.div>
          ))}
        </div>
      </div>
    );
  if (index === 3)
    return (
      <div className="h-37 flex items-center justify-center gap-3">
        <motion.div
          className="size-17 rounded-xl border border-border bg-background grid place-items-center"
          whileHover={{ rotate: -6, scale: 1.05 }}
        >
          <FileText className="size-6 text-muted-foreground" />
        </motion.div>
        <div className="w-12 sm:w-20 h-px relative bg-primary/25">
          <span className="absolute -top-0.5 right-0 size-1 rounded-full bg-primary" />
        </div>
        {[ListChecks, Network, Sparkles].map((Icon, i) => (
          <motion.div
            key={i}
            className="size-14 sm:size-17 rounded-xl bg-primary/5 border border-primary/20 grid place-items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            whileHover={{ y: -6 }}
          >
            <Icon className="size-5 text-primary" />
          </motion.div>
        ))}
      </div>
    );
  if (index === 4) {
    const results = sources
      .filter((s) =>
        (s.name + " " + s.snippet).toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, 2);
    return (
      <div className="h-37 pt-3">
        <div className="relative">
          <Search className="size-3.5 absolute left-3 top-3 text-muted-foreground" />
          <Input
            aria-label="Search sample sources"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ideas about creativity…"
            className="pl-9 pr-10 h-9 text-[10px] bg-background/40"
          />
          <Kbd className="absolute right-2 top-2 text-[8px] bg-muted">⌘ K</Kbd>
        </div>
        <div className="mt-3 space-y-2">
          <AnimatePresence>
            {results.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 text-[9px] text-muted-foreground"
              >
                <FileText className="size-3 text-primary" />
                <span className="truncate">{s.name}</span>
                <span className="ml-auto text-citation-foreground font-mono text-[8px]">
                  MATCH
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {!results.length && (
            <p className="text-[10px] text-muted-foreground">
              Try “ideas”, “notes”, or “creative”.
            </p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="h-37 flex items-center justify-center">
      <div className="relative size-20 grid place-items-center">
        <div className="absolute inset-0 border border-primary/15 rounded-full" />
        {!reduce && (
          <motion.div
            className="absolute inset-0 border border-primary/20 rounded-full"
            animate={{ scale: [1, 1.4], opacity: [0.7, 0] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          />
        )}
        <div className="size-12 rounded-xl bg-primary/8 border border-primary/15 grid place-items-center">
          <Lock className="size-5 text-primary" />
        </div>
        <Badge className="absolute -right-2 bottom-0 text-[7px] h-4 bg-background text-success border border-border">
          <Check className="size-2" /> PRIVATE
        </Badge>
      </div>
    </div>
  );
}
export default function Features() {
  return (
    <section id="features" className="section-space">
      <div className="container-page">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="A WORKSPACE THAT GETS YOU"
            title={
              <>
                Less information overload.
                <br />
                More <span className="serif text-primary">possibility.</span>
              </>
            }
            description="Everything you need to go from “I should read this” to “look what I made.”"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureData.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 0.06}
              className={f.large ? "lg:col-span-2" : ""}
            >
              <SpotlightCard>
                <FeatureVisual index={i} />
                <div className="relative z-1 mt-5">
                  <span className="text-primary inline-flex mb-3">
                    <f.Icon className="size-4" />
                  </span>
                  <h3 className="text-base tracking-tight font-semibold mb-2">
                    {f.title}
                  </h3>
                  <p className="text-[13px] leading-[1.7] text-muted-foreground max-w-90">
                    {f.text}
                  </p>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground mt-4 text-right">
          Privacy controls and semantic retrieval shown as product previews.
        </p>
      </div>
    </section>
  );
}
