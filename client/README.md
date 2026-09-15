# CampusConnect Client

This repository contains the client-side application for the CampusConnect FYP project. It is built with React, TypeScript, Vite, and Material UI, and is designed to work with a separate backend server repository.

## Overview

CampusConnect is a campus-focused student collaboration platform with:

- Authentication and onboarding flows
- Role-based access for students, contributors, and admins
- Resource sharing with search, filtering, upload, and moderation
- Real-time chat powered by Socket.IO
- AI assistant integration
- Community and contributor discovery pages
- Admin analytics and moderation tools

This client repo manages the frontend experience only. The backend/server implementation lives in a separate repository.

## Key Technologies

- React 19
- TypeScript
- Vite
- Material UI (MUI)
- React Router v7
- @tanstack/react-query
- Axios
- Socket.IO client
- Zustand
- Recharts
- React Hook Form

## Project Structure

`src/` is organized around feature modules and shared infrastructure.

- `src/main.tsx` — application entry point
- `src/app/App.tsx` — root component
- `src/app/router.tsx` — router definitions and route protection
- `src/app/providers/` — application providers
  - `AuthProvider` — authentication state and token handling
  - `QueryProvider` — React Query provider
  - `ThemeProvider` — MUI theme wrapper
  - `ChatSocketProvider` — Socket.IO connection wrapper
- `src/features/` — feature-specific modules
  - `admin/` — admin dashboard, user/resource moderation, analytics
  - `ai-chat/` — AI chat assistant page
  - `auth/` — landing page, login/register, onboarding workflow
  - `chat/` — conversations, conversation detail, real-time chat UI
  - `community/` — community feed / discussion page
  - `contributors/` — contributor discovery pages
  - `dashboard/` — user dashboard and homepage
  - `resources/` — shared resource library and upload tools
  - `user/` — user profile and public profile pages
- `src/shared/` — shared utilities, API, constants, hooks, components, and types
  - `api/` — Axios instance, query client, API error handling
  - `components/` — reusable UI layout and feedback primitives
  - `constants/` — route constants and shared values
  - `hooks/` — reusable hooks like auth, debounce, theme mode
  - `types/` — shared application types and enums
  - `utils/` — helpers for formatting, storage, and error handling
- `src/theme/` — design system theme configuration and palette

## Application Flow

### Routing and Access Control

The app uses a centralized router in `src/app/router.tsx`.

- Public routes for unauthenticated access, such as `AUTH`
- Onboarding route for new users
- Protected routes behind authentication
- Role-based route guard for admin access
- Lazy-loaded feature bundles for performance
- A catch-all redirect to the home dashboard

Route constants are centralized in `src/shared/constants/routes.ts` to avoid hardcoded paths.

### Providers

`src/app/providers/AppProviders.tsx` composes the main app providers in the correct order:

1. `QueryProvider` — data caching and fetching layer
2. `ThemeProvider` — theme and styling
3. `AuthProvider` — auth state, token storage, and redirects
4. `ChatSocketProvider` — real-time chat socket context

### API Layer

`src/shared/api/axios.instance.ts` configures Axios with:

- `baseURL` from `VITE_API_BASE_URL`
- JSON request headers
- Authorization header injection from `localStorage`
- Automatic silent refresh for expired tokens

The app assumes a backend server available under the configured API base URL.

## Feature Highlights

### Auth and Onboarding

- Landing/auth page with marketing sections and call-to-action
- Auth form handling and validation
- Multi-step onboarding flow for profile setup
- User metadata capture such as department, semester, interests, and expertise

### Resources Module

- Browse shared documents and learning resources
- Search, filter, and sort resource listings
- Contributor/admin upload, edit, and delete resources
- Approval workflow for moderators
- Infinite scroll and skeleton loading states

### Chat and AI

- Real-time conversations with Socket.IO
- Responsive chat layout for desktop and mobile
- AI chat page for assistant interaction
- Conversations list with dynamic route handling for direct chat access

### Community and Contributors

- Community page for campus discussion or group content
- Contributor discovery and public profiles for networking
- Profile page with user details and public-facing information

### Admin Experience

- Admin dashboard and analytics
- Moderation tools for users and resources
- Role-gated access to admin sections only

## Setup and Usage

### Prerequisites

- Node.js 20+ recommended
- npm or a compatible package manager
- Backend server running separately

### Local Install

```bash
cd CampusConnect-Client
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Environment Variables

This client uses Vite environment variables. At minimum, configure:

- `VITE_API_BASE_URL` — backend base URL, such as `http://localhost:4000`

During development, the application uses the Vite proxy and `/api` endpoint prefix to avoid CORS issues.

## Notes

- The frontend is designed to work with a separate backend repo; this repository contains only the client.
- Routes are implemented with React Router v7 and lazy loading for page-level chunks.
- Shared state is managed via React Query and lightweight local state hooks.
- UI uses Material UI for responsive layout and design consistency.

## Useful Files

- `src/main.tsx` — React entry point
- `src/app/App.tsx` — root app wrapper
- `src/app/router.tsx` — route definitions and guards
- `src/app/providers/AppProviders.tsx` — composed providers
- `src/shared/api/axios.instance.ts` — API client and token handling
- `src/shared/constants/routes.ts` — route path constants
- `src/features/` — feature module implementations

---
