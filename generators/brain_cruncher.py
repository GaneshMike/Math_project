# generators/brain_cruncher.py – Multi-step chain-calculation generator

import random


def generate_brain_cruncher(difficulty):
    """Generate a multi-step chain calculation question.

    Each step records the running total so the frontend can display
    the full solution breakdown (e.g. 'Multiply by 2 = 18').
    Division is included and always produces a whole-number result.
    """
    steps_count = {"low": 3, "medium": 4, "high": 5}.get(difficulty, 3)
    hi          = {"low": 10, "medium": 20, "high": 50}.get(difficulty, 10)

    start   = random.randint(2, hi)   # start ≥ 2 so division always works
    steps   = []
    current = start
    ops     = ["+", "-", "×", "÷"]

    for _ in range(steps_count):
        op = random.choice(ops)

        if op == "×":
            n = random.randint(2, 5)

        elif op == "÷":
            # Pick a divisor that divides current evenly, avoiding trivial ÷1
            divisors = [d for d in range(2, current + 1) if current % d == 0]
            if not divisors:
                # Fall back to addition if no clean divisor exists
                op = "+"
                n  = random.randint(1, hi)
            else:
                n = random.choice(divisors)

        elif op == "-":
            n = random.randint(1, hi)
            if n > current:
                n = current          # keep result non-negative

        else:  # "+"
            n = random.randint(1, hi)

        # Apply operation
        if op == "+":
            current += n
        elif op == "-":
            current -= n
        elif op == "×":
            current *= n
        elif op == "÷":
            current //= n

        steps.append({"op": op, "num": n, "running_total": current})

    return {
        "start":  start,
        "steps":  steps,
        "answer": current,
        "type":   "brain_cruncher",
    }
