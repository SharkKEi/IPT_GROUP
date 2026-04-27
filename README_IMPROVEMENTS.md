# Improved School Portal Setup

This version includes improvements for the React + Django registration, email activation, and profile picture flow.

## What was improved

- React activation link now opens the frontend route: `http://localhost:5173/activate?token=...`
- Login accepts either username or email.
- React restores the logged-in session after refresh using `/accounts/api/me/`.
- Profile picture upload has frontend and backend validation.
- Local development works without Cloudinary credentials because uploaded images fall back to `/media/`.
- `requirements.txt` was fixed to normal UTF-8 text and updated to Django 5.2 LTS + DRF 3.17.1.
- `MEDIA_ROOT` was added to fix media URL serving during development.
- Cleaner API error messages in React forms.
- Email settings can use console mode or Gmail SMTP using environment variables.

## Backend setup

```bash
cd IPT_GROUP-main
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
py manage.py migrate
py manage.py create_default_admin
py manage.py runserver
```

Default local admin:

```text
username: admin
password: admin123
```

## Frontend setup

Open a second terminal:

```bash
cd IPT_GROUP-main/frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Gmail SMTP setup

Create a `.env` file or set these environment variables before running Django:

```env
FRONTEND_URL=http://localhost:5173
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-google-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

When these are provided, Django automatically uses Gmail SMTP. Without them, activation emails are printed in the Django terminal.

## Cloudinary setup

For Cloudinary profile-picture storage, set:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Without these, profile pictures are saved locally in the `media/` folder during development.
