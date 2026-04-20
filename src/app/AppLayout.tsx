import { Link, Outlet, useLocation } from 'react-router-dom';

export function AppLayout() {
  const { pathname } = useLocation();
  const isRoot = pathname === '/' || pathname === '/tours';

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <Link to="/tours" className="text-h5 font-ui text-primary">
            STQ Author
          </Link>
          {!isRoot && (
            <Link to="/tours" className="btn-ghost text-labelLg">
              ← Tours
            </Link>
          )}
        </div>
      </header>
      <main className="flex-1 px-4 py-5">
        <Outlet />
      </main>
    </div>
  );
}
