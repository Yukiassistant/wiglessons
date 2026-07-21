# Wig Lessons

A simple static tracker for a theory-first 90-day cosplay wig styling course. The curriculum uses references, diagrams, and hypothetical planning; it does not require owning or buying a wig, tools, or materials.

## Features

- 90 short lessons with per-lesson progress
- Lesson detail view with objective, concept, glossary, references, learning prompt, reflection, readiness, and lesson-specific safety guidance only when a concrete hazard applies
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
