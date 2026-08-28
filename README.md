# GameCenter Admin Panel

A full-stack admin panel for managing multiple browser-based educational games ("projects") and their questions from one central dashboard. Each project defines its own field schema, so the same UI can manage a vocabulary game, a math game, a GK game, etc., without code changes per game.

## Tech Stack

**Frontend** (`/Frontend`)
- React (Vite)
- Tailwind CSS
- Framer Motion (animations)
- React Router v6
- Axios
- react-hot-toast
- Lucide React

**Backend** (`/Backend`)
- Node.js + Express
- MySQL + Prisma ORM
- JWT auth (jsonwebtoken + bcryptjs)
- Multer (file uploads)
- csv-parse + mammoth (CSV/DOCX parsing)
- express-validator

## Prerequisites

- Node.js 18+
- MySQL database (local, Railway, PlanetScale, or any MySQL-compatible host)

## Getting Started

### 1. MySQL Database Setup

You need a MySQL database. Choose one option:

**Option A — Free Cloud MySQL (Recommended for beginners)**
1. Sign up at [Railway.app](https://railway.app), [PlanetScale](https://planetscale.com), or [Aiven](https://aiven.io) (free tier)
2. Create a MySQL database
3. Copy the connection URL

**Option B — Local MySQL**
1. Install [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
2. Create a database: `CREATE DATABASE admin_panel;`
3. Your connection URL: `mysql://root:yourpassword@localhost:3306/admin_panel`

### 2. Backend

```bash
cd Backend
npm install
```

Create a `.env` file (or copy from `.env.example`):

```env
PORT=5000
DATABASE_URL=mysql://root:yourpassword@localhost:3306/admin_panel
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
```

Push the database schema (creates all tables):

```bash
npx prisma db push
```

Start the dev server:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### First-Run Setup

When you open the app for the first time (and no admin accounts exist in the database), the login page will automatically show a **"Create your first admin account"** form. Fill in a name, email, and password to create the initial `super_admin` account directly from the browser — no seed script or manual database setup required.

> **Optional**: You can also seed a default super admin via the command line:
>
> ```bash
> npm run seed
> ```
>
> This creates:
> - Email: `admin@gamecenter.com`
> - Password: `admin123`

### 3. Frontend

```bash
cd Frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend on port 5000.

## Prisma Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema changes to MySQL (creates/updates tables) |
| `npm run db:studio` | Open Prisma Studio (visual database browser) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |

## Features

- **Login** — JWT-based authentication
- **Overview** — dashboard summary (total projects, questions, admins)
- **Projects** — CRUD for games with configurable field labels (field1/2/3), main question field, and questions-per-quiz
- **Project Questions** — dynamic table/form labels pulled from the project's `fieldLabels`; search, add, edit, delete, and bulk CSV/DOCX upload
- **Admins** — super-admin-only management of admin accounts
- **Settings** — profile update, change password, theme toggle

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login, returns JWT + admin |
| GET | `/api/auth/me` | Current admin (protected) |
| GET/POST | `/api/admins` | List / create admins (super_admin) |
| PUT/DELETE | `/api/admins/:id` | Update / delete admin (super_admin) |
| GET/POST | `/api/projects` | List (search/paginate) / create projects |
| GET/PUT/DELETE | `/api/projects/:id` | Get / update / delete project |
| GET/POST | `/api/projects/:id/questions` | List / add questions |
| PUT/DELETE | `/api/questions/:id` | Update / delete question |
| POST | `/api/projects/:id/questions/upload` | Bulk CSV/DOCX upload |
| GET | `/api/public/projects/:slug/session` | Public game session (randomized questions) |

## Project Structure

```
/Backend
  /prisma
    schema.prisma         # Database schema (all tables)
  /src
    /controllers
    /middleware
    /routes
    /utils
    app.js                # Express configuration & MySQL connection
    db.js                 # Prisma client singleton
    seed.js               # Default super admin seeder
    server.js             # HTTP entry point
  .env.example
  package.json

/Frontend
  /src
    /api
    /components
    /context
    /pages
    App.jsx
    main.jsx
    index.css
  package.json
  vite.config.js
  tailwind.config.js
```

## Notes

- The question schema is generic (`field1`/`field2`/`field3`) — labels are configurable per project.
- Changing `questionsPerQuiz` does not delete existing questions; it only controls how many are randomly served via the `/session` endpoint.
- All admin routes except `/api/auth/login` require a valid JWT.
- Database uses MySQL with Prisma ORM. All tables are auto-created via `npx prisma db push`.