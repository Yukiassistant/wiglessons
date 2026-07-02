# Wig Lessons

A simple static tracker for the 30-day cosplay wig styling curriculum.

## Features

- 30 lesson checklist with per-lesson progress
- Lesson detail view with objective, concept, glossary, resources, practice, safety, reflection, and readiness
- Searchable glossary
- Browser-local progress and notes
- JSON export/import backup

## Local Preview

```bash
python3 -m http.server 4177
```

Then open <http://127.0.0.1:4177>.

## Deploy

Cloudflare Pages can serve this repo as static files with no build command.

- Project name: `wiglessons`
- Production branch: `main`
- Build command: none
- Output directory: `.`
