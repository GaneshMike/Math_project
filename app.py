from flask import Flask, render_template, jsonify, request, session
import random
import json
import os
from datetime import datetime, date

app = Flask(__name__)
app.secret_key = "math_workout_secret_2024"

# ──────────────────────────────────────────
# Question generators
# ──────────────────────────────────────────

# Unified difficulty ranges used by every generator
DIFF_RANGES = {
    "easy":      (1, 20),
    "medium":    (1, 50),
    "hard":      (1, 100),
    "very_hard": (1, 500),
}

def generate_addition_subtraction(difficulty):
    """Generate add/subtract question based on difficulty."""
    lo, hi = DIFF_RANGES.get(difficulty, (1, 20))
    op = random.choice(["+", "-"])
    a = random.randint(lo, hi)
    b = random.randint(lo, hi)
    if op == "-" and b > a:
        a, b = b, a          # keep answer positive
    answer = a + b if op == "+" else a - b
    return {"question": f"{a} {op} {b}", "answer": answer, "type": "add_sub"}


def generate_multiply_divide(difficulty):
    """Generate multiply/divide question using unified difficulty ranges.
    For ×/÷ we cap operands at sqrt(hi) so answers stay manageable."""
    lo, hi = DIFF_RANGES.get(difficulty, (1, 20))
    import math
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
    """Random mix of all four operations."""
    fn = random.choice([generate_addition_subtraction,
                        generate_multiply_divide])
    return fn(difficulty)


def generate_times_table(table_num, difficulty):
    """Times-table question for a specific table, difficulty scales the multiplier range."""
    _, hi = DIFF_RANGES.get(difficulty, (1, 20))
    import math
    mul_hi = max(10, int(math.sqrt(hi)) * 3)
    b = random.randint(1, mul_hi)
    answer = table_num * b
    return {"question": f"{table_num} × {b}", "answer": answer, "type": "times_table"}


def generate_brain_cruncher(difficulty):
    """Multi-step chain calculation."""
    steps_count = {"low": 3, "medium": 4, "high": 5}.get(difficulty, 3)
    hi = {"low": 10, "medium": 20, "high": 50}.get(difficulty, 10)
    start = random.randint(1, hi)
    steps = []
    current = start
    ops = ["+", "-", "×"]
    for _ in range(steps_count):
        op = random.choice(ops)
        if op == "×":
            n = random.randint(2, 5)
        else:
            n = random.randint(1, hi)
        if op == "-" and n > current:
            n = current
        if op == "+":
            current += n
        elif op == "-":
            current -= n
        else:
            current *= n
        steps.append({"op": op, "num": n})
    return {
        "start": start,
        "steps": steps,
        "answer": current,
        "type": "brain_cruncher"
    }


def generate_mental_math(difficulty):
    """Same as add/subtract – spoken aloud by the browser TTS."""
    return generate_addition_subtraction(difficulty)


# ──────────────────────────────────────────
# Routes
# ──────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/questions/<game_type>")
def get_questions(game_type):
    difficulty  = request.args.get("difficulty", "easy")
    count       = int(request.args.get("count", 20))
    table_num   = int(request.args.get("table", 2))
    bc_diff_map = {"low": "low", "medium": "medium", "high": "high"}
    bc_diff     = bc_diff_map.get(difficulty, "low")

    questions = []
    for _ in range(count):
        if game_type == "add_sub":
            q = generate_addition_subtraction(difficulty)
        elif game_type == "mul_div":
            q = generate_multiply_divide(difficulty)
        elif game_type == "feeling_clever":
            q = generate_mixed(difficulty)
        elif game_type == "times_table":
            q = generate_times_table(table_num, difficulty)
        elif game_type == "brain_cruncher":
            q = generate_brain_cruncher(bc_diff)
        elif game_type == "mental_math":
            q = generate_mental_math(difficulty)
        else:
            q = generate_addition_subtraction(difficulty)
        questions.append(q)

    return jsonify({"questions": questions, "total": count})


@app.route("/api/score", methods=["POST"])
def save_score():
    data = request.json
    scores = session.get("scores", [])
    scores.append({
        "game":       data.get("game"),
        "difficulty": data.get("difficulty"),
        "correct":    data.get("correct"),
        "total":      data.get("total"),
        "time":       data.get("time"),
        "date":       str(date.today()),
    })
    session["scores"] = scores
    return jsonify({"status": "ok"})


@app.route("/api/scores")
def get_scores():
    return jsonify(session.get("scores", []))


if __name__ == "__main__":
    app.run(debug=True, port=5000)
