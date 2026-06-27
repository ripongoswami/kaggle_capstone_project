def calculate_quiz_grade(correct_count: int, total_count: int) -> float:
    if total_count == 0:
        return 100.0
    return round((correct_count / total_count) * 100.0, 1)
