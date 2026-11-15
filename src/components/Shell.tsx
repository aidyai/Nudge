import { NavLinks } from "@/components/NavLinks";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            n
          </span>
          <span className="brand-name">nudge</span>
        </div>
        <NavLinks variant="list" />
        <div className="sidebar-foot">
          <p>Simulation mode, fake lender</p>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
