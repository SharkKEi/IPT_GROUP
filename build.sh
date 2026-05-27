#!/usr/bin/env bash
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running Django migrations..."
python manage.py migrate || true

echo "Creating default admin user..."
python manage.py create_default_admin || true

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Build complete!"
