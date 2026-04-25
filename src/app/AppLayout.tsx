import { Link, Outlet, useLocation } from 'react-router-dom';

export function AppLayout() {
  const { pathname } = useLocation();
  const isRoot = pathname === '/' || pathname === '/tours';
  const isTourEditor = /^\/tours\/[^/]+\/?$/.test(pathname);
  const isFieldMode = /^\/tours\/[^/]+\/field\/?$/.test(pathname);

  // Field mode and the tour editor both render their own full-bleed chrome
  // (Studio on desktop, FieldMode on mobile). Skip the app shell entirely so
  // they fill the viewport.
  if (isFieldMode || isTourEditor) {
    return (
      <div className="stq-app-shell">
        <Outlet />
      </div>
    );
  }

  const wideShell = isRoot;

  return (
    <div className="stq-app-shell">
      <div
        className={`mx-auto flex min-h-screen flex-col ${
          wideShell ? 'max-w-7xl' : 'max-w-5xl'
        }`}
      >
        <header className="stq-app-bar sticky top-0 z-20 border-b border-border px-4 py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <Link
              to="/tours"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white shadow-sm"
              aria-label="SouthTyrolQuests home"
            >
              <img src="/favicon.svg" alt="" className="h-8 w-8" />
            </Link>

            <div className="min-w-0 text-center">
              <p className="truncate text-labelSm uppercase tracking-[0.2em] text-primary/75">
                SouthTyrolQuests
              </p>
              <Link to="/tours" className="block truncate text-h5 text-text">
                Author
              </Link>
            </div>

            {isRoot ? (
              <div className="rounded-full border border-border bg-white px-3 py-2 text-labelSm text-primary shadow-sm">
                Mobile-first
              </div>
            ) : (
              <Link to="/tours" className="btn-ghost text-labelLg">
                ← Tours
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-5 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
