import type { ProviderRateLimitsSnapshot } from "@t3tools/contracts";
import { memo } from "react";

interface BranchToolbarRateLimitProps {
  rateLimits: ProviderRateLimitsSnapshot | null | undefined;
}

function formatRemainingPercent(usedPercent: number): string {
  const remaining = Math.max(0, 100 - Math.round(usedPercent));
  return `${remaining}%`;
}

function formatResetDate(resetsAt: number | null | undefined): string | null {
  if (resetsAt == null || !Number.isFinite(resetsAt)) return null;
  const resetMs = resetsAt > 1_000_000_000_000 ? resetsAt : resetsAt * 1000;
  const diffMs = resetMs - Date.now();
  if (diffMs <= 0) return null;
  const date = new Date(resetMs);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month} ${day} ${hours}:${minutes}`;
}

function formatResetsIn(resetsAt: number | null | undefined): string | null {
  if (resetsAt == null || !Number.isFinite(resetsAt)) return null;
  // resetsAt may be seconds (Codex) or milliseconds (Claude) — normalise.
  const resetMs = resetsAt > 1_000_000_000_000 ? resetsAt : resetsAt * 1000;
  const diffMs = resetMs - Date.now();
  if (diffMs <= 0) return null;
  const totalMinutes = Math.ceil(diffMs / 60_000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
}

function usageTone(usedPercent: number | null | undefined): string {
  if (usedPercent == null) return "text-muted-foreground/50";
  if (usedPercent >= 100) return "text-red-500";
  if (usedPercent >= 80) return "text-amber-500";
  return "text-muted-foreground/60";
}

export const BranchToolbarRateLimit = memo(function BranchToolbarRateLimit({
  rateLimits,
}: BranchToolbarRateLimitProps) {
  const primary = rateLimits?.primary ?? null;
  const secondary = rateLimits?.secondary ?? null;

  const primaryRemaining = primary ? formatRemainingPercent(primary.usedPercent) : "--";
  const primaryResets = primary ? formatResetsIn(primary.resetsAt) : null;
  const secondaryRemaining = secondary ? formatRemainingPercent(secondary.usedPercent) : "--";
  const secondaryResets = secondary ? formatResetDate(secondary.resetsAt) : null;

  const parts = [
    { key: "primary-remaining", text: `rate-limit | 5h ${primaryRemaining}` },
    ...(primaryResets ? [{ key: "primary-resets", text: primaryResets }] : []),
    { key: "secondary-remaining", text: `weekly ${secondaryRemaining}` },
    ...(secondaryResets ? [{ key: "secondary-resets", text: secondaryResets }] : []),
  ];

  // Determine overall tone from the most constrained window.
  const maxUsed =
    primary?.usedPercent !== undefined
      ? primary.usedPercent
      : secondary?.usedPercent !== undefined
        ? secondary.usedPercent
        : null;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${usageTone(maxUsed)}`}>
      {parts.map((part, i) => (
        <span key={part.key} className="inline-flex items-center gap-1">
          {i > 0 && (
            <span className="text-muted-foreground/30" aria-hidden="true">
              ·
            </span>
          )}
          {part.text}
        </span>
      ))}
    </span>
  );
});
