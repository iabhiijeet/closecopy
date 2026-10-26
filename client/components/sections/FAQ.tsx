"use client";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import SectionHeading from "@/components/landing/SectionHeading";
import Reveal from "@/components/landing/Reveal";
import { faqs } from "@/lib/mock-data";
export default function FAQ() {
  return (
    <section id="faq" className="pb-20 sm:pb-28">
      <div className="container-page">
        <div className="grid lg:grid-cols-[1fr_1.35fr] gap-10 lg:gap-20 max-w-5xl mx-auto">
          <SectionHeading
            align="left"
            eyebrow="A FEW THINGS YOU MIGHT BE WONDERING"
            title={
              <>
                Good questions.
                <br />
                <span className="serif text-primary">Clear answers.</span>
              </>
            }
            description="A little context before your next rabbit hole."
          />
          <Reveal>
            <Accordion multiple={false} defaultValue={[]}>
              {faqs.map((f) => (
                <AccordionItem key={f.question} value={f.question}>
                  <AccordionTrigger className="py-5 text-[13px] font-medium">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <p className="text-[13px] text-muted-foreground leading-[1.75] pr-5">
                      {f.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
