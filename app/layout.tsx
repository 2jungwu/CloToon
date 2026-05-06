import type { Metadata } from "next";
import Link from "next/link";
import "./styles.css";
import { Noto_Sans_KR } from "next/font/google";
import { cn } from "@/lib/utils";
import { AppNav } from "@/components/app-nav";

const notoSans = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Local Comic Card Studio",
  description: "Localhost studio for Instagram comics and card news.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("font-sans", notoSans.variable)}>
      <body>
        <header className="app-header">
          <Link href="/projects" className="brand">
            Local Studio
          </Link>
          <AppNav />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
