# routes/api.py – REST API routes (questions & scores)

from datetime import date
from flask import Blueprint, jsonify, request, session

from generators import (
    generate_addition_subtraction,
    generate_multiply_divide,
    generate_mixed,
    generate_mental_math,
    generate_times_table,
    generate_brain_cruncher,
)

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.route("/questions/<game_type>")
def get_questions(game_type):
    difficulty = request.args.get("difficulty", "easy")
    count      = int(request.args.get("count", 20))
    table_num  = int(request.args.get("table", 2))
    bc_diff    = {"low": "low", "medium": "medium", "high": "high"}.get(difficulty, "low")

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


@api_bp.route("/score", methods=["POST"])
def save_score():
    data   = request.json
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


@api_bp.route("/scores")
def get_scores():
    return jsonify(session.get("scores", []))
