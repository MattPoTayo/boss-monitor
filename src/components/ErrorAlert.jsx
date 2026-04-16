export function ErrorAlert({ error }) {
  if (!error) return null;

  return (
    <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
      {error}
    </div>
  );
}
