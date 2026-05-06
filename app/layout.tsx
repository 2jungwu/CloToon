import type { Metadata } from "next";
import Link from "next/link";
import "./styles.css";
import { AppNav } from "@/components/app-nav";

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
    <html lang="ko" className="font-sans">
      <body>
        <header className="app-header">
          <div className="app-header-inner">
            <Link href="/projects" className="brand">
              CloToon
            </Link>
            <AppNav />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
