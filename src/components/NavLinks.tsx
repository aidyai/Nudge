"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { NAV, isActive } from "@/lib/nav";

/** The four sections. "list" is the sidebar on desktop; "tiles" is the popup on a phone. */
export function NavLinks({ variant, onNavigate }: { variant: "list" | "tiles"; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={variant === "list" ? "nav-list" : "nav-tiles"}>
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={active ? "nav-item active" : "nav-item"} onClick={onNavigate}>
            <Icon name={item.icon} size={variant === "tiles" ? 28 : 18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
