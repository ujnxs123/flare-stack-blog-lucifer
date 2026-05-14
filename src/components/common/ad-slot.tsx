/**
 * AdSlot — Google AdSense placeholder component.
 *
 * Currently disabled: AdSense approval pending.
 * Once approved, uncomment the implementation below and configure slotId/publisherId.
 */

interface AdSlotProps {
  /** Unique ID for this ad placement (used for localStorage dismiss tracking) */
  placementId: string;
  /** AdSense ad unit slot ID (e.g. "1234567890") */
  slotId?: string;
  /** Publisher ID (e.g. "pub-3327078370447638") */
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

export function AdSlot(_props: AdSlotProps) {
  // AdSense not yet approved — hide all ad slots until approval is granted.
  // TODO: Re-enable once AdSense publisher ID is available.
  return null;
}
