"use client";
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Sparkles, Check, ArrowUpRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { artifactTypes, sources } from "@/lib/mock-data";
import type { ArtifactType } from "@/types";
import ArtifactRenderer from "@/components/artifacts/ArtifactRenderer";
import ArtifactActions from "@/components/landing/ArtifactActions";
import GenerateDialog from "@/components/landing/GenerateDialog";
import SectionHeading from "@/components/landing/SectionHeading";
import Reveal from "@/components/landing/Reveal";
const MotionCard = motion.create(Card);

export default function ArtifactsShowcase() {
  const [type, setType] = useState<ArtifactType>("summary"),
    [sourceIds, setSourceIds] = useState(sources.map((s) => s.id)),
    [generation, setGeneration] = useState(0);
  const generate = useCallback((t: ArtifactType, ids: string[]) => {
    setType(t);
    setSourceIds(ids);
    setGeneration((n) => n + 1);
  }, []);
  const active = artifactTypes.find((a) => a.id === type)!;
  return (
    <section
      aria-label="Artifact showcase"
      className="section-space relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="aurora-orb absolute -z-10 left-1/4 top-0 w-150 h-150 opacity-40"
      />
      <div className="container-page">
        <SectionHeading
          eyebrow="BEYOND THE CHAT BOX"
          title={
            <>
              Turn any source into
              <br />
              something you can <span className="serif text-primary">use.</span>
            </>
          }
          description="Make a study guide, quiz, report, or a fresh starting point."
        />
        <Reveal>
          <Tabs
            className="w-full min-w-0"
            value={type}
            onValueChange={(v) => setType(v as ArtifactType)}
          >
            <div className="w-full min-w-0 overflow-x-auto pb-4 sm:flex sm:justify-center">
              <TabsList className="bg-card border border-border h-11! gap-1 p-1 rounded-xl">
                {artifactTypes.map((a) => (
                  <TabsTrigger
                    key={a.id}
                    value={a.id}
                    className="px-3 sm:px-4 text-[10px] h-8 data-active:bg-primary/15! data-active:text-primary! data-active:border-primary/20!"
                  >
                    {a.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <MotionCard
              layout
              className="glass w-full p-0 gap-0 rounded-2xl max-w-5xl mx-auto"
            >
              <div className="flex flex-wrap gap-3 items-center justify-between px-5 sm:px-7 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-medium">
                      Creative thinking{" "}
                      <span className="text-muted-foreground font-normal">
                        / {active.label}
                      </span>
                    </p>
                    <p className="text-[9px] mt-1 text-muted-foreground">
                      {active.description}
                    </p>
                  </div>
                </div>
                <GenerateDialog onGenerate={generate} initialType={type} />
              </div>
              <div className="grid lg:grid-cols-[210px_1fr]">
                <aside className="hidden lg:flex flex-col border-r border-border p-6 bg-background/20">
                  <p className="app-label mb-5">THE INGREDIENTS</p>
                  {sources.map((s) => (
                    <div key={s.id} className="flex gap-2.5 items-start mb-5">
                      <FileText className="size-3.5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] leading-relaxed">{s.name}</p>
                        <p className="text-[9px] text-muted-foreground mt-1">
                          {s.meta}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Separator className="mb-5" />
                  <p className="app-label mb-3">THE POSSIBILITY</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    A fresh format.
                    <br />
                    The same trusted sources.
                  </p>
                  <div className="mt-auto pt-12">
                    <span className="text-[9px] text-success flex items-center gap-1.5">
                      <Check className="size-3" /> Made from {sourceIds.length}{" "}
                      sources
                    </span>
                    <span className="text-[9px] text-muted-foreground block mt-2">
                      Sample artifact preview
                    </span>
                  </div>
                </aside>
                <div className="min-w-0 min-h-130 p-5 sm:p-9">
                  <AnimatePresence mode="wait">
                    {artifactTypes
                      .filter((a) => a.id === type)
                      .map((a) => (
                        <TabsContent key={a.id + generation} value={a.id}>
                          <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                          >
                            <ArtifactRenderer type={type} />
                          </motion.div>
                        </TabsContent>
                      ))}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 items-center justify-between border-t border-border px-5 sm:px-7 py-3">
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="app-label text-[8px]">BASED ON</span>
                  {sourceIds.map((id) => (
                    <Badge
                      key={id}
                      variant="outline"
                      className="citation-chip font-mono text-[8px] h-5"
                    >
                      {sources.find((s) => s.id === id)?.name}
                    </Badge>
                  ))}
                </div>
                <ArtifactActions type={type} sourceIds={sourceIds} />
              </div>
            </MotionCard>
          </Tabs>
        </Reveal>
        <p className="text-center mt-6 text-[10px] text-muted-foreground flex justify-center items-center gap-2">
          <ArrowUpRight className="size-3 text-primary" /> Eight ways to make it
          yours. One place to start.
        </p>
      </div>
    </section>
  );
}
