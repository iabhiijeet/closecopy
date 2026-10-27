"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/landing/Logo";
import {
  authDestination,
  signIn,
  signInWithGoogle,
  signUp,
  useSession,
} from "@/lib/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (session.data?.user) router.replace(authDestination());
  }, [router, session.data?.user]);

  if (session.data?.user) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      if (mode === "register")
        await signUp(name.trim(), email.trim(), password);
      else await signIn(email.trim(), password);
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.replace(authDestination());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function google() {
    setError("");
    setPending(true);
    try {
      await signInWithGoogle();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Google sign-in is unavailable.",
      );
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          aria-label="closecopy home"
          className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Logo />
        </Link>
        <div className="grid items-center gap-12 py-16 lg:grid-cols-[1fr_440px] lg:gap-24 lg:py-24">
          <div className="max-w-lg">
            <p className="eyebrow mb-5">
              A workspace built around the evidence
            </p>
            <h1 className="font-heading text-5xl leading-[1.12] tracking-[-0.02em] sm:text-6xl">
              Make room for <em className="text-primary">better research.</em>
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground">
              Keep your sources, questions and study materials in one place.
              Every cited answer leads back to what you read.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-9">
            <div className="mb-8">
              <p className="eyebrow mb-3">Your account</p>
              <h2 className="font-heading text-3xl leading-tight">
                {mode === "login" ? "Welcome back" : "Start your workspace"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "login"
                  ? "Sign in to continue your work."
                  : "Create an account to save your research."}
              </p>
            </div>
            <form onSubmit={submit} className="space-y-5">
              {mode === "register" && (
                <label className="block space-y-2 text-sm font-medium">
                  Name
                  <Input
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                    className="h-11"
                    placeholder="Your name"
                  />
                </label>
              )}
              <label className="block space-y-2 text-sm font-medium">
                Email
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Password
                <Input
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-11"
                  placeholder={
                    mode === "register"
                      ? "At least 8 characters"
                      : "Enter your password"
                  }
                />
              </label>
              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={pending}
                className="h-11 w-full bg-[var(--primary-fill)] text-[var(--primary-fill-foreground)] hover:opacity-90"
              >
                {pending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Sign in" : "Create account"}
                    <ArrowRight className="ml-1 size-4" />
                  </>
                )}
              </Button>
            </form>
            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or continue with
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={google}
              className="h-11 w-full"
            >
              Google
            </Button>
            <p className="mt-7 text-center text-sm text-muted-foreground">
              {mode === "login"
                ? "New to closecopy?"
                : "Already have an account?"}{" "}
              <Link
                href={mode === "login" ? "/register" : "/login"}
                className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
