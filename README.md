# Signal Lexicon

A modern English dictionary web app built with Next.js App Router.

## Features

- Search English words with a clean, two-panel interface.
- Query is synced to URL (`?q=word`) for shareable and refresh-safe lookups.
- Client + API input validation (letters, spaces, apostrophes, hyphens).
- Loading, empty, success, and error states with animated transitions.
- Pronunciation section with phonetic text and audio playback when available.
- Meaning blocks grouped by part of speech, including definitions and examples.
- Source links rendered from dictionary upstream data.
- Robust API normalization so the UI receives a consistent typed response shape.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Phosphor Icons
- Upstream dictionary source: `api.dictionaryapi.dev`

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open:

`http://localhost:3000`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production server
- `npm run lint` - Run ESLint

## API

### `GET /api/dictionary?term=<word>`

Looks up an English term through `https://api.dictionaryapi.dev/api/v2/entries/en/<term>`,
then normalizes the payload before returning it.

### Success response (200)

```json
{
  "term": "example",
  "entries": [
    {
      "word": "example",
      "phonetics": [
        {
          "text": "/example/",
          "audio": "https://...",
          "sourceUrl": "https://..."
        }
      ],
      "meanings": [
        {
          "partOfSpeech": "noun",
          "definitions": [
            {
              "definition": "A representative form or pattern.",
              "example": "This is an example sentence.",
              "synonyms": [],
              "antonyms": []
            }
          ],
          "synonyms": [],
          "antonyms": []
        }
      ],
      "sourceUrls": ["https://..."]
    }
  ],
  "fetchedAt": "2026-02-25T00:00:00.000Z"
}
```

### Error responses

- `400 INVALID_TERM`
  - Missing `term` query parameter, or invalid format.
- `404 NOT_FOUND`
  - No definitions were found for the requested term.
- `502 UPSTREAM_ERROR`
  - Upstream dictionary service failed or was unreachable.

## Input Rules

- Terms are sanitized to lowercase with collapsed spaces.
- Valid pattern:
  - Must start with a letter.
  - May contain letters, spaces, apostrophes (`'`), and hyphens (`-`).

Regex used by the app:

`^[a-zA-Z][a-zA-Z\\s'-]*$`

## Project Structure

- `app/page.tsx` - Landing page + initial query extraction
- `app/api/dictionary/route.ts` - Dictionary proxy API and error mapping
- `components/dictionary/*` - Search form, state views, results, motion button
- `lib/dictionary.ts` - Sanitization, validation, and normalization logic
- `types/dictionary.ts` - Shared API/data types
