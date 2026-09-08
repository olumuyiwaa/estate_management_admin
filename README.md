# Corvanta Estate Admin Portal

Admin dashboard for the **Estate Management API** (`https://emsapi.corvanta.ng`).

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · Axios

---

## Quick start

```bash
cd corvanta-estate-admin
npm install
npm run dev
```

Open http://localhost:3000 and sign in with your Corvanta credentials  
(`userName` + `password` → `POST /api/Authentication/login`).

### Env

```env
NEXT_PUBLIC_API_BASE_URL=https://emsapi.corvanta.ng
NEXT_PUBLIC_APP_NAME=Corvanta Estate Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## Modules

| Module | Capabilities |
|--------|----------------|
| **Auth** | Login, logout, JWT refresh, change password; user hydrated from JWT claims |
| **Dashboard** | Live counts (residents, SR, announcements) |
| **Residents** | Search, paginated list, create |
| **Staff** | Directory |
| **Users & Roles** | CRUD-style user admin, roles, deactivate/reactivate, reset password |
| **Visitors** | Register, check-in / check-out |
| **Vehicle Access** | Register vehicles, access logs, verify plate |
| **Service Requests** | Open/all, create, resolve |
| **Collections** | Outstanding / overdue / paid, record payment |
| **Announcements** | Create, publish, unpublish, delete |
| **Issues** | Report, start, resolve, delete |
| **Marketplace** | Listings, approve/reject, create listing, summary |
| **Profile** | Account card, change password, sign out |

---

## UX polish included

- Mobile sidebar with backdrop + close on navigate
- Responsive header and content margins
- Shared **Pagination** component on major list pages
- Loading spinner on auth gate
- Robust login response parsing (token + JWT claim mapping)

---

## Project layout

```
src/
├── app/
│   ├── (dashboard)/     # Protected pages
│   ├── (full-width-pages)/(auth)/
│   ├── api/             # axios, auth.api, types
│   └── auth/
├── components/
│   ├── auth/SignInForm.tsx
│   └── common/Pagination.tsx
├── context/SidebarContext.tsx
└── layout/              # AppSidebar, AppHeader
```

Swagger: https://emsapi.corvanta.ng/swagger/index.html

---

## License

Private – Corvanta Estate Management.
