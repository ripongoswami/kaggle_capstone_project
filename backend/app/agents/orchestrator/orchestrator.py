import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from app.agents.planner_agent.agent import PlannerAgent
from app.agents.tutor_agent.agent import TutorAgent
from app.agents.quiz_agent.agent import QuizAgent
from app.agents.research_agent.agent import ResearchAgent

logger = logging.getLogger("eduverse.agents.orchestrator")

class AgentOrchestrator:
    def __init__(self):
        self.planner = PlannerAgent()
        self.tutor = TutorAgent()
        self.quiz = QuizAgent()
        self.researcher = ResearchAgent()

    def generate_learning_package(self, goal: str, skill_level: str, daily_study_time: int) -> dict:
        logger.info(f"Orchestrating full learning package generation for goal: {goal}")
        
        # 1. Generate roadmap structure first
        roadmap_data = self.planner.generate_roadmap_data(goal, skill_level, daily_study_time)
        milestones = roadmap_data.get("milestones", [])
        
        # Collect all lessons to enrich in parallel
        lessons_flat = []
        for milestone in milestones:
            milestone_title = milestone.get("title", "Milestone")
            for lesson in milestone.get("lessons", []):
                lesson["milestone_title"] = milestone_title
                lessons_flat.append(lesson)
                
        # 2. Run agent tasks in parallel
        results = {}
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Task: Career path analysis
            career_future = executor.submit(self.researcher.suggest_career_paths, goal)
            
            # Tasks: Lesson study notes, resources, and quizzes
            lesson_futures = {}
            for idx, lesson in enumerate(lessons_flat):
                title = lesson.get("title")
                desc = lesson.get("description", "")
                
                # We submit parallel tasks for study notes, quiz questions, and resources
                lesson_futures[executor.submit(self.tutor.generate_study_notes, title, desc, skill_level)] = (idx, "study_notes")
                lesson_futures[executor.submit(self.quiz.generate_quiz, title, desc, skill_level)] = (idx, "quiz_questions")
                lesson_futures[executor.submit(self.researcher.find_resources, title)] = (idx, "resources")
                
            # Await career guidance
            try:
                results["career"] = career_future.result(timeout=60)
            except Exception as e:
                logger.error(f"Career guidance generation failed: {e}")
                results["career"] = []

            # Populate lessons as they finish
            for future in as_completed(lesson_futures):
                idx, field_name = lesson_futures[future]
                try:
                    res = future.result()
                    lessons_flat[idx][field_name] = res
                except Exception as e:
                    logger.error(f"Orchestration task for lesson index {idx} field {field_name} failed: {e}")
                    lessons_flat[idx][field_name] = None
                    
        return {
            "roadmap_title": roadmap_data.get("title", f"Roadmap: {goal}"),
            "milestones": milestones,
            "career": results["career"]
        }
