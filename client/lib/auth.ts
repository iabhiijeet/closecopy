"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type Session = {
  user: { id: string; name: string; email: string; image?: string | null };
  session: { id: string; expiresAt: string };
};

export function authDestination() {
  if (typeof window === "undefined") return "/workspaces";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && /^\/workspaces(?:\/[^?#]*)?(?:\?[^#]*)?(?:#.*)?$/.test(next)
    ? next
    : "/workspaces";
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => apiFetch<Session | null>("/api/auth/get-session"),
    retry: false,
    staleTime: 30_000,
  });
}

export function signIn(email: string, password: string) {
  return apiFetch<Session>("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signUp(name: string, email: string, password: string) {
  return apiFetch<Session>("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function signOut() {
  return apiFetch<void>("/api/auth/sign-out", { method: "POST", body: "{}" });
}

export async function signInWithGoogle() {
  const result = await apiFetch<{ url?: string }>("/api/auth/sign-in/social", {
    method: "POST",
    body: JSON.stringify({
      provider: "google",
      callbackURL: `${window.location.origin}${authDestination()}`,
    }),
  });
  if (!result.url)
    throw new Error("Google sign-in did not return a redirect URL");
  window.location.assign(result.url);
}
