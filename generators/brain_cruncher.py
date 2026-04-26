# generators/brain_cruncher.py – Multi-step chain-calculation generator

import random


def generate_brain_cruncher(difficulty):
    """Generate a multi-step chain calculation question.

    The player sees each operation one at a time and must track the
    running total mentally.
    """
    steps_count = {"low": 3, "medium": 4, "high": 5}.get(difficulty, 3)
    hi          = {"low": 10, "medium": 20, "high": 50}.get(difficulty, 10)

    start   = random.randint(1, hi)
    steps   = []
    current = start
    ops     = ["+", "-", "×"]

    for _ in range(steps_count):
        op = random.choice(ops)
        if op == "×":
            n = random.randint(2, 5)
        else:
            n = random.randint(1, hi)
        if op == "-" and n > current:
            n = current          # keep result non-negative
        if op == "+":
            current += n
        elif op == "-":
            current -= n
        else:
            current *= n
        steps.append({"op": op, "num": n})

    return {
        "start":  start,
        "steps":  steps,
        "answer": current,
        "type":   "brain_cruncher",
    }
