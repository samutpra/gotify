# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application that connects to a Gotify server to send push notifications. The app provides a web interface for sending messages with customizable titles, content, and priority levels.

## Development Commands

- Install dependencies: `npm install`
- Development server: `npm run dev`
- Build: `npm run build`
- Start production: `npm run start`
- Lint: `npm run lint`

## Architecture

- **Framework**: Next.js 15 with TypeScript, Tailwind CSS
- **Structure**: App Router architecture with `src/` directory
- **Key directories**:
  - `src/app/`: Next.js app router pages and layouts
  - `src/components/`: React components
  - `src/lib/`: Utility functions and API clients

## Gotify Configuration

The application connects to a Gotify server using:
- Server URL: Configured via `NEXT_PUBLIC_GOTIFY_URL`
- Application token: Configured via `NEXT_PUBLIC_GOTIFY_TOKEN`
- Authentication: Uses application token for API requests

## Key Files

- `src/lib/gotify.ts`: Gotify API client with functions for sending messages
- `src/components/MessageForm.tsx`: Main form component for message composition
- `.env.local`: Environment variables (not committed to git)

## API Features

- Send messages with title, content, and priority
- Get application information
- Retrieve message history