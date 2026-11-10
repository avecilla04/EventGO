# EventGO

EventGO is a personal web application designed to help users discover events, activities and leisure options in an intuitive and accessible way.

The project aims to improve the way users discover leisure opportunities by using event information and promotional content to provide relevant recommendations.

## Main Features

- Discovery of events and leisure activities, with quick filters (today, tomorrow, this weekend), categories and search by city or "near me"
- Event and venue information: date, schedule, location, directions and sharing
- Venue profiles that users can follow
- Merchant dashboard to register venues, publish events with cover images and track views
- User-friendly, responsive interface

## Technologies

- JavaScript, React 18 and Vite 7
- Tailwind CSS
- PocketBase (database, authentication, file storage and API)
- VS Code

## Getting Started

Requirements: Node.js 20.19 or later and [PocketBase 0.34.2](https://pocketbase.io/docs/) for Windows
(place `pocketbase.exe` inside `backend/`).

```bash
# Terminal 1 - backend (http://127.0.0.1:8090, admin panel at /_/)
npm run backend

# Terminal 2 - frontend (http://localhost:5173)
npm install
npm run dev
```

On first start PocketBase applies the migrations in `backend/pb_migrations/` and creates an empty database.
Copy `.env.example` to `.env` if the backend runs on a different URL.

## Project Structure

```
backend/
  pb_migrations/   database schema and access rules
  pb_hooks/        server-side logic (event view counter)
public/            static files
src/
  pages/           one page per route
  components/      navbar, event cards, merchant dashboard, UI components
  contexts/        authentication state
  lib/             PocketBase client and helpers
```

## Security

Access rules are enforced server-side by PocketBase: guests only see event titles and images,
users can only modify their own data, and merchants can only publish events in venues they own.
Database files, executables and environment variables are excluded from the repository.

## Project Status

**Work in progress**

EventGO is currently under development and is not publicly deployed.

## About the Project

EventGO was created as a personal project to apply and expand my knowledge in web development while building a real-world application from the initial idea to its implementation.

## Developer

**Antonio Avecilla Rodríguez**

Computer Engineering student specializing in Information Systems at Pablo de Olavide University.

[LinkedIn](https://www.linkedin.com/in/antonio-avecilla-rodriguez)
