# generators/times_table.py – Times-table question generator

import random
import math
from config import DIFF_RANGES


def generate_times_table(table_num, difficulty):
    """Times-table question for a specific table.

    Difficulty scales the multiplier range so harder levels require
    larger multiplication facts.
    """
    _, hi = DIFF_RANGES.get(difficulty, (1, 20))
    mul_hi = max(10, int(math.sqrt(hi)) * 3)
    b = random.randint(1, mul_hi)
    answer = table_num * b
    return {"question": f"{table_num} × {b}", "answer": answer, "type": "times_table"}
