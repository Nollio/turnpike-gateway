import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border p-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-white font-bold text-xs">
            AI
          </div>
          <span className="font-semibold">AI Gateway</span>
        </div>
        <NavItem href="/dashboard" label="Overview" />
        <NavItem href="/dashboard/keys" label="API Keys" />
        <NavItem href="/dashboard/billing" label="Billing" />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-card transition-colors"
    >
      {label}
    </Link>
  );
}
