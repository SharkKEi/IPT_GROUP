# Production Deployment Guide

## Pre-Deployment Checklist

### Security ✅

- [ ] Set `DJANGO_DEBUG=False` in production
- [ ] Change `DJANGO_SECRET_KEY` to a strong random value
- [ ] Use environment variables for all secrets (never commit them)
- [ ] Enable `REQUIRE_EMAIL_VERIFICATION=True` to enforce account activation
- [ ] Configure SSL/TLS (HTTPS)
- [ ] Update `ALLOWED_HOSTS` with production domain
- [ ] Update `CORS_ALLOWED_ORIGINS` with production frontend URL
- [ ] Update `CSRF_TRUSTED_ORIGINS` with production domains
- [ ] Use a proper email service (Gmail, SendGrid, etc.) not console backend

### Database

- [ ] Switch from SQLite to PostgreSQL: `pip install psycopg2-binary`
- [ ] Set `DATABASE_URL` environment variable
- [ ] Run migrations: `python manage.py migrate`
- [ ] Create admin user: `python manage.py create_default_admin`

### Static & Media Files

- [ ] Configure `STATIC_ROOT` and run `python manage.py collectstatic`
- [ ] Use cloud storage for media (Cloudinary or AWS S3)
- [ ] Enable `USE_CLOUDINARY=True` and set credentials if using Cloudinary

### Rate Limiting

- [ ] Configure Redis cache for rate limiting (optional but recommended)
- [ ] Current limits: Login 5/min, Register 3/hour, Resend activation 5/hour

### Logging

- [ ] Configure log file rotation to prevent disk space issues
- [ ] Set appropriate log level in production (INFO, not DEBUG)
- [ ] Monitor logs for suspicious activity (failed logins, errors)

### Performance

- [ ] Enable database connection pooling
- [ ] Set up caching (Redis) for sessions and queries
- [ ] Use Gunicorn or uWSGI as application server
- [ ] Use Nginx as reverse proxy with compression

### Monitoring

- [ ] Set up error tracking (Sentry, Rollbar, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure email alerts for critical errors
- [ ] Regular backups of database and media files

## Environment Variables

```bash
# Core
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<generate-strong-random-key>
FRONTEND_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
REQUIRE_EMAIL_VERIFICATION=True

# File Storage
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Allowed Hosts & CORS
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

## Docker Deployment (Optional)

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput
CMD ["gunicorn", "school_project.wsgi", "--bind", "0.0.0.0:8000"]
```

## Commands

```bash
# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Production server with Gunicorn
gunicorn school_project.wsgi --bind 0.0.0.0:8000 --workers 4

# Test settings
python manage.py check --deploy
```

## Improvements Made (v2)

- ✅ Email error handling with logging
- ✅ Activation token expiration (24h default)
- ✅ Rate limiting on auth endpoints
- ✅ File size validation (5MB max for profile pictures)
- ✅ Pagination support (50 items per page)
- ✅ Logging configured for debugging
- ✅ Response consistency (all errors use 'detail' field)
- ✅ Query optimization with select_related/prefetch_related
- ✅ API endpoints constants file
- ✅ DRY CORS/CSRF settings
- ✅ Production packages added (psycopg2, drf-spectacular, django-ratelimit)
- ✅ Comprehensive .env.example template

## Next Steps

1. **Database Migration**: Update to PostgreSQL in production
2. **Email Service**: Configure real email backend (Gmail, SendGrid, etc.)
3. **Caching**: Set up Redis for session/query caching
4. **Monitoring**: Integrate error tracking (Sentry)
5. **CDN**: Configure static file serving via CDN
6. **Backups**: Automate database and media backups
