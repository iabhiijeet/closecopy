import { RequireSession } from "@/components/auth/RequireSession";

export default function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireSession>{children}</RequireSession>;
}
