"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { NAV, isActive } from "@/lib/nav";

/** The four sections rendered as clean, high-contrast nav items */
export function NavLinks({ variant: _variant, onNavigate }: { variant?: "list" | "tiles"; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="nav-list">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={active ? "nav-item active" : "nav-item"}
            onClick={onNavigate}
          >
            <Icon name={item.icon} size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
