import type { Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
import { brandLogo } from "@/lib/brand";
import Providers from "@/components/landing/Providers";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
});
export const metadata: Metadata = {
  title: "closecopy — From sources to something remarkable",
  description:
    "Your sources. Your artifacts. One workspace. Explore cited answers and turn what you read into summaries, quizzes, mind maps, and more.",
  twitter: { card: "summary", images: [brandLogo.src] },
  openGraph: {
    title: "closecopy — Your knowledge, put to work",
    description: "An AI workspace for cited answers and useful artifacts.",
    images: [
      {
        url: brandLogo.src,
        width: brandLogo.width,
        height: brandLogo.height,
        alt: "closecopy logo",
      },
    ],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${newsreader.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
