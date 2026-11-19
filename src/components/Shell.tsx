import { NavLinks } from "@/components/NavLinks";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <span className="brand-name">nudge-finance</span>
          </div>
          <NavLinks variant="list" />
        </div>
        <div className="sidebar-foot">
          <div className="badge">
            <span>Simulation Active</span>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
