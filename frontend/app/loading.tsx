export default function Loading() {
  return (
    <main className="premium-page" aria-busy="true" aria-label="Loading page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <p role="status" className="eyebrow">
          Getting things ready
        </p>
        <div className="skeleton mt-6 h-12 w-3/4 max-w-lg" />
        <div className="skeleton mt-4 h-5 w-2/3 max-w-sm" />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border p-6"
              aria-hidden="true"
            >
              <div className="skeleton h-12 w-16" />
              <div className="skeleton mt-8 h-7 w-4/5" />
              <div className="skeleton mt-4 h-4 w-2/3" />
              <div className="skeleton mt-10 h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
