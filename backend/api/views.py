from django.db.models import Count
from rest_framework import viewsets, permissions, status, generics, views
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import DoctorProfile, PatientProfile, Appointment
from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    DoctorProfileSerializer, 
    PatientProfileSerializer, 
    AppointmentSerializer
)

User = get_user_model()

# Custom JWT Claims
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        token['username'] = user.username
        token['full_name'] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['id'] = self.user.id
        data['role'] = self.user.role
        data['email'] = self.user.email
        data['username'] = self.user.username
        data['full_name'] = self.user.get_full_name() or self.user.username
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# User Registration
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

# User profile endpoints (Self edit)
class UserProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

# Doctor viewset
class DoctorViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(role='doctor')
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()] # admin only can edit doctor records directly, doctor can edit their own profile via profiles view.

    def update(self, request, *args, **kwargs):
        # Allow doctors to edit their own profile details
        user = self.get_object()
        if request.user.role == 'doctor' and request.user.id != user.id:
            return Response({"detail": "You do not have permission to edit this profile."}, status=status.HTTP_403_FORBIDDEN)
        
        # Standard update
        response = super().update(request, *args, **kwargs)
        
        # Also update profile specific data if provided
        doctor_profile_data = request.data.get('doctor_profile')
        if doctor_profile_data and hasattr(user, 'doctor_profile'):
            profile = user.doctor_profile
            serializer = DoctorProfileSerializer(profile, data=doctor_profile_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                # Reload user response
                response.data = UserSerializer(user).data
        return response

# Patient viewset
class PatientViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(role='patient')
    serializer_class = UserSerializer

    def get_permissions(self):
        # Doctors, Admins can view patients. Patients can view their own details.
        return [permissions.IsAuthenticated()]

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        if request.user.role == 'patient' and request.user.id != user.id:
            return Response({"detail": "You do not have permission to edit this profile."}, status=status.HTTP_403_FORBIDDEN)
        
        response = super().update(request, *args, **kwargs)
        
        patient_profile_data = request.data.get('patient_profile')
        if patient_profile_data and hasattr(user, 'patient_profile'):
            profile = user.patient_profile
            serializer = PatientProfileSerializer(profile, data=patient_profile_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                response.data = UserSerializer(user).data
        return response

# Appointment viewset
class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return Appointment.objects.filter(patient=user)
        elif user.role == 'doctor':
            return Appointment.objects.filter(doctor=user)
        elif user.role == 'admin':
            return Appointment.objects.all()
        return Appointment.objects.none()

    def perform_create(self, serializer):
        # Automatically set patient to current user if role is patient
        if self.request.user.role == 'patient':
            serializer.save(patient=self.request.user, status='PENDING')
        else:
            serializer.save()

    def update(self, request, *args, **kwargs):
        # Role-based restriction on fields
        instance = self.get_object()
        user = request.user
        
        if user.role == 'patient':
            # Patient can cancel their pending appointment
            if 'status' in request.data:
                new_status = request.data['status']
                if new_status == 'CANCELLED':
                    instance.status = 'CANCELLED'
                    instance.save()
                    return Response(self.get_serializer(instance).data)
                else:
                    return Response({"detail": "Patients can only cancel appointments."}, status=status.HTTP_400_BAD_REQUEST)
            # Otherwise edit details
            return super().update(request, *args, **kwargs)
            
        elif user.role == 'doctor':
            # Doctor can update status (CONFIRMED, REJECTED, COMPLETED) and write status_notes
            allowed_fields = {'status', 'status_notes'}
            data = {k: v for k, v in request.data.items() if k in allowed_fields}
            
            serializer = self.get_serializer(instance, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif user.role == 'admin':
            # Admin can update everything
            return super().update(request, *args, **kwargs)
            
        return Response({"detail": "Action not allowed."}, status=status.HTTP_403_FORBIDDEN)

# Admin Statistics View
class AdminStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({"detail": "Only admins can access system statistics."}, status=status.HTTP_403_FORBIDDEN)

        total_patients = User.objects.filter(role='patient').count()
        total_doctors = User.objects.filter(role='doctor').count()
        total_appointments = Appointment.objects.count()

        status_counts = Appointment.objects.values('status').annotate(count=Count('status'))
        status_map = {item['status']: item['count'] for item in status_counts}

        # Add zero-counts for missing status
        for stat in ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']:
            status_map.setdefault(stat, 0)

        # Recent appointments
        recent_appointments = Appointment.objects.all().order_by('-created_at')[:5]
        recent_serializer = AppointmentSerializer(recent_appointments, many=True)

        return Response({
            'total_patients': total_patients,
            'total_doctors': total_doctors,
            'total_appointments': total_appointments,
            'status_stats': status_map,
            'recent_appointments': recent_serializer.data
        })
