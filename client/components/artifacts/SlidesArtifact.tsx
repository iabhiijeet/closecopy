"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { slides } from "@/lib/mock-data";
export default function SlidesArtifact({
  items = slides,
}: {
  items?: typeof slides;
}) {
  return (
    <div className="preview-paper">
      <p className="eyebrow mb-4">YOUR NEXT PRESENTATION, STARTED</p>
      <h3 className="text-2xl font-medium tracking-tight mb-7">
        Give your ideas a little structure.
      </h3>
      <Carousel
        opts={{ align: "start" }}
        className="mx-8"
        aria-label="Slide outline"
      >
        <CarouselContent>
          {items.map((s, i) => (
            <CarouselItem key={s.title} className="basis-[90%]">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="h-65 sm:h-72 bg-linear-to-br from-primary/15 via-card to-gold/5 border border-primary/20 p-6 sm:p-8 gap-0">
                  <div className="flex justify-between items-center">
                    <p className="font-mono text-[9px] text-primary">
                      SLIDE 0{i + 1}
                    </p>
                    <ArrowUpRight className="size-4 text-gold" />
                  </div>
                  <h4 className="mt-8 text-2xl sm:text-3xl tracking-tight font-medium max-w-sm">
                    {s.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-3">
                    {s.subtitle}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {s.points.map((p) => (
                      <li
                        key={p}
                        className="text-[11px] text-foreground/70 flex items-center gap-2"
                      >
                        <span className="size-1 rounded-full bg-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-10" />
        <CarouselNext className="-right-10" />
      </Carousel>
      <p className="text-center mt-5 text-[10px] text-muted-foreground">
        3 slides · A starting point for your own story
      </p>
    </div>
  );
}
