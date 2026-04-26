# generators/__init__.py – expose all generators from a single import
from .arithmetic import (
    generate_addition_subtraction,
    generate_multiply_divide,
    generate_mixed,
    generate_mental_math,
)
from .times_table import generate_times_table
from .brain_cruncher import generate_brain_cruncher

__all__ = [
    "generate_addition_subtraction",
    "generate_multiply_divide",
    "generate_mixed",
    "generate_mental_math",
    "generate_times_table",
    "generate_brain_cruncher",
]
