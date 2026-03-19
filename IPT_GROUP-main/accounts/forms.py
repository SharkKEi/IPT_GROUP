from django import forms
from django.contrib.auth.forms import AuthenticationForm

class SchoolLoginForm(AuthenticationForm):
    username = forms.CharField(
        widget=forms.TextInput(
            attrs={
                'class': 'w-full rounded-2xl bg-white/10 py-4 pl-12 pr-4 text-white placeholder:text-white/40 border border-white/10 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/30 outline-none transition',
                'placeholder': 'Username',
                'id': 'id_username',
            }
        )
    )
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                'class': 'w-full rounded-2xl bg-white/10 py-4 pl-12 pr-4 text-white placeholder:text-white/40 border border-white/10 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/30 outline-none transition',
                'placeholder': 'Password',
                'id': 'id_password',
            }
        )
    )

