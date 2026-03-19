from django.contrib.auth import login
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginSerializer

@method_decorator(csrf_exempt, name='dispatch')
class LoginAPIView(APIView):
    """API endpoint for logging users in.

    This endpoint is intentionally CSRF-exempt to support frontend clients
    (e.g., Vite/React) that do not yet have a CSRF token available.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return Response({'message': 'Login successful', 'user': user.username}, status=status.HTTP_200_OK)
