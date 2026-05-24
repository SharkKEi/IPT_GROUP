from django import forms
from django.contrib.auth.forms import AuthenticationForm


class SchoolLoginForm(AuthenticationForm):
    """Simple Django login form with no custom Tailwind styling."""

    username = forms.CharField(label="Username")
    password = forms.CharField(label="Password", widget=forms.PasswordInput)
    remember = forms.BooleanField(label="Remember me", required=False)
