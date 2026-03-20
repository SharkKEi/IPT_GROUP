from django.contrib.auth.views import LoginView
from .forms import SchoolLoginForm

class SchoolLoginView(LoginView):
    template_name = 'registration/login.html'
    form_class = SchoolLoginForm
    redirect_authenticated_user = True

    def form_valid(self, form):
        # If the user did not select "Remember me", expire session at browser close.
        remember = form.cleaned_data.get('remember')
        if not remember:
            self.request.session.set_expiry(0)
        return super().form_valid(form)
