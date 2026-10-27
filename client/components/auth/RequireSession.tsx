"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

export function RequireSession({ children }: { children: ReactNode }) {
  const { data, isPending, isError } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  useEffect(() => {
    const expire = () => queryClient.setQueryData(["session"], null);
    window.addEventListener("closecopy:session-expired", expire);
    return () =>
      window.removeEventListener("closecopy:session-expired", expire);
  }, [queryClient]);

  useEffect(() => {
    if (!isPending && !data?.user && !isError)
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [data, isError, isPending, pathname, router]);

  if (isPending)
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Opening your workspace…
      </main>
    );
  if (isError)
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <p>Could not connect to the auth server.</p>
        <button
          className="text-primary underline"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </main>
    );
  if (!data?.user) return null;
  return <>{children}</>;
}
