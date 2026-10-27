# Energy Autonomy — Admin Panel

> Protected admin CMS dashboard for managing blogs, assessments, SEO and tracking scripts.

---

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Pages & Routes](#pages--routes)
5. [Key Components](#key-components)
6. [Blog Editor Features](#blog-editor-features)
7. [Authentication Flow](#authentication-flow)
8. [Environment Variables](#environment-variables)
9. [Local Development](#local-development)
10. [Build for Production](#build-for-production)

---

## Overview

The Admin Panel is a protected single-page application used by LifeCraft admins to:
- Create, edit, and publish blog articles using a rich-text editor (TipTap)
- View and export Genie Assessment quiz submissions
- Manage per-page SEO metadata (title, description, OG tags, JSON-LD)
- Inject third-party tracking scripts (GA4, Meta Pixel, etc.)

**All routes are protected by JWT authentication.**  
Default login route: `/login`

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19 |
| Language | JavaScript (JSX) |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Rich Text Editor | TipTap v3 |
| Routing | React Router DOM v7 |
| Icons | Lucide React |

---

## Project Structure

```
energy-autonomy-admin/
├── src/
│   ├── App.jsx                     Root router, auth provider, route definitions
│   ├── main.jsx                    React entry point
│   ├── index.css                   Global styles
│   │
│   ├── pages/                      Full admin page views
│   │   ├── LoginPage.jsx           Admin sign-in form
│   │   ├── DashboardPage.jsx       Stats overview and quick actions
│   │   ├── BlogListPage.jsx        Blog post list (filter, sort, delete)
│   │   ├── BlogFormPage.jsx        Blog form view wrapper
│   │   ├── BlogViewPage.jsx        Preview published post
│   │   ├── AssessmentResultsPage.jsx  View and export quiz submissions
│   │   ├── SeoManagementPage.jsx   SEO tags + tracking scripts management
│   │   └── ScriptsManagementPage.jsx  Tracking scripts (redirects to SEO tab)
│   │
│   ├── components/                 Reusable UI components
│   │   ├── BlogCreatePage.jsx      Main blog editor (cover upload, TipTap, SEO fields)
│   │   ├── MediumEditor.jsx        TipTap rich-text editor wrapper
│   │   ├── AdminLayout.jsx         Sidebar navigation + page shell
│   │   ├── ProtectedRoute.jsx      Redirects unauthenticated users to /login
│   │   ├── JsonExportModal.jsx     JSON data export modal
│   │   ├── KeypointStatementExtension.jsx  Custom TipTap block
│   │   ├── PointsBannerExtension.jsx       Custom TipTap block
│   │   ├── StatementCardsExtension.jsx     Custom TipTap block
│   │   └── common/                 Shared small components (ScrollToTop etc.)
│   │
│   ├── context/
│   │   ├── AuthContext.jsx         JWT auth state — login/logout/token management
│   │   └── BlogContext.jsx         Blog list state shared across pages
│   │
│   ├── services/
│   │   └── api.js                  Centralized API service layer (all backend calls)
│   │
│   ├── assets/                     Images and static assets
│   └── data/                       Static local data files
│
├── .env                            Environment variables
├── package.json
└── vite.config.js
```

---

## Pages & Routes

| Route | Component | Access | Description |
|---|---|---|---|
| `/login` | `LoginPage` | Public | Admin email + password sign-in |
| `/dashboard` | `DashboardPage` | Protected | Stats overview and quick actions |
| `/blog` | `BlogListPage` | Protected | View, filter, sort, delete posts |
| `/blog/create` | `BlogCreatePage` | Protected | Create new blog post |
| `/blog/edit/:id` | `BlogCreatePage` | Protected | Edit existing post |
| `/blog/view/:id` | `BlogViewPage` | Protected | Preview a published post |
| `/assessments` | `AssessmentResultsPage` | Protected | View quiz results + export |
| `/seo` | `SeoManagementPage` | Protected | SEO tags + tracking scripts |
| `/` | — | — | Redirects to `/login` |

---

## Key Components

### `BlogCreatePage.jsx`
The main blog editor. Features:
- Cover image upload (drag-and-drop or file picker)
- TipTap rich-text body editor (`MediumEditor.jsx`)
- Title, description, label/category input fields
- SEO title + SEO description fields
- Draft autosave every few seconds (PATCH to backend)
- Publish button (validates title + content before publishing)
- Status indicator (Saving... / Saved / Error)

### `MediumEditor.jsx`
TipTap editor wrapper with toolbar. Supports:
- Bold, Italic, Headings (H1–H4)
- Bullet lists, Numbered lists
- Inline image upload
- YouTube video embed
- Text color + Text highlight
- Hyperlinks
- Custom blocks (Keypoint Statement, Points Banner, Statement Cards)

### `AdminLayout.jsx`
Sidebar navigation shell shown on all protected pages:
- Links: Dashboard, Blog, Assessments, SEO & Scripts
- Logout button (clears JWT token from localStorage)

### `ProtectedRoute.jsx`
Wraps protected routes. If no valid JWT is in localStorage, redirects to `/login`.

### `AuthContext.jsx`
React context providing:
- `token` — current JWT string
- `login(token)` — saves token to state + localStorage
- `logout()` — clears token, redirects to `/login`

### `BlogContext.jsx`
React context providing shared blog list state across `BlogListPage` and `DashboardPage`.

---

## Blog Editor Features

The TipTap editor includes the following extensions:

### Standard Formatting
- **Bold** / *Italic*
- Headings: H1, H2, H3, H4
- Bullet list, Ordered list
- Text color picker
- Text highlight

### Media & Embeds
- **Inline image upload** — uploads to backend `/api/upload`, inserts image node
- **YouTube embed** — enter YouTube URL, embeds responsive player

### Custom Blocks (LifeCraft Extensions)
| Extension | Purpose |
|---|---|
| `KeypointStatementExtension` | Highlighted keypoint callout block |
| `PointsBannerExtension` | Styled bullet points banner section |
| `StatementCardsExtension` | Card-style statement layout block |

### Autosave
- Drafts are automatically PATCH-saved to the backend every few seconds while editing
- A status indicator shows `Saving...` / `Saved` / `Error` states

---

## Authentication Flow

1. Admin enters email + password on `/login`
2. Frontend POSTs to `POST /api/auth/login`
3. Backend verifies credentials against `src/admin-credentials.json`
4. On success, backend returns a **7-day JWT token**
5. Frontend stores token in `AuthContext` + `localStorage`
6. All protected API calls send `Authorization: Bearer <token>`
7. `ProtectedRoute` checks for valid token on every route access

**Admin credentials (backend):**
- Email: `reachlifecraft@gmail.com`
- Password: set in `Energy-Autonomy-Backend/src/admin-credentials.json` (bcrypt hashed)

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:5000
```

For production:
```env
VITE_API_BASE_URL=https://api.energyautonomy.com
```

---

## Local Development

```bash
# Install dependencies
npm install

# Create .env
echo "VITE_API_BASE_URL=http://localhost:5000" > .env

# Start dev server
npm run dev

# Admin panel: http://localhost:5173
# Login: http://localhost:5173/login
```

> Make sure the backend is running at `http://localhost:5000` first.

---

## Build for Production

```bash
npm run build
# Output: dist/
```

Upload the contents of `dist/` to your Hostinger `public_html` (or subdirectory for the admin panel).
