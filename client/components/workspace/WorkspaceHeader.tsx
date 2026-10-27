"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, LogOut, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "@/components/landing/Logo";
import { WorkspaceSettings } from "@/components/workspace/WorkspaceSettings";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth";
import { workspaceApi, type Workspace } from "@/lib/workspaces";
import { useQuery } from "@tanstack/react-query";

export function WorkspaceHeader({ workspace }: { workspace?: Workspace }) {
  const { data } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const workspaces = useQuery({
    queryKey: ["workspaces"],
    queryFn: workspaceApi.list,
    enabled: !!workspace,
    staleTime: 60_000,
  });
  async function logout() {
    try {
      await signOut();
      queryClient.clear();
      router.replace("/login");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not sign out. Please try again.",
      );
    }
  }
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-background/90 backdrop-blur-[12px]">
      <div className="flex h-17 w-full items-center justify-between gap-2 px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            href="/workspaces"
            aria-label="All workspaces"
            className="shrink-0 rounded-lg text-xl focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Logo />
          </Link>
          {workspace && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="h-9 min-w-0 max-w-[30vw] justify-between gap-2 px-2 sm:max-w-[min(52vw,280px)] sm:px-3"
                    aria-label="Switch workspace"
                  />
                }
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0">{workspace.icon || "📚"}</span>
                  <span
                    role="heading"
                    aria-level={1}
                    className="truncate text-xs font-medium"
                  >
                    {workspace.title}
                  </span>
                </span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {workspaces.data?.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => router.push(`/workspaces/${item.id}`)}
                    className="cursor-pointer"
                  >
                    <span className="shrink-0">{item.icon || "📚"}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {item.title}
                    </span>
                    {item.id === workspace.id && (
                      <Check className="size-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/workspaces")}
                  className="cursor-pointer text-primary"
                >
                  View all workspaces
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-1 text-sm sm:gap-3">
          {workspace && (
            <WorkspaceSettings key={workspace.id} workspace={workspace} />
          )}
          <span className="hidden max-w-48 truncate text-muted-foreground lg:block">
            {data?.user.name || data?.user.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle light and dark mode"
            title="Toggle light and dark mode"
          >
            <SunMoon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
