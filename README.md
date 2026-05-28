# School Portal — PIT Project (IPT Group)

Full-stack **Student Enrollment & Sectioning System** meeting PIT requirements: React web app, React Native (Expo) mobile app, and Django REST API with authentication, email activation, RBAC, CRUD, chatbot, file upload, and responsive UI.

## Requirements checklist

| Requirement | Implementation |
|-------------|----------------|
| Web ↔ Mobile via API | Shared Django REST API; web uses session cookies, mobile uses JWT |
| CRUD | Students, subjects, sections, enrollments (+ delete) |
| Login / Register |`${import.meta.env.VITE_API_BASE || ''}/accounts/api/login/`,`${import.meta.env.VITE_API_BASE || ''}/accounts/api/register/` |
| Email activation | Activation email +`${import.meta.env.VITE_API_BASE || ''}/accounts/api/activate/?token=` |
| Input validation | DRF serializers + model `clean()` + frontend form validation |
| Chatbot |`${import.meta.env.VITE_API_BASE || ''}/accounts/api/chatbot/` (rule-based assistant) |
| RBAC | Roles: `admin`, `staff`, `user` on `UserProfile` |
| Dashboard & profile | Web dashboard + profile; mobile dashboard + profile |
| File / image upload | Profile picture (local `media/` or optional Cloudinary) |
| Responsive UI | Tailwind (web) + React Native layouts (mobile) |
| Security | Password hashing (Django), JWT + session auth, protected endpoints |

## Project structure

```
IPT_GROUP/
├── accounts/           # Django app (models, API, chatbot, permissions)
├── school_project/     # Django settings & URLs
├── frontend/           # React + Vite + Tailwind
├── mobile/             # React Native (Expo)
├── templates/emails/   # Activation email HTML
├── requirements.txt
└── README.md
```

## Quick start

### 1. Backend

```bash
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py create_default_admin
python manage.py runserver
```

Default admin: **username** `admin` / **password** `admin123`

Activation emails print to the **console** in development. Set `REQUIRE_EMAIL_VERIFICATION=True` in `.env` to require activation before login.

### 2. Web (React)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — API is proxied to http://localhost:8000

### 3. Mobile (Expo)

```bash
cd mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` (see `.env.example`):

- Android emulator: `http://10.0.2.2:8000`
- Physical device: `http://<your-pc-lan-ip>:8000`

Run Django with `python manage.py runserver 0.0.0.0:8000` so the device can reach it.

## API documentation

Base URL: `http://localhost:8000/accounts/api/`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `login/` | Session login (web) |
| POST | `logout/` | Session logout |
| POST | `register/` | Register (`username`, `email`, `password`, `confirm_password`, optional `profile_picture`) |
| GET | `activate/?token=` | Activate account |
| POST | `resend-activation/` | Resend activation email |
| POST | `token/` | JWT login (mobile) — returns `access`, `refresh`, `user` |
| POST | `token/refresh/` | Refresh JWT |
| GET/PATCH | `me/` | Profile (PATCH supports multipart photo) |

### Chatbot

| POST | `chatbot/` | Body: `{ "message": "..." }` → `{ "reply": "..." }` |

### School data (authenticated; write = staff/admin)

| Resource | List/Create | Detail (RUD) |
|----------|-------------|--------------|
| Students | `students/` | `students/<id>/` |
| Subjects | `subjects/` | `subjects/<id>/` |
| Sections | `sections/` | `sections/<id>/` |
| Enrollments | `enrollments/` | DELETE `enrollments/<id>/` |
| Summary | GET `enrollment-summary/` | |

### Admin (role = admin)

| GET | `users/` | List users |
| PATCH | `users/<id>/role/` | Body: `{ "role": "admin"|"staff"|"user" }` |

## Roles

- **admin** — Full access + user role management
- **staff** — CRUD on students, subjects, sections, enrollments
- **user** — View dashboard/summary, manage own profile, use chatbot

## Testing

```bash
python manage.py test accounts
```

```bash
cd frontend && npm run lint
```

## Deployment notes

- Set `DJANGO_DEBUG=False`, strong `DJANGO_SECRET_KEY`, and `ALLOWED_HOSTS`
- Set `REQUIRE_EMAIL_VERIFICATION=True` and configure SMTP
- Build web: `cd frontend && npm run build` — serve `dist/` behind nginx
- Mobile: `eas build` or `expo build` for APK/IPA
- Optional: `USE_CLOUDINARY=True` for production media

## Default credentials

| User | Password | Role |
|------|----------|------|
| admin | admin123 | admin |

Create staff/user accounts via **Register** on web or mobile, then promote roles in **Users** (admin only) at `/users` on web.
