"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/projects", label: "프로젝트", activePrefixes: ["/projects", "/workspace"] },
  { href: "/assets", label: "에셋", activePrefixes: ["/assets", "/settings"] },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-side-rail" aria-label="Primary navigation">
      <div className="app-logo-mark" aria-label="CloToon AI 로고" role="img">
        <span className="app-logo-letter" aria-hidden="true">
          C
        </span>
        <svg
          className="app-logo-circuit"
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 48 48"
        >
          <path d="M29 14h8v8" />
          <path d="M31 34h6v-8" />
          <path d="M20 24h18" />
          <circle cx="39" cy="14" r="3" />
          <circle cx="39" cy="24" r="3" />
          <circle cx="39" cy="34" r="3" />
        </svg>
        <span className="sr-only">CloToon AI 로고</span>
      </div>
      <div className="app-side-divider" />
      {navItems.map((item) => {
        const active = item.activePrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        );

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="app-side-link"
            data-active={active}
            href={item.href}
            key={item.href}
          >
            <span className="app-side-icon" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
