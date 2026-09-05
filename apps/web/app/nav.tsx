"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, clearCurrentUser, CurrentUser } from "@/lib/currentUser";
import NotificationBell from "./notification-bell";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Setup" },
  { href: "/settings", label: "Settings" },
  { href: "/setup-guide", label: "Deploy Guide" },
];

export default function Nav() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
              J
            </span>
            <span>Job Bot</span>
          </Link>
          {user && (
            <div className="hidden items-center gap-1 sm:flex">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    pathname === link.href
                      ? "bg-accent-light text-accent"
                      : "text-muted hover:bg-paper hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <NotificationBell user={user} />
            <div className="hidden items-center gap-2 border-l border-border pl-3 sm:flex">
              <span className="text-sm text-muted">{user.email}</span>
              <button
                onClick={() => {
                  clearCurrentUser();
                  setUser(null);
                  router.push("/");
                }}
                className="text-sm font-medium text-accent hover:underline"
              >
                Switch
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
