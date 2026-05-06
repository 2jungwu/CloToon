import type { Metadata } from "next";
import Link from "next/link";
import "./styles.css";

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
    <html lang="ko">
      <body>
        <header className="app-header">
          <Link href="/projects" className="brand">
            Local Studio
          </Link>
          <nav aria-label="Primary navigation">
            <Link href="/projects">Projects</Link>
            <Link href="/assets">Assets</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
