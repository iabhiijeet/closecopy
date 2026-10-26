import { Badge } from "@/components/ui/badge";
import {
  FileText,
  BookOpen,
  Globe,
  Play,
  Link2,
  StickyNote,
} from "lucide-react";
const inputs = [
  { label: "PDF", Icon: FileText },
  { label: "EPUB", Icon: BookOpen },
  { label: "DOCX", Icon: FileText },
  { label: "TXT", Icon: StickyNote },
  { label: "Markdown", Icon: FileText },
  { label: "YouTube", Icon: Play },
  { label: "Web links", Icon: Link2 },
  { label: "Google Docs", Icon: Globe },
];
export default function Marquee() {
  return (
    <section
      aria-label="Supported source formats"
      className="border-y border-border bg-card/60 py-7"
    >
      <div className="container-page flex flex-col lg:flex-row gap-7 items-center">
        <div className="shrink-0 text-[9px] text-muted-foreground font-mono leading-relaxed tracking-wider">
          ALL YOUR KNOWLEDGE.
          <br />
          <span className="text-foreground/70">EVERY KIND OF SOURCE.</span>
        </div>
        <div className="flex w-full flex-wrap justify-center gap-2 lg:justify-start">
          {inputs.map(({ label, Icon }) => (
            <Badge
              key={label}
              variant="outline"
              className="gap-2 rounded-full border-border bg-background px-3 h-8 text-[11px] text-muted-foreground font-medium"
            >
              <Icon className="size-3.5 text-primary" />
              {label}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
