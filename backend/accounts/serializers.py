import re
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "first_name", "last_name", "email", "country", "role",
            "password", "confirm_password",
        ]

    def validate_password(self, value):
        errors = []
        if len(value) < 8 or len(value) > 16:
            errors.append("Le mot de passe doit contenir entre 8 et 16 caractères.")
        if not re.search(r"[A-Z]", value):
            errors.append("Le mot de passe doit contenir au moins une majuscule.")
        if not re.search(r"[a-z]", value):
            errors.append("Le mot de passe doit contenir au moins une minuscule.")
        if not re.search(r"\d", value):
            errors.append("Le mot de passe doit contenir au moins un chiffre.")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~`]", value):
            errors.append("Le mot de passe doit contenir au moins un caractère spécial.")
        if errors:
            raise serializers.ValidationError(errors)
        return value

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Les mots de passe ne correspondent pas."})
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        user = User.objects.create_user(
            email=validated_data.pop("email"),
            password=validated_data.pop("password"),
            **validated_data,
        )
        return user
