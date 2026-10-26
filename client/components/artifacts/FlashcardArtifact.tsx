"use client";
import { useReducedMotionPreference as useReducedMotion } from "@/components/landing/useReducedMotionPreference";
import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { flashcards } from "@/lib/mock-data";
function FlipCard({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="[perspective:1000px]">
      <Button
        variant="ghost"
        onClick={() => setFlipped((v) => !v)}
        aria-label={flipped ? "Show question" : "Reveal answer"}
        aria-pressed={flipped}
        className="block relative h-64 sm:h-72 w-full p-0 whitespace-normal hover:bg-transparent"
      >
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: !reduce && flipped ? 180 : 0 }}
          transition={{ duration: 0.55 }}
        >
          {[false, true].map((back) => (
            <div
              key={String(back)}
              aria-hidden={flipped !== back}
              className={
                "absolute inset-0 rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-card to-gold/5 flex flex-col items-center justify-center p-8 [backface-visibility:hidden] " +
                (back && !reduce ? "[transform:rotateY(180deg)]" : "")
              }
              style={
                reduce
                  ? { display: flipped === back ? "flex" : "none" }
                  : undefined
              }
            >
              <p className="eyebrow mb-6">
                {back ? "THE ANSWER" : "CARD 0" + (index + 1)}
              </p>
              <p className="max-w-md text-xl sm:text-2xl leading-relaxed tracking-tight font-normal">
                {back ? answer : question}
              </p>
              <span className="flex gap-2 text-[10px] text-muted-foreground mt-7">
                <RotateCcw className="size-3" />
                {back ? "Tap to see question" : "Tap to reveal answer"}
              </span>
            </div>
          ))}
        </motion.div>
      </Button>
    </div>
  );
}
export default function FlashcardArtifact({
  cards = flashcards,
}: {
  cards?: typeof flashcards;
}) {
  return (
    <div className="preview-paper">
      <p className="eyebrow mb-4">MAKE IT STICK</p>
      <h3 className="text-2xl font-medium tracking-tight mb-6">
        A little recall goes a long way.
      </h3>
      <Carousel
        opts={{ loop: true }}
        className="mx-8"
        aria-label="Creative thinking flashcards"
      >
        <CarouselContent>
          {cards.map((c, i) => (
            <CarouselItem key={c.question}>
              <FlipCard {...c} index={i} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-10" />
        <CarouselNext className="-right-10" />
      </Carousel>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Swipe, use the arrows, or flip a card to explore.
      </p>
    </div>
  );
}
