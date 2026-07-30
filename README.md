# Orvio

Orvio is a web-based event management platform that gives organizers and participants one place to create, discover, register for, and manage events.

## Project Overview

Organizing an event often requires separate forms, spreadsheets, and messaging tools. Orvio centralizes the event lifecycle—from event creation and registration to attendance tracking and feedback—so that event information and participant records remain consistent.

## Problem It Solves

The fragmented tools used for event management create extra administrative work, inconsistent data, and limited visibility into event performance. Participants can also struggle to find events and keep track of their registrations. Orvio provides a single, role-based platform for these workflows.

## Target Users

### Participant

Participants discover events, register securely, track upcoming and past registrations, and provide feedback after attending.

### Organizer

Organizers create and manage events, review participant registrations, record attendance, and use basic analytics to understand event performance.

### Administrator

Administrators manage users and events, moderate inappropriate content, and monitor overall platform activity.

## Vision Statement

To provide a reliable, scalable, and user-friendly platform that simplifies event management for organizers while delivering a seamless event-discovery and participation experience for users.

## Key Features and Goals

- Secure authentication and role-based access for participants, organizers, and administrators.
- Event creation, editing, publishing, and management.
- Event browsing, search, filtering, and detailed event pages.
- Participant registration, capacity and deadline validation, and registration-status tracking.
- Attendance tracking, feedback collection, and organizer analytics.
- A responsive interface that works on desktop and mobile browsers.

## Success Metrics

- Organizers can create and publish events successfully.
- Participants can register for eligible events without errors.
- Organizers can manage registrations and attendance efficiently.
- Event, participant, and registration records remain accurate and consistent.
- Users can navigate the application with minimal learning effort.

## Assumptions and Constraints

### Assumptions

- Users have a modern browser and an internet connection.
- Organizers provide accurate event information.
- Participants register using valid accounts.
- PostgreSQL, provided through Supabase, is the primary data store.

### Constraints

- Version 1.0 is a web application only; no native mobile application is included.
- Payments, email/SMS notifications, certificates, QR attendance, and AI recommendations are out of scope for this release.
- Analytics are limited to the basic organizer metrics.

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | Next.js, React, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python |
| Authentication and database | Supabase Auth and PostgreSQL |
| Containerization | Docker |

## Team
Kiran Nambiar (KRNXPRESS07)
Ivan George (ivan-george710)

## Quick Start – Local Development

### Prerequisites

- Node.js 20 or later and npm
- Python 3.11 or later (for backend development)
- Docker Desktop (for the containerized frontend)
- A Supabase project and its environment-variable values

### 1. Configure environment variables

Create `frontend/.env.local` and add the Supabase values supplied by the project owner:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For the Python backend, create `backend/.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Never commit these files. They are excluded by `.gitignore`.

### 2. Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Run the frontend with Docker

From the `frontend` directory, build and run the existing Dockerfile:

```powershell
docker build -t orvio-frontend .
docker run --rm -p 3000:3000 --env-file .env.local orvio-frontend
```

Open [http://localhost:3000](http://localhost:3000). Stop the container with `Ctrl+C`.

### 4. Set up the Python backend dependencies

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Local Development Tools

- **VS Code** for editing, integrated terminals, and Git support.
- **Node.js and npm** for the Next.js frontend.
- **Python and pip** for FastAPI backend dependencies.
- **Docker Desktop** for building and running the frontend container locally.
- **Supabase** for authentication and managed PostgreSQL.
- **Git and GitHub** for source control, issues, and project planning.

## Branching Strategy — GitHub Flow

This repository uses GitHub Flow:

1. `main` is the stable branch and should always contain working code.
2. Create a short-lived feature branch from `main` for each change, using names such as `feature/event-registration` or `docs/update-readme`.
3. Commit focused changes to the feature branch and push it to GitHub.
4. Open a pull request for review and discussion.
5. Merge the approved pull request into `main`, then delete the feature branch.

At least one feature branch should remain visible in the GitHub repository history for the assignment screenshot.

## Project Documentation

- [Vision document](docs/01-Vision.md)
- [Functional requirements](docs/02-Functional-Requirements.md)
- [User stories](docs/06-User-Stories.md)
- [MoSCoW prioritization](docs/07-MoSCoW-Prioritization.md)
- [Architecture diagram](docs/Orvio-Architecture.drawio.png)

