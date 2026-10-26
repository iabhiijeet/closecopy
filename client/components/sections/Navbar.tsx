"use client";
import { Menu, ArrowUpRight, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import Logo from "@/components/landing/Logo";
import MagneticButton from "@/components/landing/MagneticButton";
const links = [
  ["Features", "features"],
  ["Artifacts", "artifacts"],
  ["How it works", "how-it-works"],
  ["Pricing", "pricing"],
  ["FAQ", "faq"],
];
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle light and dark mode"
      title="Toggle light and dark mode"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-muted-foreground hover:text-foreground"
    >
      <SunMoon className="size-4" />
    </Button>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-[12px]">
      <div className="container-page flex h-19 items-center justify-between gap-5">
        <a href="#home" aria-label="closecopy home" className="text-[25px]">
          <Logo />
        </a>
        <NavigationMenu className="hidden md:flex" aria-label="Main navigation">
          <NavigationMenuList className="gap-2 lg:gap-4">
            {links.map(([label, id]) => (
              <NavigationMenuItem key={id}>
                <NavigationMenuLink
                  href={"#" + id}
                  className="text-xs text-muted-foreground px-2 hover:text-foreground"
                >
                  {label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            className="text-xs"
            onClick={() =>
              toast.info(
                "You’re exploring the frontend demo. Try the workspace below — no sign-in needed.",
              )
            }
          >
            Sign in
          </Button>
          <MagneticButton
            render={<a href="#playground" />}
            className="h-9 px-4 text-[11px]"
          >
            Get started <ArrowUpRight className="size-3.5" />
          </MagneticButton>
        </div>
        <div className="ml-auto md:hidden">
          <ThemeToggle />
        </div>
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
                className="md:hidden"
              />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader className="pt-10">
              <SheetTitle>
                <Logo className="text-2xl" />
              </SheetTitle>
              <SheetDescription>Your knowledge, put to work.</SheetDescription>
            </SheetHeader>
            <nav
              className="px-5 flex flex-col gap-3"
              aria-label="Mobile navigation"
            >
              {links.map(([label, id]) => (
                <SheetClose
                  role="link"
                  nativeButton={false}
                  key={id}
                  render={
                    <a
                      href={"#" + id}
                      className="rounded-lg p-3 text-sm hover:bg-muted"
                    />
                  }
                >
                  {label}
                </SheetClose>
              ))}
              <SheetClose
                role="link"
                render={
                  <Button
                    nativeButton={false}
                    role="link"
                    render={<a href="#playground" />}
                    className="gradient-button mt-4 h-11"
                  />
                }
              >
                Get started <ArrowUpRight />
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
