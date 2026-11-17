import { MobileMenu } from "@/components/MobileMenu";

export function PageHeader({
  title,
  accent,
  subtitle,
  action,
}: {
  title: string;
  accent: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>
          {title} <span className="header-accent">{accent}</span>
        </h1>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
      <div className="page-header-actions">
        {action}
        <MobileMenu />
      </div>
    </header>
  );
}
