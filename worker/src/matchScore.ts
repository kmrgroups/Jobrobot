import type { RunProfile } from "./apiClient.js";

// Simple, dependency-free scoring: weighted overlap of skills/keywords between
// the profile and the job description text. Good enough to gate the 70%
// auto-apply threshold without needing an external LLM call per job (which
// would be slower and cost money at volume).
//
// If you want higher-quality scoring, swap this out for a call to an LLM
// (e.g. the Anthropic API) that reads the resume + JD and returns a score —
// more accurate, but adds latency and cost per job, so weigh that against
// how many jobs you expect to scan per run.
export function computeMatchScore(profile: RunProfile, jobDescription: string, jobTitle: string): number {
  const text = (jobTitle + " " + jobDescription).toLowerCase();

  const skillHits = profile.skills.filter((s) => text.includes(s.toLowerCase())).length;
  const skillScore = profile.skills.length > 0 ? skillHits / profile.skills.length : 0;

  const roleHit = profile.desiredRoles.some((r) => text.includes(r.toLowerCase())) ? 1 : 0;

  const locationHit =
    profile.desiredLocations.length === 0 ||
    profile.desiredLocations.some((l) => text.includes(l.toLowerCase()))
      ? 1
      : 0;

  // Weighted: skills matter most, then role title match, then location fit
  const weighted = skillScore * 0.6 + roleHit * 0.25 + locationHit * 0.15;

  return Math.round(weighted * 100);
}
