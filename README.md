# AdmitQuest Reader

AdmitQuest is currently a simple student-interest reader. It accepts pasted text or uploaded files, extracts readable text, and summarizes what the student seems interested in.

## Open Locally

Open `index.html` in a browser.

## Supported Inputs

- Pasted text
- `.txt`, `.md`, and `.rtf`
- `.pdf` through PDF.js
- `.docx` through Mammoth.js

Old `.doc` files are not supported yet. Export them as `.docx` or paste the text.

## Current Output

- Academic interest / possible major
- Likely interest areas
- Nearby research lab and university leads by city/area
- Ranked professor outreach leads when deployed with a search API
- Tailored cold email drafts when deployed with OpenAI

## Research Lab Finder

The lab finder uses public map data from OpenStreetMap/Nominatim and Overpass to locate nearby universities, laboratories, research institutes, and science organizations. Public map data can be incomplete, so the app also generates targeted search links based on the student's detected interests and selected location.

## Server APIs

GitHub Pages can run the static reader and map-based research leads, but it cannot safely run API keys. To enable AI summaries, professor search, compatibility ranking, and cold email drafts, deploy the repository to Vercel and add:

```text
OPENAI_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
```

Optional search fallback:

```text
SERPAPI_KEY=your_key_here
```

Optional model override:

```text
OPENAI_MODEL=gpt-4o-mini
```

## Public Front End + Private Backend

The professor email list and cold email drafts require a hosted backend. The easiest setup is to use the Vercel deployment URL as the public app URL.

If you keep GitHub Pages as the public front end, deploy the same repo on Vercel for the API routes, then set `app-config.js`:

```js
window.ADMITQUEST_API_BASE = "https://your-vercel-project.vercel.app";
```

Do not put API keys in `app-config.js` or any browser file. Keep them in Vercel environment variables.
