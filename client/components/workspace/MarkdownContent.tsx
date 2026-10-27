import { createElement, type ReactNode } from "react";

function inline(
  value: string,
  onCitation?: (index: number) => void,
  citationCount = 0,
): ReactNode[] {
  return value
    .split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\[\d+\])/g)
    .map((part, index) => {
      const citation = part.match(/^\[(\d+)\]$/);
      if (
        citation &&
        onCitation &&
        Number(citation[1]) > 0 &&
        Number(citation[1]) <= citationCount
      )
        return (
          <button
            key={index}
            onClick={() => onCitation(Number(citation[1]) - 1)}
            aria-label={`Citation ${citation[1]}`}
            className="citation-chip mx-0.5 rounded border px-1.5 py-0.5 text-[10px] leading-none focus-visible:outline-2 focus-visible:outline-ring"
          >
            {part}
          </button>
        );
      if (part.startsWith("**") && part.endsWith("**"))
        return (
          <strong key={index} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      if (part.startsWith("`") && part.endsWith("`"))
        return (
          <code
            key={index}
            className="rounded bg-muted px-1 py-0.5 text-[0.9em]"
          >
            {part.slice(1, -1)}
          </code>
        );
      const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (link)
        return (
          <a
            key={index}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-4"
          >
            {link[1]}
          </a>
        );
      return part;
    });
}

export function MarkdownContent({
  content,
  onCitation,
  citationCount = 0,
}: {
  content: string;
  onCitation?: (index: number) => void;
  citationCount?: number;
}) {
  const blocks: ReactNode[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (line.trim().startsWith("```")) {
      const code: string[] = [];
      while (++index < lines.length && !lines[index].trim().startsWith("```"))
        code.push(lines[index]);
      blocks.push(
        <pre
          key={index}
          className="overflow-x-auto rounded-xl border border-border bg-background p-4 text-xs"
        >
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push(
        createElement(
          `h${Math.min(heading[1].length + 1, 6)}`,
          {
            key: index,
            className: "font-heading text-xl leading-tight text-foreground",
          },
          inline(heading[2], onCitation, citationCount),
        ),
      );
      continue;
    }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(<hr key={index} className="border-border" />);
      continue;
    }
    const list = line.match(/^\s*(?:[-*+]\s+|\d+\.\s+)(.+)$/);
    if (list) {
      blocks.push(
        <div key={index} className="flex gap-2">
          <span aria-hidden="true" className="shrink-0 text-primary">
            •
          </span>
          <span>{inline(list[1], onCitation, citationCount)}</span>
        </div>,
      );
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={index}
          className="border-l-2 border-primary/50 pl-4 text-muted-foreground"
        >
          {inline(line.slice(2), onCitation, citationCount)}
        </blockquote>,
      );
      continue;
    }
    blocks.push(<p key={index}>{inline(line, onCitation, citationCount)}</p>);
  }
  return (
    <div className="space-y-3 text-sm leading-relaxed [overflow-wrap:anywhere]">
      {blocks}
    </div>
  );
}
