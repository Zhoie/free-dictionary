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
    <main className="min-h-[100dvh] overflow-x-hidden overflow-y-auto">
      <div className="mx-auto min-h-[100dvh] max-w-[1460px] px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        <div className="w-full min-h-[calc(100dvh-1.5rem)]">
          <DictionaryClient initialQuery={initialQuery} />
        </div>
      </div>
    </main>
  );
}
