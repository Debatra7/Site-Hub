export default function LoadingState() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900/85 p-8 shadow-tile">
        <div className="accent-soft h-2 w-20 rounded" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-slate-100">
          Loading Site Hub
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Restoring your local categories and website tiles.
        </p>
      </div>
    </div>
  )
}
