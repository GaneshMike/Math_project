# config.py – Application configuration and shared constants

SECRET_KEY = "math_workout_secret_2024"

# Unified difficulty ranges used by every question generator
DIFF_RANGES = {
    "easy":      (1, 20),
    "medium":    (1, 50),
    "hard":      (1, 100),
    "very_hard": (1, 500),
}
