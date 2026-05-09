export default function Loading() {
  return (
    <div className="flex flex-1 flex-col bg-black">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-80 max-w-full rounded bg-white/10 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-gray-950/70 ring-1 ring-white/10 p-4 space-y-3"
            >
              <div className="h-4 w-28 rounded bg-white/10 animate-pulse" />
              <div className="h-8 w-20 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-40 rounded bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl bg-gray-950/70 ring-1 ring-white/10 p-5 space-y-3">
            <div className="h-4 w-40 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-white/10 animate-pulse" />
          </div>
          <div className="rounded-xl bg-gray-950/70 ring-1 ring-white/10 p-5 space-y-3">
            <div className="h-4 w-36 rounded bg-white/10 animate-pulse" />
            <div className="h-10 w-full rounded bg-white/10 animate-pulse" />
            <div className="h-10 w-full rounded bg-white/10 animate-pulse" />
            <div className="h-10 w-full rounded bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

