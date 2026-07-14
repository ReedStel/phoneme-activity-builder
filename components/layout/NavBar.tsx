"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PRIMARY_LINKS = [
  { href: "/", label: "Home" },
  { href: "/wordle", label: "Wordle" },
  { href: "/wordsearch", label: "Word Search" },
];

const MENU_LINKS = [
  { href: "/about", label: "About" },
  { href: "/settings", label: "Settings" },
];

/**
 * Primary navigation: inline links on wider screens, with a hamburger menu
 * holding About / Settings (and everything else on small screens).
 */
export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const linkClass = (href: string) =>
    `rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-150 ${
      pathname === href
        ? "bg-accent-soft text-accent"
        : "text-muted hover:bg-highlight hover:text-foreground"
    }`;

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-1">
      <div className="hidden sm:flex sm:items-center sm:gap-1">
        {PRIMARY_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={linkClass(link.href)}
            aria-current={pathname === link.href ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="More options"
          className="pressable flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground hover:border-accent hover:bg-highlight"
        >
          {/* Hamburger icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M2 4.5h14M2 9h14M2 13.5h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
          >
            {/* Primary links appear here only on small screens */}
            <div className="sm:hidden">
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`block ${linkClass(link.href)}`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-1 border-border" />
            </div>
            {MENU_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                className={`block ${linkClass(link.href)}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
