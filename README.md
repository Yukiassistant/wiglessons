# Wig Lessons

A simple static tracker for the 90-day cosplay wig styling course.

## Features

- 90 short lessons with per-lesson progress
- Lesson detail view with objective, concept, glossary, references, practice, safety, reflection, and readiness
- Searchable glossary
- Browser-local progress and notes
- Selectable Atelier and Classic interfaces, with the choice saved in the browser
- JSON export/import backup

## Local Preview

```bash
npm run serve
```

Then open <http://127.0.0.1:4177>.

## Deploy

Cloudflare Pages can serve this repo as static files with no build command.

- Project name: `wiglessons`
- Production branch: `main`
- Build command: none
- Output directory: `.`
