# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Planit is a self-contained project management system built with Laravel 12 and React 19. The application uses Inertia.js v2 for seamless server-client communication, Laravel Fortify for authentication, and Tailwind CSS v4 for styling.

## Development Commands

### Initial Setup
```bash
composer run setup  # Full setup: install deps, copy .env, generate key, migrate, build assets
```

### Development Server
```bash
composer run dev    # Starts server, queue, logs (Pail), and Vite in parallel with colored output
npm run dev         # Frontend only (if you just need Vite hot reload)
php artisan serve   # Backend only (if you just need the server)
```

### SSR Development
```bash
composer run dev:ssr  # Build SSR bundle and run with Inertia SSR server
```

### Testing
```bash
composer run test                              # Run all tests
php artisan test                               # Run all tests (direct)
php artisan test tests/Feature/ExampleTest.php # Run specific test file
php artisan test --filter=testMethodName       # Run specific test by name
```

### Code Quality
```bash
vendor/bin/pint              # Format PHP code (auto-fix)
vendor/bin/pint --dirty      # Format only changed files
npm run lint                 # Lint and fix JavaScript/TypeScript
npm run format               # Format frontend code with Prettier
npm run format:check         # Check formatting without changes
npm run types                # TypeScript type checking
```

### Asset Building
```bash
npm run build       # Production build (client-side only)
npm run build:ssr   # Production build with SSR support
```

### Database
```bash
php artisan migrate              # Run migrations
php artisan migrate:fresh        # Drop all tables and re-run migrations
php artisan migrate:fresh --seed # Fresh migration + seed data
```

## Architecture & Key Patterns

### Laravel 12 Streamlined Structure

This project uses Laravel 12's simplified application structure:

- **No `app/Console/Kernel.php`** - Console configuration is in `bootstrap/app.php` or `routes/console.php`
- **No `app/Http/Kernel.php`** - Middleware registration happens in `bootstrap/app.php`
- **Middleware registration** - Add to `bootstrap/app.php` using the fluent API
- **Service Providers** - Register in `bootstrap/providers.php`
- **Route files** - Additional route files must be registered in `bootstrap/app.php` using `withRouting()`

### Inertia.js Data Flow

**Shared Data Pattern** (`app/Http/Middleware/HandleInertiaRequests.php`):
- All pages automatically receive: `name`, `quote`, `auth.user`, `sidebarOpen`
- Shared data is defined in the `share()` method
- Access in React via the `usePage()` hook: `const { auth, name } = usePage().props`

**Page Components** (`resources/js/pages/`):
- Use lowercase file names with kebab-case for pages rendered via `Inertia::render()`
- Example: `Inertia::render('dashboard')` → `resources/js/pages/dashboard.tsx`
- Nested pages: `Inertia::render('settings/profile')` → `resources/js/pages/settings/profile.tsx`

### Laravel Wayfinder Integration

Wayfinder auto-generates TypeScript route helpers from Laravel routes and controllers:

**Auto-generated paths**:
- `resources/js/actions/` - Controller method imports
- `resources/js/routes/` - Named route imports

**Usage in React**:
```typescript
// Controller methods (tree-shakable named imports)
import { update } from '@/actions/App/Http/Controllers/Settings/ProfileController'
update(data) // { url: "/settings/profile", method: "patch" }

// With Inertia Form component
<Form {...update.form()}>...</Form>

// Named routes
import { edit } from '@/routes/profile'
edit() // { url: "/settings/profile", method: "get" }
```

**Regeneration**: The Vite plugin auto-generates on route changes. Manual: `php artisan wayfinder:generate`

### Authentication Architecture

**Laravel Fortify** handles all auth routes automatically:
- Login: `/login`
- Register: `/register`
- Password reset: `/forgot-password`, `/reset-password`
- Email verification: `/email/verify`
- Two-factor challenge: `/two-factor-challenge`

**Auth Flow**:
1. Fortify routes are registered automatically (no need to define in `routes/web.php`)
2. Fortify config in `config/fortify.php` determines enabled features
3. Views are replaced with Inertia pages via Fortify's view customization
4. Custom logic goes in `app/Actions/` (not controllers)

**Two-Factor Authentication**:
- User model uses `TwoFactorAuthenticatable` trait
- Columns: `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed_at`
- Setup UI in `resources/js/pages/settings/two-factor.tsx`

### Frontend Component Organization

**UI Components** (`resources/js/components/ui/`):
- Radix UI-based primitives (button, dialog, input, etc.)
- Use `class-variance-authority` for variant management
- Styled with Tailwind CSS v4

**Feature Components** (`resources/js/components/`):
- App shell: `app-shell.tsx`, `app-sidebar.tsx`, `app-header.tsx`
- Reusable features: `appearance-dropdown.tsx`, `two-factor-setup-modal.tsx`
- Follow existing patterns for similar components

**Layouts** (`resources/js/layouts/`):
- `app-layout.tsx` - Main authenticated layout with sidebar/header
- `auth-layout.tsx` - Public authentication pages layout
- Settings has its own nested layout: `settings/layout.tsx`

**Hooks** (`resources/js/hooks/`):
- `use-appearance.tsx` - Theme management (dark/light mode)
- `use-two-factor-auth.ts` - Two-factor authentication state
- `use-mobile.tsx` - Responsive breakpoint detection

### Validation & Form Requests

**Always use Form Request classes** for validation:

```bash
php artisan make:request Settings/ProfileUpdateRequest --no-interaction
```

**Pattern** (see `app/Http/Requests/Settings/ProfileUpdateRequest.php`):
- Validation rules in `rules()` method
- Authorization in `authorize()` method (return `true` if using middleware)
- Custom messages in `messages()` method
- Use in controller: `public function update(ProfileUpdateRequest $request)`

### Database Conventions

**Model Casts**: Use the `casts()` method (not `$casts` property):
```php
protected function casts(): array
{
    return [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];
}
```

**Relationships**: Always include return type hints:
```php
public function posts(): HasMany
{
    return $this->hasMany(Post::class);
}
```

**Migrations**: When modifying columns, re-declare ALL attributes or they'll be dropped:
```php
// Wrong - will drop nullable and default
$table->string('name')->change();

// Correct - preserves all attributes
$table->string('name')->nullable()->default('Guest')->change();
```

### Middleware Registration

Custom middleware is registered in `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware): void {
    // Exclude cookies from encryption
    $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

    // Add to web group
    $middleware->web(append: [
        HandleAppearance::class,
        HandleInertiaRequests::class,
    ]);
})
```

### Route Organization

**Web routes** (`routes/web.php`):
- Public routes (welcome page)
- Authenticated routes in `middleware(['auth', 'verified'])` group
- Includes `routes/settings.php` at the end

**Settings routes** (`routes/settings.php`):
- Nested under `/settings` prefix
- All require authentication
- Password update is rate-limited (6 attempts per minute)

## Critical Environment Setup

**Database**: SQLite by default (`database/database.sqlite`)
- Created automatically during setup
- Change in `.env` if using MySQL/PostgreSQL

**Required Environment Variables**:
- `APP_KEY` - Auto-generated by `php artisan key:generate`
- `APP_URL` - Used by Wayfinder and asset generation
- `VITE_APP_URL` - Must match `APP_URL` for Vite dev server

## Vite Configuration

**Plugins** (`vite.config.ts`):
1. `laravel` - Laravel integration, SSR support, hot reload
2. `react` - React Fast Refresh + React Compiler (experimental)
3. `tailwindcss` - Tailwind CSS v4 integration
4. `wayfinder` - Auto-generates TypeScript route helpers with form variant support

**Entry Points**:
- Client: `resources/css/app.css`, `resources/js/app.tsx`
- SSR: `resources/js/ssr.tsx`

## Testing Conventions

**Feature Tests** (default):
```bash
php artisan make:test Settings/ProfileTest --phpunit --no-interaction
```

**Unit Tests**:
```bash
php artisan make:test Services/CalculatorTest --unit --phpunit --no-interaction
```

**Test Structure**:
- Use factories for model creation: `User::factory()->create()`
- Check for custom factory states before manual setup
- Test happy path, failure cases, and edge cases
- Run affected tests after changes: `php artisan test --filter=ProfileTest`

## MCP Server Integration

This project uses **Laravel Boost MCP server** with specialized tools:

- `tinker` - Execute PHP code directly (debugging, querying models)
- `database-query` - Read-only database queries
- `search-docs` - Version-specific Laravel ecosystem documentation
- `list-artisan-commands` - Available Artisan commands with parameters
- `get-absolute-url` - Generate correct URLs with scheme/domain/port
- `browser-logs` - Read browser console logs and exceptions

**When to use**: Reference `.cursor/rules/laravel-boost.mdc` for comprehensive Laravel Boost guidelines.
