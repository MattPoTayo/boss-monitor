export function Header({ stats, user, authLoading, loggingIn, loggingOut, onLogin, onLogout, isAdmin, onOpenUserManagement }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur sm:rounded-[28px] sm:p-3 md:p-6">
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">Boss Tracker</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:mt-2 sm:text-3xl md:text-4xl">Field Boss Timer</h1>
          <p className="hidden mt-2 max-w-2xl text-xs text-slate-300 sm:block sm:text-sm md:text-base">
            Track boss respawns with shared realtime updates across devices. Timers start only when you mark a boss as dead.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-1.5 sm:gap-2 md:gap-3 md:min-w-[280px]">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-center sm:rounded-2xl sm:px-3 sm:py-2">
              <p className="text-xs text-slate-400">Total</p>
              <p className="mt-0.5 text-base font-bold sm:mt-1 sm:text-lg">{stats.total}</p>
            </div>
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2 py-1.5 text-center sm:rounded-2xl sm:px-3 sm:py-2">
              <p className="text-xs text-emerald-200/80">Spawned</p>
              <p className="mt-0.5 text-base font-bold text-emerald-300 sm:mt-1 sm:text-lg">{stats.spawned}</p>
            </div>
            <div className="rounded-lg border border-sky-400/20 bg-sky-500/10 px-2 py-1.5 text-center sm:rounded-2xl sm:px-3 sm:py-2">
              <p className="text-xs text-sky-200/80">Active</p>
              <p className="mt-0.5 text-base font-bold text-sky-300 sm:mt-1 sm:text-lg">{stats.active}</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-1.5 sm:rounded-2xl sm:p-2 md:p-3">
            {authLoading ? (
              <div className="text-xs text-slate-300 sm:text-sm">Checking sign-in...</div>
            ) : user ? (
              <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Signed in as</p>
                  <p className="truncate text-xs font-medium text-white sm:text-sm">{user.displayName || user.email}</p>
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  {isAdmin && (
                    <button
                      onClick={onOpenUserManagement}
                      title="User Management"
                      className="rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-2 py-1.5 text-base transition hover:bg-cyan-500/20 active:bg-cyan-500/30 sm:rounded-2xl sm:px-2.5 sm:py-2"
                    >
                      👥
                    </button>
                  )}
                  <button
                    onClick={onLogout}
                    disabled={loggingOut}
                    className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 active:bg-white/20 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm"
                  >
                    {loggingOut ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-slate-300 sm:text-sm">Sign in to manage bosses.</p>
                <button
                  onClick={onLogin}
                  disabled={loggingIn}
                  className="rounded-lg bg-cyan-400 px-2.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 active:bg-cyan-500 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm"
                >
                  {loggingIn ? "Signing in..." : "Sign in with Google"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
