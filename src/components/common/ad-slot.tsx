import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSSR } from "@/lib/utils";

interface AdSlotProps {
  /** Unique ID for this ad placement (used for localStorage dismiss tracking) */
  placementId: string;
  /** AdSense ad unit slot ID (e.g. "1234567890") — not used in placeholder mode */
  slotId?: string;
  /** Publisher ID (e.g. "pub-3327078370447638") — not used in placeholder mode */
  publisherId?: string;
  /** Fixed width in px */
  width?: number;
  /** Fixed height in px */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Ad format determines default size: "horizontal" | "vertical" | "rectangle" */
  format?: "horizontal" | "vertical" | "rectangle";
  /** Whether to show the close button (default: true) */
  dismissible?: boolean;
  /** Days to wait before showing again after dismiss (default: 7) */
  dismissDays?: number;
}

const FORMAT_LABELS: Record<NonNullable<AdSlotProps["format"]>, string> = {
  horizontal: "Banner Ad",
  vertical: "Sidebar Ad",
  rectangle: "Ad",
};

const FORMAT_DEFAULTS: Record<NonNullable<AdSlotProps["format"]>, { width: number; height: number }> = {
  horizontal: { width: 728, height: 90 },
  vertical: { width: 300, height: 250 },
  rectangle: { width: 336, height: 280 },
};

function getDismissKey(placementId: string) {
  return `ad-dismissed:${placementId}`;
}

function isAdDismissed(placementId: string, dismissDays: number): boolean {
  if (isSSR) return false;
  try {
    const raw = localStorage.getItem(getDismissKey(placementId));
    if (!raw) return false;
    const dismissedAt = Number(raw);
    const cooldown = dismissDays * 24 * 60 * 60 * 1000;
    return Date.now() - dismissedAt < cooldown;
  } catch {
    return false;
  }
}

export function AdSlot({
  placementId,
  width,
  height,
  className,
  format = "horizontal",
  dismissible = true,
  dismissDays = 7,
}: AdSlotProps) {
  const [dismissed, setDismissed] = useState(() =>
    isAdDismissed(placementId, dismissDays),
  );
  const [isClosing, setIsClosing] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsClosing(true);
    try {
      localStorage.setItem(getDismissKey(placementId), String(Date.now()));
    } catch { /* storage unavailable */ }
    setTimeout(() => setDismissed(true), 300);
  }, [placementId]);

  // Re-check dismissal on mount (handles stale SSR state)
  useEffect(() => {
    if (isAdDismissed(placementId, dismissDays)) {
      setDismissed(true);
    }
  }, [placementId, dismissDays]);

  if (dismissed) return null;

  const { width: defaultW, height: defaultH } = FORMAT_DEFAULTS[format];
  const w = width ?? defaultW;
  const h = height ?? defaultH;

  return (
    <div
      className={cn(
        "ad-slot relative mx-auto my-6 overflow-hidden rounded-xl transition-all duration-300",
        isClosing ? "opacity-0 scale-95 max-h-0 my-0" : "opacity-100",
        className,
      )}
      style={{ maxWidth: w, minHeight: h }}
    >
      {/* AdSense disabled — placeholder awaiting approval */}
      <div
        className={cn(
          "flex flex-col items-center justify-center w-full h-full border border-dashed rounded-xl",
          "border-black/10 dark:border-white/10",
          "bg-black/[0.02] dark:bg-white/[0.02]",
        )}
        style={{ minHeight: h }}
      >
        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground/30 select-none">
          {FORMAT_LABELS[format]} · {w}×{h}
        </span>
        <span className="text-[9px] text-muted-foreground/20 mt-1 select-none">
          Awaiting Approval
        </span>
      </div>

      {/* Close button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={cn(
            "absolute top-0 right-0 p-1.5 rounded-bl-lg transition-all z-10",
            "text-muted-foreground/30 hover:text-muted-foreground/60",
            "bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03]",
          )}
          aria-label="Dismiss ad"
          title="Close ad"
        >
          <X size={12} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
