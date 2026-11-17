"use client";

import { useRef } from "react";
import { Icon } from "@/components/icons";
import { NavLinks } from "@/components/NavLinks";

/** Linear Mobile Drawer */
export function MobileMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        className="menu-button"
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <Icon name="grid" size={16} />
      </button>

      <dialog
        ref={dialog}
        className="menu-dialog"
        aria-label="Navigation Menu"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="menu-drawer">
          <div className="menu-drawer-head">
            <div className="row" style={{ gap: "8px" }}>
              <span className="brand-mark" aria-hidden="true">
                n
              </span>
              <span className="brand-name">nudge</span>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close menu"
              onClick={close}
            >
              <Icon name="close" size={14} />
            </button>
          </div>

          <NavLinks variant="list" onNavigate={close} />

          <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
            <span className="small muted">Simulation Active</span>
          </div>
        </div>
      </dialog>
    </>
  );
}
