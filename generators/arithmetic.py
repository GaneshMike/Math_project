# generators/arithmetic.py – Addition, Subtraction, Multiplication, Division & Mixed generators

import random
import math
from config import DIFF_RANGES


def generate_addition_subtraction(difficulty):
    """Generate an addition or subtraction question based on difficulty."""
    lo, hi = DIFF_RANGES.get(difficulty, (1, 20))
    op = random.choice(["+", "-"])
    a = random.randint(lo, hi)
    b = random.randint(lo, hi)
    if op == "-" and b > a:
        a, b = b, a          # keep answer positive
    answer = a + b if op == "+" else a - b
    return {"question": f"{a} {op} {b}", "answer": answer, "type": "add_sub"}


def generate_multiply_divide(difficulty):
    """Generate a multiplication or division question.

    Operands are capped at sqrt(hi)*3 so answers stay manageable.
    """
    lo, hi = DIFF_RANGES.get(difficulty, (1, 20))
    mul_hi = max(10, int(math.sqrt(hi)) * 3)  # easy→12, med→21, hard→30, vhard→65
    op = random.choice(["×", "÷"])
    if op == "×":
        a = random.randint(max(lo, 2), mul_hi)
        b = random.randint(max(lo, 2), mul_hi)
        answer = a * b
    else:
        b = random.randint(max(lo, 2), mul_hi)
        answer = random.randint(max(lo, 1), mul_hi)
        a = b * answer           # guarantee whole-number division
    return {"question": f"{a} {op} {b}", "answer": answer, "type": "mul_div"}


def generate_mixed(difficulty):
    """Random mix of all four arithmetic operations."""
    fn = random.choice([generate_addition_subtraction, generate_multiply_divide])
    return fn(difficulty)


def generate_mental_math(difficulty):
    """Mental-math question – same as add/subtract, spoken aloud by browser TTS."""
    return generate_addition_subtraction(difficulty)
