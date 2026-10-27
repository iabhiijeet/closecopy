import type { Artifact } from "@/lib/workspaces";

export function artifactDocument(artifact: Artifact): string {
  const content = artifact.content as Record<string, unknown> | null;
  if (!content || typeof content !== "object")
    return String(artifact.content ?? "");
  if (typeof content.markdown === "string") return content.markdown;
  if (Array.isArray(content.items))
    return content.items.map((item) => `- ${String(item)}`).join("\n");
  if (Array.isArray(content.cards))
    return content.cards
      .map(
        (card: { front?: string; back?: string }, index) =>
          `## ${index + 1}. ${card.front ?? ""}\n\n${card.back ?? ""}`,
      )
      .join("\n\n");
  if (Array.isArray(content.questions))
    return content.questions
      .map(
        (
          question: {
            question?: string;
            options?: string[];
            correctIndex?: number;
            explanation?: string;
          },
          index,
        ) =>
          `## ${index + 1}. ${question.question ?? ""}\n\n${question.options?.map((option, optionIndex) => `${optionIndex + 1}. ${option}`).join("\n") ?? ""}\n\nAnswer: ${question.options?.[question.correctIndex ?? -1] ?? ""}\n\n${question.explanation ?? ""}`,
      )
      .join("\n\n");
  if (Array.isArray(content.nodes)) {
    const nodes = content.nodes as { id: string; label: string }[];
    const names = new Map(nodes.map((node) => [node.id, node.label]));
    const edges = Array.isArray(content.edges)
      ? (content.edges as { source: string; target: string }[])
      : [];
    return `${nodes.map((node) => `- ${node.label}`).join("\n")}\n\n## Connections\n\n${edges.map((edge) => `- ${names.get(edge.source) ?? edge.source} → ${names.get(edge.target) ?? edge.target}`).join("\n")}`;
  }
  return JSON.stringify(content, null, 2);
}

export function downloadArtifact(artifact: Artifact) {
  const blob = new Blob(
    [`# ${artifact.title}\n\n${artifactDocument(artifact)}\n`],
    { type: "text/markdown;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${artifact.title.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "artifact"}.md`;
  link.click();
  URL.revokeObjectURL(url);
}
