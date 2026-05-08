"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/projects", label: "Projects", activePrefixes: ["/projects", "/workspace"] },
  { href: "/assets", label: "Assets", activePrefixes: ["/assets", "/settings"] },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation">
      {navItems.map((item) => {
        const active = item.activePrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        );

        return (
          <Link
            aria-current={active ? "page" : undefined}
            data-active={active}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
