import type { Metadata } from "next";
import "./styles.css";
import { AppNav } from "@/components/app-nav";

export const metadata: Metadata = {
  title: "Local Comic Card Studio",
  description: "Localhost studio for Instagram comics and card news.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="font-sans">
      <body>
        <AppNav />
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
