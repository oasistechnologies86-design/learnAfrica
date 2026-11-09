"""Regression tests for single-answer and multiple-answer quiz grading."""
from app.quiz_service import build_served_questions, grade_served, public_questions


def test_multiple_answer_requires_exact_set():
    served = [{
        "id": "q1",
        "question": "Choose two.",
        "question_type": "mcq_multi",
        "options": ["A", "B", "C", "D"],
        "correct_answer": [0, 2],
    }]
    score, correct_count, correct_map, passed = grade_served(served, {"0": [2, 0]}, 70)
    assert score == 100
    assert correct_count == 1
    assert correct_map == {0: [0, 2]}
    assert passed is True

    score, correct_count, _, passed = grade_served(served, {"0": [0, 1, 2]}, 70)
    assert score == 0
    assert correct_count == 0
    assert passed is False


def test_single_answer_grading_remains_unchanged():
    served = [{
        "id": "q2",
        "question": "Choose one.",
        "question_type": "mcq",
        "options": ["A", "B"],
        "correct_answer": 1,
    }]
    score, correct_count, correct_map, passed = grade_served(served, {"0": 1}, 70)
    assert score == 100
    assert correct_count == 1
    assert correct_map == {0: 1}
    assert passed is True



def test_served_multiple_answer_question_hides_keys_but_shows_required_count():
    quiz = {"shuffle_questions": False, "shuffle_options": False, "questions_per_attempt": 0}
    rows = [{
        "id": "q3",
        "question_text": "Choose two.",
        "question_type": "mcq_multi",
        "options": '["A", "B", "C"]',
        "correct_answer": 0,
        "correct_answers": "[0, 2]",
    }]
    served = build_served_questions(quiz, rows)
    assert served[0]["correct_answer"] == [0, 2]
    assert served[0]["required_answers"] == 2
    public = public_questions(served)
    assert "correct_answer" not in public[0]
    assert public[0]["required_answers"] == 2


if __name__ == "__main__":
    test_multiple_answer_requires_exact_set()
    test_single_answer_grading_remains_unchanged()
    test_served_multiple_answer_question_hides_keys_but_shows_required_count()
    print("ALL MULTIPLE-ANSWER QUIZ CHECKS PASSED")
