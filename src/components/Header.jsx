export function Header({ stats, user, authLoading, loggingIn, loggingOut, onLogin, onLogout }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur sm:p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">Shared Boss Tracker</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">Field Boss Timer</h1>
          <p className="mt-2 max-w-2xl text-xs text-slate-300 sm:text-sm md:text-base">
            Track boss respawns with shared realtime updates across devices. Timers start only when you mark a boss as dead.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:gap-3 md:min-w-[280px]">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-2 py-2 text-center sm:px-4 sm:py-3">
              <p className="text-xs text-slate-400">Total</p>
              <p className="mt-1 text-lg font-bold sm:text-xl">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-2 py-2 text-center sm:px-4 sm:py-3">
              <p className="text-xs text-emerald-200/80">Spawned</p>
              <p className="mt-1 text-lg font-bold text-emerald-300 sm:text-xl">{stats.spawned}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-2 py-2 text-center sm:px-4 sm:py-3">
              <p className="text-xs text-sky-200/80">Active</p>
              <p className="mt-1 text-lg font-bold text-sky-300 sm:text-xl">{stats.active}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-2 sm:p-3">
            {authLoading ? (
              <div className="text-xs text-slate-300 sm:text-sm">Checking sign-in status...</div>
            ) : user ? (
              <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Signed in as</p>
                  <p className="truncate text-xs font-medium text-white sm:text-sm">{user.displayName || user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  disabled={loggingOut}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 active:bg-white/20 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {loggingOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-300 sm:text-sm">Sign in to add, edit, reset, and delete bosses.</p>
                <button
                  onClick={onLogin}
                  disabled={loggingIn}
                  className="rounded-2xl bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 active:bg-cyan-500 sm:px-4 sm:py-2 sm:text-sm"
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
