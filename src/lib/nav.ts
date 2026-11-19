export type IconName = "phone" | "list" | "activity" | "mic";

export const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Calls", icon: "phone" },
  { href: "/follow-ups", label: "Follow-ups", icon: "list" },
  { href: "/health", label: "Health", icon: "activity" },
  { href: "/demo", label: "New call", icon: "mic" },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" || pathname.startsWith("/calls") : pathname.startsWith(href);
}
