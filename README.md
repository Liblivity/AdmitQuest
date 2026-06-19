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

- Short interest summary
- Academic interest / possible major
- Likely interest areas
- Strengths
- Weaknesses or gaps
- Top keywords
- Evidence snippets
- Extracted text preview

## AI Summary API

The browser first tries `POST /api/summarize`. On GitHub Pages this route is unavailable, so the app falls back to a local analyzer. To enable AI summaries publicly, deploy the repository to Vercel and add:

```text
OPENAI_API_KEY=your_key_here
```

Optional:

```text
OPENAI_MODEL=gpt-4o-mini
```
