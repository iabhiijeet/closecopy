"use client";

import { useState } from "react";
import type { Artifact } from "@/lib/workspaces";
import { MarkdownContent } from "@/components/workspace/MarkdownContent";
import { Button } from "@/components/ui/button";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function ArtifactContent({ artifact }: { artifact: Artifact }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const content = record(artifact.content);
  if (!content)
    return (
      <p className="text-sm text-muted-foreground">
        This artifact has no content yet.
      </p>
    );

  if (artifact.type === "SUMMARY" || artifact.type === "REPORT") {
    const markdown = text(content.markdown);
    return (
      <div className="space-y-5">
        {markdown && <MarkdownContent content={markdown} />}
        {!markdown &&
          Array.isArray(content.sections) &&
          content.sections.map((section, index) => {
            const item = record(section);
            return (
              <section key={index}>
                <h3 className="font-heading text-xl">{text(item?.title)}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {text(item?.content)}
                </p>
              </section>
            );
          })}
      </div>
    );
  }
  if (artifact.type === "TAKEAWAYS" && Array.isArray(content.items)) {
    return (
      <ol className="space-y-3">
        {content.items.map((item, index) => (
          <li
            key={index}
            className="flex gap-3 rounded-xl border border-border bg-background p-4 text-sm"
          >
            <span className="font-semibold text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{text(item)}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (artifact.type === "FLASHCARDS" && Array.isArray(content.cards)) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {content.cards.map((card, index) => {
          const item = record(card);
          return (
            <details
              key={index}
              className="group rounded-xl border border-border bg-background p-4"
            >
              <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                {text(item?.front)}
                <span className="mt-3 block text-[11px] text-primary group-open:hidden">
                  Show answer
                </span>
              </summary>
              <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                {text(item?.back)}
              </p>
            </details>
          );
        })}
      </div>
    );
  }
  if (artifact.type === "QUIZ" && Array.isArray(content.questions)) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {Object.keys(answers).length} of {content.questions.length} answered
          </span>
          <Button variant="outline" size="sm" onClick={() => setAnswers({})}>
            Restart quiz
          </Button>
        </div>
        {content.questions.map((question, index) => {
          const item = record(question);
          const correct =
            typeof item?.correctIndex === "number" ? item.correctIndex : -1;
          return (
            <section
              key={index}
              className="rounded-xl border border-border bg-background p-4"
            >
              <h3 className="text-sm font-medium">
                {index + 1}. {text(item?.question)}
              </h3>
              <div className="mt-3 space-y-2">
                {Array.isArray(item?.options) &&
                  item.options.map((option, optionIndex) => (
                    <button
                      key={optionIndex}
                      aria-pressed={answers[index] === optionIndex}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [index]: optionIndex,
                        }))
                      }
                      className={`block w-full rounded-lg border px-3 py-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-ring ${answers[index] === optionIndex ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                    >
                      {text(option)}
                    </button>
                  ))}
              </div>
              {answers[index] !== undefined && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  <span
                    className={
                      answers[index] === correct
                        ? "text-primary"
                        : "text-destructive"
                    }
                  >
                    {answers[index] === correct ? "Correct." : "Try again."}
                  </span>{" "}
                  {text(item?.explanation)}
                </p>
              )}
            </section>
          );
        })}
      </div>
    );
  }
  if (artifact.type === "MINDMAP" && Array.isArray(content.nodes)) {
    const nodes = content.nodes
      .map(record)
      .filter((node): node is Record<string, unknown> => !!node)
      .map((node) => ({ id: text(node.id), label: text(node.label) }));
    const edges = Array.isArray(content.edges)
      ? content.edges
          .map(record)
          .filter((edge): edge is Record<string, unknown> => !!edge)
          .map((edge) => ({
            source: text(edge.source),
            target: text(edge.target),
          }))
      : [];
    const depths = new Map<string, number>();
    let frontier = nodes.filter(
      (node) => !edges.some((edge) => edge.target === node.id),
    );
    if (!frontier.length && nodes.length) frontier = [nodes[0]];
    let depth = 0;
    while (frontier.length && depth < nodes.length) {
      const next: typeof nodes = [];
      for (const node of frontier) {
        if (depths.has(node.id)) continue;
        depths.set(node.id, depth);
        next.push(
          ...nodes.filter(
            (child) =>
              edges.some(
                (edge) => edge.source === node.id && edge.target === child.id,
              ) && !depths.has(child.id),
          ),
        );
      }
      frontier = next;
      depth++;
    }
    for (const node of nodes)
      if (!depths.has(node.id)) depths.set(node.id, depth);
    const rows = [...new Set(depths.values())]
      .sort((a, b) => a - b)
      .map((level) => nodes.filter((node) => depths.get(node.id) === level));
    const width = Math.max(650, ...rows.map((row) => row.length * 210));
    const positions = new Map(
      rows.flatMap((row, rowIndex) =>
        row.map(
          (node, index) =>
            [
              node.id,
              {
                x: (width / (row.length + 1)) * (index + 1),
                y: 45 + rowIndex * 120,
              },
            ] as const,
        ),
      ),
    );
    return (
      <div className="max-h-[60dvh] overflow-auto rounded-xl border border-border bg-background">
        <svg
          role="img"
          aria-label="Mind map showing connections between source concepts"
          width={width}
          height={Math.max(150, rows.length * 120)}
          className="block"
        >
          {edges.map((edge, index) => {
            const from = positions.get(edge.source);
            const to = positions.get(edge.target);
            return from && to ? (
              <path
                key={index}
                d={`M ${from.x} ${from.y + 28} C ${from.x} ${(from.y + to.y) / 2}, ${to.x} ${(from.y + to.y) / 2}, ${to.x} ${to.y - 28}`}
                fill="none"
                stroke="var(--primary)"
                strokeOpacity="0.5"
                strokeWidth="1.5"
              />
            ) : null;
          })}
          {nodes.map((node) => {
            const position = positions.get(node.id)!;
            return (
              <g key={node.id}>
                <rect
                  x={position.x - 90}
                  y={position.y - 28}
                  width="180"
                  height="56"
                  rx="12"
                  fill="var(--card)"
                  stroke="var(--border)"
                />
                <foreignObject
                  x={position.x - 82}
                  y={position.y - 24}
                  width="164"
                  height="48"
                >
                  <div className="flex h-full items-center justify-center text-center text-[11px] leading-tight text-foreground">
                    {node.label}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">This artifact is ready.</p>
  );
}
