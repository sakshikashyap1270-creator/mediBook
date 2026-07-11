from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DoctorProfile, PatientProfile, Appointment

User = get_user_model()

class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ['id', 'specialization', 'consultation_fee', 'bio', 'experience_years', 'availability_hours']

class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ['id', 'blood_group', 'medical_history']

class UserSerializer(serializers.ModelSerializer):
    doctor_profile = DoctorProfileSerializer(read_only=True)
    patient_profile = PatientProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 
                  'phone_number', 'date_of_birth', 'address', 'doctor_profile', 'patient_profile']
        read_only_fields = ['role']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    # Profile fields that can be passed during registration
    specialization = serializers.CharField(required=False, write_only=True)
    consultation_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, write_only=True)
    experience_years = serializers.IntegerField(required=False, write_only=True)
    blood_group = serializers.CharField(required=False, write_only=True)
    medical_history = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name', 'role', 
                  'phone_number', 'date_of_birth', 'address', 'specialization', 
                  'consultation_fee', 'experience_years', 'blood_group', 'medical_history']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }

    def validate_role(self, value):
        if value not in ['patient', 'doctor', 'admin']:
            raise serializers.ValidationError("Invalid role choice.")
        return value

    def create(self, validated_data):
        # Extract profile fields
        specialization = validated_data.pop('specialization', 'General Physician')
        consultation_fee = validated_data.pop('consultation_fee', 500.00)
        experience_years = validated_data.pop('experience_years', 0)
        blood_group = validated_data.pop('blood_group', None)
        medical_history = validated_data.pop('medical_history', None)
        
        password = validated_data.pop('password')
        role = validated_data.get('role', 'patient')

        # Create user
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        # The post_save signals automatically create default profiles,
        # we update them here if custom values are provided.
        if role == 'doctor':
            profile = user.doctor_profile
            profile.specialization = specialization
            profile.consultation_fee = consultation_fee
            profile.experience_years = experience_years
            profile.save()
        elif role == 'patient':
            profile = user.patient_profile
            profile.blood_group = blood_group
            profile.medical_history = medical_history
            profile.save()

        return user

class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = UserSerializer(source='patient', read_only=True)
    doctor_details = UserSerializer(source='doctor', read_only=True)
    
    # Write fields
    patient = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role='patient'), required=False)
    doctor = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role='doctor'))

    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'doctor', 'patient_details', 'doctor_details', 
                  'appointment_date', 'appointment_time', 'status', 'notes', 'status_notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        request = self.context.get('request')
        if 'patient' not in data:
            if not request or request.user.role != 'patient':
                raise serializers.ValidationError({"patient": "This field is required."})
        return data
