# Mobile App Fix

This mobile app was updated to match the web app UI style and to fix buttons that keep loading.

## What changed

- Uses the same dark/glass School Portal visual style as the web app.
- Uses the deployed backend by default.
- Supports a manual local Django backend override with `EXPO_PUBLIC_API_URL`.
- Adds a 12-second API timeout so buttons stop loading and show an error if Django is unreachable.
- Adds mobile screens for Students, Subjects, Sections, Enrollments, Enrollment Summary, Profile, Chatbot, and Admin User Roles.

## Run backend

From the Django project folder:

```bash
venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
```

## Run mobile

From the `mobile` folder:

```bash
npm install
npx expo start --lan -c
```

Scan the QR code with Expo Go. Your phone and PC must be on the same Wi-Fi.

## Manual local API override

To test against Django running on your PC, start Expo like this, replacing the IP with your PC Wi-Fi IPv4 address:

```bash
set EXPO_PUBLIC_API_URL=http://192.168.1.3:8000
npx expo start --lan -c
```
