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
    <main className="min-h-dvh overflow-x-clip text-zinc-900">
      <div className="mx-auto grid min-h-dvh max-w-350 grid-cols-1 gap-4 px-4 py-4 sm:gap-6 sm:py-6 md:px-6 md:py-8 lg:grid-cols-[0.84fr_1.16fr] lg:gap-10 lg:px-10 lg:py-12">
        <section className="relative overflow-hidden rounded-4xl border border-zinc-800/60 bg-zinc-950 px-5 py-6 text-zinc-100 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.9)] sm:rounded-[2.5rem] sm:px-6 sm:py-8 md:px-8 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(31,143,98,0.44),transparent_44%),radial-gradient(circle_at_90%_8%,rgba(255,255,255,0.14),transparent_33%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <p className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-200">
                Dictionary API
              </p>
              <h1 className="max-w-[14ch] text-3xl leading-none tracking-tighter text-white sm:text-4xl lg:text-5xl xl:text-6xl">
                Language lookup with clean signal.
              </h1>
              <p className="max-w-[56ch] text-base leading-relaxed text-zinc-300">
                Search English words and get phonetics, pronunciation links,
                meaning blocks, and examples with a URL you can share.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
              <article className="rounded-3xl border border-white/15 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                  Quick Pattern
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                  Type one English word and it searches automatically. The URL
                  updates to
                  <span className="font-mono text-zinc-50"> ?q=word</span>.
                </p>
              </article>
              <article className="rounded-3xl border border-white/15 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                  Suggested Terms
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                  cadence, lucid, threshold, harbor
                </p>
              </article>
            </div>
          </div>
        </section>

        <div className="w-full">
          <DictionaryClient initialQuery={initialQuery} />
        </div>
      </div>
    </main>
  );
}
