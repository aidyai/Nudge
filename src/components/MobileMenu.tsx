"use client";

import { useRef } from "react";
import { Icon } from "@/components/icons";
import { NavLinks } from "@/components/NavLinks";

/** On a phone there is no menu bar. One icon opens the four sections in a popup in the middle of the screen. */
export function MobileMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  return (
    <>
      <button type="button" className="menu-button" aria-label="Open menu" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        <Icon name="grid" size={20} />
      </button>
      <dialog ref={dialog} className="menu-dialog" aria-label="Menu" onClick={(event) => event.target === event.currentTarget && close()}>
        <div className="menu-card">
          <div className="menu-card-head">
            <span>Menu</span>
            <button type="button" className="icon-button" aria-label="Close menu" onClick={close}>
              <Icon name="close" />
            </button>
          </div>
          <NavLinks variant="tiles" onNavigate={close} />
        </div>
      </dialog>
    </>
  );
}
