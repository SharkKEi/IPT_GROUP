from django import forms
from django.contrib.auth.forms import AuthenticationForm

<<<<<<< HEAD
class SchoolLoginForm(AuthenticationForm):
    username = forms.CharField(
        widget=forms.TextInput(
            attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                'placeholder': 'Email or Username'
            }
        )
    )
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                'placeholder': 'Password'
            }
        )
    )
    remember = forms.BooleanField(
        required=False,
        widget=forms.CheckboxInput(
            attrs={
                'class': 'mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500',
            }
        ),
    )

=======

class SchoolLoginForm(AuthenticationForm):
    """Simple Django login form with no custom Tailwind styling."""

    username = forms.CharField(label="Username")
    password = forms.CharField(label="Password", widget=forms.PasswordInput)
    remember = forms.BooleanField(label="Remember me", required=False)
>>>>>>> 56b74d6 (Updated project code)
