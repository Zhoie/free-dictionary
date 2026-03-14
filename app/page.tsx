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
    <main aria-labelledby="dictionary-app-title">
      <div className="page-shell w-full px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 xl:px-8">
        <div className="page-shell-content w-full">
          <DictionaryClient initialQuery={initialQuery} />
        </div>
      </div>
    </main>
  );
}
