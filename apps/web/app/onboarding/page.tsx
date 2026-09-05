"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setUserId(user.userId);
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;
    const form = new FormData(e.currentTarget);

    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        resumeText: form.get("resumeText"),
        skills: String(form.get("skills")).split(",").map((s) => s.trim()).filter(Boolean),
        yearsExp: Number(form.get("yearsExp")) || undefined,
        desiredRoles: String(form.get("desiredRoles")).split(",").map((s) => s.trim()).filter(Boolean),
        desiredLocations: String(form.get("desiredLocations")).split(",").map((s) => s.trim()).filter(Boolean),
        minCTC: Number(form.get("minCTC")) || undefined,
        phone: form.get("phone"),
      }),
    });

    for (const portal of ["LINKEDIN", "NAUKRI"] as const) {
      const username = form.get(`${portal}_username`);
      const password = form.get(`${portal}_password`);
      if (username && password) {
        await fetch("/api/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, portal, username, password }),
        });
      }
    }

    setStatus("Saved. The bot will use this the next time it runs.");
  }

  if (!userId) return <main className="mx-auto max-w-2xl px-6 py-12 text-muted">Loading…</main>;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-ink">One-time setup</h1>
      <p className="mb-8 text-sm text-muted">
        This runs once. Come back to this page any time to update it.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <textarea name="resumeText" placeholder="Paste your resume text" required rows={8}
          className="w-full rounded-md border border-gray-300 px-3 py-2" />

        <input name="skills" placeholder="Skills, comma separated"
          className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input name="yearsExp" type="number" placeholder="Years of experience"
          className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input name="desiredRoles" placeholder="Desired roles, comma separated"
          className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input name="desiredLocations" placeholder="Desired locations, comma separated"
          className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input name="minCTC" type="number" placeholder="Minimum CTC"
          className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input name="phone" placeholder="WhatsApp number, e.g. +919876543210"
          className="w-full rounded-md border border-gray-300 px-3 py-2" />

        <fieldset className="rounded-md border border-gray-300 p-4">
          <legend className="px-1 text-sm font-medium">LinkedIn login</legend>
          <input name="LINKEDIN_username" placeholder="Username / email"
            className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2" />
          <input name="LINKEDIN_password" type="password" placeholder="Password"
            className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </fieldset>

        <fieldset className="rounded-md border border-gray-300 p-4">
          <legend className="px-1 text-sm font-medium">Naukri login</legend>
          <input name="NAUKRI_username" placeholder="Username / email"
            className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2" />
          <input name="NAUKRI_password" type="password" placeholder="Password"
            className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </fieldset>

        <button type="submit" className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:opacity-90">
          Save
        </button>
        {status && <p className="text-sm text-accent">{status}</p>}
      </form>
    </main>
  );
}
