"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, clearCurrentUser, CurrentUser } from "@/lib/currentUser";
import { useRouter } from "next/navigation";

export default function Nav() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3 text-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-ink">Job Bot</Link>
          {user && (
            <>
              <Link href="/dashboard" className="text-muted hover:text-ink">Dashboard</Link>
              <Link href="/onboarding" className="text-muted hover:text-ink">Setup</Link>
              <Link href="/settings" className="text-muted hover:text-ink">Settings</Link>
            </>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-3 text-muted">
            <span>{user.email}</span>
            <button
              onClick={() => {
                clearCurrentUser();
                setUser(null);
                router.push("/");
              }}
              className="text-accent hover:underline"
            >
              Switch account
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
