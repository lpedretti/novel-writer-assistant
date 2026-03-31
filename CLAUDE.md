# CLAUDE.md

## Project Overview

Novel Writer Assistant is a focused book writing and editing application with integrated AI knowledge tools. Writers can create and edit books with rich text, and use the Knowledge Assistant for research and story analysis.

**Tech Stack**: Next.js 16 + React 19 + Prisma (MySQL) + TailwindCSS 4 + DaisyUI

Derived from Reverie Capsule, stripped of media (images/audio), reader, and public browsing features.

## Key Differences from Reverie Capsule

- No media support (images, audio, media anchors, media library)
- No book reader (no public reading experience)
- No landing page — login is the entry point
- No public book browsing
- Editor is text-only (no media anchor insertion)

## Development Server Policy

**IMPORTANT**: Do NOT start, stop, or manage the development server unless explicitly requested by the user.

## Quick Start

```bash
npm install
cp .env.example .env  # Edit with MySQL credentials and LLM provider
npx prisma migrate dev
npm run dev  # Starts Next.js + Docker (llama/qdrant) + Worker
```

## LLM Provider Configuration

```env
LLM_PROVIDER="local"    # or "openai" or "gemini"
LLM_API_KEY=""           # Required for openai/gemini
```

## Background Worker

The story context worker runs as a standalone process alongside Next.js. It monitors book sections for changes and processes them through the LLM for narrative element extraction.

- Starts automatically with `npm run dev`
- Run standalone: `npm run dev:worker`
- Visible as `[worker]` in terminal output
