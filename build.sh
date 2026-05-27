#!/usr/bin/env bash
set -o errexit

echo "Running Django migrations..."
python manage.py migrate

echo "Creating default admin user..."
python manage.py create_default_admin

echo "Build complete!"
