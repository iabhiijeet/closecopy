"use client";
import dynamic from "next/dynamic";
const Artifacts = dynamic(
  () => import("@/components/sections/ArtifactsShowcase"),
);
const Playground = dynamic(() => import("@/components/sections/Playground"));
function LazySection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return <div id={id}>{children}</div>;
}
export function LazyArtifacts() {
  return (
    <LazySection id="artifacts">
      <Artifacts />
    </LazySection>
  );
}
export function LazyPlayground() {
  return (
    <LazySection id="playground">
      <Playground />
    </LazySection>
  );
}
