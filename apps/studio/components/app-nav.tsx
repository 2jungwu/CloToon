"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/projects",
    label: "프로젝트",
    activePrefixes: ["/projects", "/workspace"],
    icon: ProjectIcon,
  },
  { href: "/assets", label: "에셋", activePrefixes: ["/assets", "/settings"], icon: AssetsIcon },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-side-rail" aria-label="Primary navigation">
      <div className="app-logo-mark" aria-label="CloToon AI 로고" role="img">
        <Image alt="" aria-hidden="true" height={42} priority src="/clotoon-logo.svg" width={42} />
        <span className="sr-only">CloToon AI 로고</span>
      </div>
      <div className="app-side-divider" />
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.activePrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        );

        return (
          <Link
            aria-label={item.label}
            aria-current={pathname === item.href ? "page" : undefined}
            className="app-side-link"
            data-active={active}
            href={item.href}
            key={item.href}
          >
            <span className="app-side-icon" aria-hidden="true">
              <Icon />
            </span>
            <span className="app-side-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ProjectIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20M8 11h8M8 7h6" />
    </svg>
  );
}

function AssetsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M14 17H5M19 7h-9" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  );
}
