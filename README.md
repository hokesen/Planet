# Planit

Space-themed project management system with 3D visualization, recurring tasks, and capacity planning.

<img width="1647" height="899" alt="image" src="https://github.com/user-attachments/assets/b383a629-946a-45db-a411-c2b42bf439bf" />


## What It Does

**Core Concept:**
- **Galaxies** = Top-level themes/project folders (e.g., "Work", "Personal", "Learning")
- **Planets** = Projects or goals within a galaxy (visualized as 3D spheres with orbital positioning)
- **Missions** = Individual tasks within a planet (with priorities, deadlines, time estimates)
- **Mission Refuels** = Recurring task completion tracking (refueling a rocket = checking off a daily/weekly/monthly task)
- **Milestones** = Significant achievements within a planet project

**Key Features:**
- 3D galaxy visualization with orbital mechanics for planets
- Recurring task system with fuel depletion (daily/weekly/monthly commitments)
- Capacity planning (track time commitments against daily/weekly/monthly limits)
- Gamification (XP points, levels, achievements, streaks)
- Deadline suggestions based on mission metrics
- Mission routing through planet paths for navigation

## Tech Stack

**Backend:**
- Laravel 12
- SQLite (configurable for MySQL/PostgreSQL)
- Laravel Fortify (authentication, 2FA)
- Inertia.js v2

**Frontend:**
- React 19 + TypeScript
- Tailwind CSS v4
- Radix UI
- Laravel Wayfinder (type-safe routing)
- Vite

## Requirements

- PHP 8.2+
- Node.js 18+
- Composer 2.x
- SQLite (or MySQL/PostgreSQL)

## Installation

```bash
git clone <repository-url>
cd Planet
composer run setup
```

The setup command installs dependencies, creates `.env`, generates app key, creates database, runs migrations, and builds assets.

## Development

```bash
composer run dev  # Starts server, queue, logs, and Vite
```

Available at http://localhost:8000

**Alternative commands:**
- `npm run dev` - Frontend only
- `php artisan serve` - Backend only
- `composer run dev:ssr` - SSR mode

## Project Structure

```
app/
├── Actions/          # Fortify authentication actions
├── Http/
│   ├── Controllers/  # Route controllers
│   ├── Middleware/   # Custom middleware (HandleInertiaRequests, etc.)
│   └── Requests/     # Form validation requests
└── Models/           # Eloquent models

resources/
├── js/
│   ├── actions/      # Auto-generated controller methods (Wayfinder)
│   ├── components/   # React components
│   │   └── ui/       # Radix UI primitives
│   ├── hooks/        # Custom React hooks
│   ├── layouts/      # Page layouts
│   ├── pages/        # Inertia page components
│   └── routes/       # Auto-generated named routes (Wayfinder)
└── css/
    └── app.css       # Tailwind entry point

routes/
├── web.php           # Main web routes
└── settings.php      # Settings-related routes

bootstrap/
└── app.php           # Application configuration (middleware, providers, routes)
```

## Commands

**Code Quality:**
```bash
vendor/bin/pint              # Format PHP
vendor/bin/pint --dirty      # Format changed files only
npm run lint                 # Lint JS/TS
npm run format               # Format frontend
npm run types                # TypeScript check
```

**Testing:**
```bash
composer run test                              # All tests
php artisan test --filter=ProfileTest          # Specific test
php artisan test tests/Feature/ExampleTest.php # Test file
```

**Database:**
```bash
php artisan migrate              # Run migrations
php artisan migrate:fresh        # Fresh start
php artisan migrate:fresh --seed # With seed data
```

**Production:**
```bash
npm run build       # Client build
npm run build:ssr   # SSR build
```

## Data Model

**User** (1) → **Galaxies** (N)
- `name`, `color`, `icon`, `sort_order`

**Galaxy** (1) → **Planets** (N)
- `name`, `description`, `status`, `health_status`, `size`, `color`
- `position_x`, `position_y`, `position_z`, `orbit_radius`
- `target_completion_date`, `completed_at`

**Planet** (1) → **Missions** (N)
- `title`, `description`, `status`, `priority`, `deadline`
- `time_commitment_minutes`, `commitment_type` (one_time, daily, weekly, monthly)
- `is_recurring`, `recurrence_pattern`, `next_occurrence_date`
- `xp_value`, `counts_toward_capacity`, `planet_route`

**Mission** (1) → **MissionRefuels** (N)
- `refueled_at`
- Tracks when recurring missions are completed

**Planet** (1) → **Milestones** (N)
- `name`, `description`, `target_date`, `achieved_at`, `xp_reward`

**User Stats:**
- `total_xp`, `level`, `current_streak`, `longest_streak`
- `total_missions_completed`, `total_planets_launched`, `total_galaxies_created`

**User Capacity:**
- `daily_capacity_minutes`, `weekly_capacity_minutes`, `monthly_capacity_minutes`
- `show_capacity_warnings`, `capacity_display_mode`

## Mission Statuses

- `todo` - Not started
- `in_progress` - Currently working
- `blocked` - Waiting on something
- `completed` - Done
- `cancelled` - Abandoned

## Planet Statuses

- `planning` - Not started
- `active` - In progress
- `on_hold` - Paused
- `completed` - Finished
- `abandoned` - Cancelled

## Planet Health

- `thriving` - On track
- `stable` - Normal
- `critical` - Needs attention
- `life_support` - At risk

## Type-Safe Routing

Wayfinder generates TypeScript helpers from Laravel routes:

```typescript
import { update } from '@/actions/App/Http/Controllers/Settings/ProfileController'
<Form {...update.form()}>...</Form>
```

## Environment

Required in `.env`:
- `APP_URL` - Application URL
- `VITE_APP_URL` - Must match APP_URL
- `DB_CONNECTION` - Database driver (default: sqlite)
