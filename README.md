# AdmitQuest

AdmitQuest is an early prototype for a college admissions RPG. Students enter a quick applicant profile, receive RPG-style stats, get a sarcastic Admissions Goblin verdict, and see a quest roadmap with practical next steps.

## Open Locally

Open `index.html` in a browser.

## AI Evaluation

The static site falls back to local heuristic scoring. To enable AI scoring, deploy this repo to Vercel and add an `OPENAI_API_KEY` environment variable. The browser calls `/api/evaluate`; the serverless function keeps the API key off the client.

## Prototype Features

- Applicant profile form
- RPG stat scoring
- Optional AI evaluation endpoint
- Admissions Goblin verdict
- Quest roadmap recommendations
- Responsive single-page layout

## Next Product Steps

- Add a shareable result card
- Save user builds locally
- Add more major-specific quest banks
- Publish the site with GitHub Pages or Vercel
