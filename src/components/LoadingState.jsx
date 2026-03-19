export default function LoadingState() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-10">
      <div className="loading-card glass-panel w-full max-w-md rounded-3xl p-8 shadow-tile">
        <div className="loading-accent-track h-2 w-24 rounded-full">
          <div className="loading-accent-fill accent-soft h-full w-full rounded-full" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-slate-100">
          Loading Site Hub
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Restoring your local categories and website tiles.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="loading-dot" />
          <span className="loading-dot loading-dot-delay-1" />
          <span className="loading-dot loading-dot-delay-2" />
        </div>
      </div>
    </div>
  )
}
