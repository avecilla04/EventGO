# EventGO

EventGO is a personal web application designed to help users discover events, activities and leisure options in an intuitive and accessible way.

The project aims to improve the way users discover leisure opportunities by using event information and promotional content to provide relevant recommendations.

## Main Features

- Discovery of events and leisure activities, with quick filters (today, tomorrow, this weekend), categories and location search: any city or "near me" sorted by distance
- "From your venues" feed with upcoming plans from the venues you follow
- Event and venue information: date, schedule, location, directions and sharing
- Venue profiles that users can follow, also by scanning a printable QR poster placed in the venue
- Merchant dashboard to register venues, publish events with cover images and track views and followers
- User-friendly, responsive interface

## Technologies

- JavaScript, React 18 and Vite 7
- Tailwind CSS
- Supabase (PostgreSQL database, authentication and file storage)
- Vercel (hosting)
- VS Code

## Getting Started

Requirements: Node.js 20.19 or later and a free [Supabase](https://supabase.com) project.

1. In the Supabase dashboard, open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).
   It creates the tables, access rules, image storage, the view counter and follower stats.
   (Existing projects only need the numbered updates they are missing: [`002_venue_stats.sql`](supabase/002_venue_stats.sql), [`003_venue_location.sql`](supabase/003_venue_location.sql).)
2. In **Authentication > Sign In / Providers > Email**, disable **Confirm email** (optional, recommended for demos).
   In **Authentication > URL Configuration**, set the Site URL and add `<your-domain>/restablecer` to the redirect URLs (password reset).
3. Copy `.env.example` to `.env` and fill in the project URL and anon key (**Project Settings > API**).
4. Run the app:

```bash
npm install
npm run dev   # http://localhost:5173
```

## Project Structure

```
supabase/
  schema.sql       database schema, row level security and storage rules
public/            static files
src/
  pages/           one page per route
  components/      navbar, event cards, merchant dashboard, UI components
  contexts/        authentication state
  lib/             Supabase client, image upload and helpers
```

## Security

Access is enforced in the database with column privileges, Row Level Security and CHECK constraints:
guests only see event titles, dates and images; users can only modify their own data; merchants can only
publish events in venues they own, and the view counter can only change through a dedicated function.
Environment variables are excluded from the repository.

## Project Status

**Work in progress**

EventGO is currently under development and is not publicly deployed.

## About the Project

EventGO was created as a personal project to apply and expand my knowledge in web development while building a real-world application from the initial idea to its implementation.

## Developer

**Antonio Avecilla Rodríguez**

Computer Engineering student specializing in Information Systems at Pablo de Olavide University.

[LinkedIn](https://www.linkedin.com/in/antonio-avecilla-rodriguez)
