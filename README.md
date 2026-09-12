# Corvanta Estate Admin Portal

Admin dashboard for the **Estate Management API** (`https://emsapi.corvanta.ng`).

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · Axios

---

## Quick start

```bash
git clone https://github.com/olumuyiwaa/estate_management_admin.git
cd estate_management_admin
cp .env.example .env.local   # optional
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
| **Dashboard** | Live counts (residents, staff, SR, announcements, marketplace) + quick actions |
| **Residents** | Search, paginated list, create **with optional portal user account**, view, edit |
| **Staff** | Search, create (with/without account), edit, soft-delete, department lookup |
| **Users & Roles** | Create user, **create role**, **assign roles**, deactivate/reactivate, reset password |
| **Visitors** | Register, check-in / check-out |
| **Vehicle Access** | Register vehicles, access logs, verify plate |
| **Service Requests** | Open/all, create, **assign**, resolve, **close**, **reopen** |
| **Collections** | Outstanding / overdue / paid, record payment |
| **Collection Types** | Full CRUD for billing configurations (amount, frequency, penalties) |
| **Announcements** | Create, publish, unpublish, delete |
| **Issues** | Report, start, resolve, delete |
| **Marketplace** | Listings, approve/reject, create listing, summary |
| **Profile** | Account card, change password, sign out |

---

## UX polish

- Shared components: `PageHeader`, `DataTable`, `StatusBadge`, `EmptyState`, `ConfirmDialog`, `StatCard`, `Modal` (Esc + backdrop close), `Pagination`
- Mobile sidebar with backdrop + close on navigate
- Responsive header and content margins
- Loading spinner on auth gate
- Robust login response parsing (token + JWT claim mapping)
- Central API paths in `src/app/api/endpoints.ts` (includes known API typos: `CheckVistorIn`, `GetByCritera`, concatenated `{id}` staff routes)

---

## Project layout

```
src/
├── app/
│   ├── (dashboard)/     # Protected pages (incl. collections-config)
│   ├── (full-width-pages)/(auth)/
│   ├── api/             # axios, auth.api, types, endpoints
│   └── auth/
├── components/
│   ├── auth/SignInForm.tsx
│   └── common/          # Shared UI kit
├── context/SidebarContext.tsx
└── layout/              # AppSidebar, AppHeader
```

Swagger: https://emsapi.corvanta.ng/swagger/index.html

---

## License

Private – Corvanta Estate Management.
