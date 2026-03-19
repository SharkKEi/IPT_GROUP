from django.contrib.auth.views import LoginView
from .forms import SchoolLoginForm

class SchoolLoginView(LoginView):
    template_name = 'registration/login.html'
    form_class = SchoolLoginForm
    redirect_authenticated_user = True
