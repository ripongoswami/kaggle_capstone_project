from sqlalchemy.orm import Session
from typing import Optional, List
from app.repositories.quiz_repository import QuizRepository
from app.repositories.roadmap_repository import RoadmapRepository
from app.models.quiz import Quiz, QuizAttempt
from app.models.lesson import Lesson
from app.schemas.quiz import QuizSubmissionRequest, QuizEvaluationResponse
import json
import logging

logger = logging.getLogger("eduverse")

class QuizService:
    def __init__(self, db: Session):
        self.db = db
        self.quiz_repo = QuizRepository(db)
        self.roadmap_repo = RoadmapRepository(db)

    def get_or_generate_quiz(self, user_id: int, lesson_id: int) -> Quiz:
        # Check if already generated
        quiz = self.quiz_repo.get_quiz_by_lesson(lesson_id)
        if quiz:
            return quiz

        # Fetch lesson details to give context to agent
        lesson = self.roadmap_repo.get_lesson(lesson_id)
        if not lesson:
            raise Exception("Lesson not found")

        # Invoke QuizAgent to generate questions
        try:
            from app.agents.quiz_agent.agent import QuizAgent
            quiz_agent = QuizAgent()
            questions_data = quiz_agent.generate_quiz(
                lesson_title=lesson.title,
                lesson_description=lesson.description or "",
                difficulty=lesson.difficulty
            )
            title = f"Quiz: {lesson.title}"
            quiz = self.quiz_repo.create_quiz(lesson_id, title, questions_data)
            
            # Log event
            try:
                from app.services.roadmap_service import RoadmapService
                RoadmapService(self.db).log_event(user_id, "QUIZ_GENERATED", {"quiz_id": quiz.id, "title": title})
            except Exception as ev_err:
                logger.error(f"Failed to log quiz generation event: {ev_err}")
        except Exception as e:
            logger.error(f"QuizAgent failed to generate: {e}. Falling back to default questions.")
            # Fallback questions
            fallback_questions = [
                {
                    "question_id": 1,
                    "type": "MCQ",
                    "question": f"What is the primary focus of the lesson '{lesson.title}'?",
                    "options": ["Fundamental structures", "Database security", "Visual design patterns", "None of the above"],
                    "correct_option_idx": 0
                },
                {
                    "question_id": 2,
                    "type": "TF",
                    "question": "True or False: Practical exercises help consolidate theoretical skills.",
                    "correct_option_idx": 0
                }
            ]
            quiz = self.quiz_repo.create_quiz(lesson_id, f"Quiz: {lesson.title}", fallback_questions)

        return quiz

    def submit_quiz(self, user_id: int, submission: QuizSubmissionRequest) -> QuizEvaluationResponse:
        quiz = self.quiz_repo.get_quiz_by_id(submission.quiz_id)
        if not quiz:
            raise Exception("Quiz not found")

        is_extra = quiz.title.startswith("Extra Quiz:")
        if is_extra:
            attempts_count = self.db.query(QuizAttempt).filter(
                QuizAttempt.user_id == user_id,
                QuizAttempt.quiz_id == quiz.id
            ).count()
            if attempts_count >= 3:
                raise Exception("Maximum of 3 attempts reached for this extra quiz.")

        lesson = self.roadmap_repo.get_lesson(quiz.lesson_id)
        if not lesson:
            raise Exception("Lesson associated with quiz not found")

        questions = json.loads(quiz.questions)
        student_answers = {a.question_id: a for a in submission.answers}

        total_questions = len(questions)
        correct_count = 0
        weak_topics = []
        answers_log = []

        # We will parse each answer and grade it
        for q in questions:
            q_id = q.get("question_id")
            q_type = q.get("type")
            student_ans = student_answers.get(q_id)
            
            is_correct = False
            explanation = ""
            
            # Simple grading logic
            if q_type in ["MCQ", "TF"]:
                correct_idx = q.get("correct_option_idx")
                student_idx = student_ans.selected_option_idx if student_ans else None
                if student_idx == correct_idx:
                    correct_count += 1
                    is_correct = True
                else:
                    weak_topics.append(q.get("question", "")[:30]) # Add question fragment as reference
            elif q_type == "SA":
                # For Short Answer (SA), invoke QuizAgent Evaluator
                try:
                    from app.agents.quiz_agent.evaluator import QuizEvaluator
                    evaluator = QuizEvaluator()
                    eval_res = evaluator.evaluate_short_answer(
                        question=q.get("question", ""),
                        student_response=student_ans.short_answer_text if student_ans else ""
                    )
                    score_fraction = eval_res.get("score_fraction", 0.0) # 0.0 to 1.0
                    if score_fraction >= 0.7:
                        correct_count += 1
                        is_correct = True
                    else:
                        weak_topics.extend(eval_res.get("weaknesses", []))
                    explanation = eval_res.get("explanation", "")
                except Exception:
                    # Fallback simple string check
                    student_text = (student_ans.short_answer_text or "").lower().strip()
                    if len(student_text) > 5:
                        correct_count += 1
                        is_correct = True
                    else:
                        weak_topics.append("Short Answer Content")

            answers_log.append({
                "question_id": q_id,
                "is_correct": is_correct,
                "student_answer": student_ans.selected_option_idx if q_type in ["MCQ", "TF"] else (student_ans.short_answer_text if student_ans else ""),
                "explanation": explanation
            })

        score = (correct_count / total_questions) * 100.0 if total_questions > 0 else 100.0
        passed = score >= 60.0

        # Create attempt logs in DB
        self.quiz_repo.create_attempt(
            user_id=user_id,
            quiz_id=submission.quiz_id,
            score=score,
            answers_data=answers_log,
            weak_topics=weak_topics
        )

        # Log event QUIZ_COMPLETED
        try:
            from app.services.roadmap_service import RoadmapService
            roadmap_service = RoadmapService(self.db)
            roadmap_service.log_event(user_id, "QUIZ_COMPLETED", {"quiz_id": submission.quiz_id, "score": score, "passed": passed})
        except Exception as ev_err:
            logger.error(f"Failed to log quiz completion event: {ev_err}")

        adjustments_made = False
        # If score is low (< 60%), perform Adaptive Replanning
        if not passed and not is_extra:
            try:
                roadmap_service.log_event(user_id, "WEAK_TOPIC_DETECTED", {"quiz_id": submission.quiz_id, "weak_topics": weak_topics})
                roadmap_service.log_event(user_id, "ROADMAP_UPDATE_REQUIRED", {"lesson_id": lesson.id})
            except Exception as ev_err:
                logger.error(f"Failed to log adaptive replanning events: {ev_err}")
            adjustments_made = self._trigger_adaptive_replanning(lesson, weak_topics)

        # Update current lesson status to Completed if student passed
        if passed and not is_extra:
            self.roadmap_repo.update_lesson_status(lesson.id, "Completed")
            # Automatically unlock the next lesson so the student can continue
            next_lesson = self.roadmap_repo.get_next_lesson(lesson.roadmap_id, lesson.order)
            if next_lesson and next_lesson.status == "Locked":
                self.roadmap_repo.update_lesson_status(next_lesson.id, "Current")
                logger.info(f"Auto-unlocked next lesson '{next_lesson.title}' (id={next_lesson.id}) for roadmap {lesson.roadmap_id}")

        return QuizEvaluationResponse(
            score=score,
            passed=passed,
            weak_topics=weak_topics,
            adjustments_made=adjustments_made,
            explanation=f"Scored {score:.1f}%. " + ("Passed lesson!" if passed else "Needs revision. Lessons adjusted.")
        )

    def get_or_create_extra_quiz(self, user_id: int, lesson_id: int, gemini_key: str = None) -> Quiz:
        # 1. Verify main quiz was passed
        main_quiz = self.quiz_repo.get_quiz_by_lesson(lesson_id)
        if not main_quiz:
            raise Exception("Main quiz not found. You must complete the main lesson quiz first.")
        
        main_passed = self.db.query(QuizAttempt).filter(
            QuizAttempt.user_id == user_id,
            QuizAttempt.quiz_id == main_quiz.id,
            QuizAttempt.score >= 60.0
        ).first() is not None
        
        if not main_passed:
            raise Exception("You must pass the main lesson quiz with at least 60% before taking the extra quiz.")
            
        # 2. Check if extra quiz already exists
        extra_quiz = self.quiz_repo.get_extra_quiz_by_lesson(lesson_id)
        if extra_quiz:
            # Check attempts
            attempts_count = self.db.query(QuizAttempt).filter(
                QuizAttempt.user_id == user_id,
                QuizAttempt.quiz_id == extra_quiz.id
            ).count()
            if attempts_count >= 3:
                raise Exception("You have reached the maximum of 3 attempts for this extra quiz.")
            return extra_quiz
            
        # 3. Generate a new extra quiz with exactly 10 questions
        lesson = self.roadmap_repo.get_lesson(lesson_id)
        if not lesson:
            raise Exception("Lesson not found")
            
        try:
            from app.agents.quiz_agent.agent import QuizAgent
            from app.agents.planner_agent.tools import clean_json_response
            from app.agents.quiz_agent.prompts import QUIZ_GENERATOR_INSTRUCTION
            
            quiz_agent = QuizAgent(api_key=gemini_key)
            prompt = (
                f"Lesson Title: {lesson.title}\n"
                f"Lesson Description: {lesson.description or ''}\n"
                f"Difficulty: {lesson.difficulty}\n"
                f"Generate exactly 10 questions for this practice quiz."
            )
            raw_response = quiz_agent.generate(prompt, system_instruction=QUIZ_GENERATOR_INSTRUCTION)
            questions_data = clean_json_response(raw_response)
            
            title = f"Extra Quiz: {lesson.title}"
            extra_quiz = self.quiz_repo.create_extra_quiz(lesson_id, title, questions_data)
        except Exception as e:
            logger.error(f"Failed to generate extra quiz on-the-fly: {e}")
            # Fallback 10 questions
            fallback_questions = [
                {
                    "question_id": i,
                    "type": "MCQ" if i % 2 == 0 else "TF",
                    "question": f"Practice question {i} for lesson '{lesson.title}'?",
                    "options": ["A", "B", "C", "D"] if i % 2 == 0 else None,
                    "correct_option_idx": 0
                } for i in range(1, 11)
            ]
            extra_quiz = self.quiz_repo.create_extra_quiz(lesson_id, f"Extra Quiz: {lesson.title}", fallback_questions)
            
        return extra_quiz

    def _trigger_adaptive_replanning(self, current_lesson: Lesson, weak_topics: List[str]) -> bool:
        try:
            logger.info(f"Triggering adaptive learning replan for lesson {current_lesson.title} with weaknesses: {weak_topics}")
            from app.agents.planner_agent.agent import PlannerAgent
            planner = PlannerAgent()
            
            # Query planner agent to generate 1 or 2 remedial lessons for weak topics
            remedial_lessons_data = planner.generate_revision_lessons(
                topic=current_lesson.title,
                weaknesses=weak_topics,
                difficulty=current_lesson.difficulty
            )
            
            new_lessons = []
            for idx, item in enumerate(remedial_lessons_data):
                new_lesson = Lesson(
                    roadmap_id=current_lesson.roadmap_id,
                    title=item.get("title", f"Revision: {current_lesson.title}"),
                    description=item.get("description", "Review concepts and exercises to strengthen weaknesses."),
                    milestone_title=current_lesson.milestone_title,
                    difficulty=current_lesson.difficulty,
                    estimated_time=item.get("estimated_time", 20),
                    status="Current" if idx == 0 else "Locked",
                    revision_needed=True
                )
                new_lessons.append(new_lesson)
                
            if new_lessons:
                # Set the current lesson to "Locked" so the student must finish revision first
                self.roadmap_repo.update_lesson_status(current_lesson.id, "Locked")
                # Insert the new lessons immediately before the current lesson's order
                self.roadmap_repo.add_lessons_at_order(
                    roadmap_id=current_lesson.roadmap_id,
                    after_order=current_lesson.order - 1,
                    new_lessons=new_lessons
                )

                # Extend adaptive loop: generate remedial notes (Tutor) and resources (Research)
                try:
                    from app.agents.tutor_agent.agent import TutorAgent
                    from app.agents.research_agent.agent import ResearchAgent
                    import json as _json
                    tutor = TutorAgent()
                    researcher = ResearchAgent()
                    for rev_lesson in new_lessons:
                        try:
                            notes = tutor.generate_study_notes(rev_lesson.title, rev_lesson.description or "", rev_lesson.difficulty)
                            rev_lesson.study_notes = notes
                        except Exception as te:
                            logger.warning(f"Tutor notes for revision lesson '{rev_lesson.title}' failed: {te}")
                        try:
                            resources = researcher.find_resources(rev_lesson.title)
                            rev_lesson.resources = _json.dumps(resources) if isinstance(resources, list) else "[]"
                        except Exception as re_err:
                            logger.warning(f"Research resources for revision lesson '{rev_lesson.title}' failed: {re_err}")
                    self.db.commit()
                    logger.info(f"Adaptive loop: generated remedial notes and resources for {len(new_lessons)} revision lesson(s).")
                except Exception as ext_err:
                    logger.error(f"Extended adaptive loop (tutor+research) failed: {ext_err}")

                return True
        except Exception as e:
            logger.error(f"Adaptive replanning failed: {e}")
            
        # Fallback manual insertion if planner agent fails
        try:
            fallback_revision = Lesson(
                roadmap_id=current_lesson.roadmap_id,
                title=f"Review: {current_lesson.title}",
                description="Study materials and review fundamental concepts to pass the next evaluation.",
                milestone_title=current_lesson.milestone_title,
                difficulty=current_lesson.difficulty,
                estimated_time=30,
                status="Current",
                revision_needed=True
            )
            self.roadmap_repo.update_lesson_status(current_lesson.id, "Locked")
            self.roadmap_repo.add_lessons_at_order(
                roadmap_id=current_lesson.roadmap_id,
                after_order=current_lesson.order - 1,
                new_lessons=[fallback_revision]
            )
            return True
        except Exception as ex:
            logger.error(f"Fallback adaptive replanning failed: {ex}")
            
        return False
