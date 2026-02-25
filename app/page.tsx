import DictionaryClient from "@/components/dictionary/dictionary-client";

type HomeProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

const getInitialQuery = (queryValue: string | string[] | undefined) => {
  const firstValue = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  return (firstValue ?? "").trim().toLowerCase();
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const initialQuery = getInitialQuery(params.q);

  return (
    <main className="h-[100dvh] overflow-hidden text-zinc-900">
      <div className="mx-auto grid h-full max-w-[1400px] grid-cols-1 gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)] lg:gap-6">
        <section className="relative hidden h-full min-h-0 overflow-hidden rounded-[2rem] border border-zinc-800/60 bg-zinc-950 p-6 text-zinc-100 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.9)] lg:flex lg:flex-col">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(31,143,98,0.38),transparent_44%),radial-gradient(circle_at_90%_8%,rgba(255,255,255,0.16),transparent_35%)]" />
          <div className="relative flex h-full flex-col gap-6">
            <div className="space-y-4">
              <p className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-200">
                Dictionary API
              </p>
              <h1 className="text-4xl leading-none tracking-tighter text-white xl:text-5xl">
                Fast lookup, screen-first layout.
              </h1>
              <p className="max-w-[40ch] text-sm leading-relaxed text-zinc-300">
                Layout is arranged for viewport fit: no page scrolling, compact
                data cards, and navigable definition pages.
              </p>
            </div>
            <div className="grid gap-3">
              <article className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                  Suggested Terms
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                  cadence, lucid, threshold, harbor
                </p>
              </article>
              <article className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                  URL Pattern
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                  Shareable query path:
                  <span className="block break-all font-mono text-zinc-50">
                    /?q=word
                  </span>
                </p>
              </article>
            </div>
          </div>
        </section>

        <div className="h-full min-h-0 w-full">
          <DictionaryClient initialQuery={initialQuery} />
        </div>
      </div>
    </main>
  );
}
