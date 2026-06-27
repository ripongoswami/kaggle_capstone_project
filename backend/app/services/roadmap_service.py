from sqlalchemy.orm import Session
from typing import Optional, List
from app.repositories.roadmap_repository import RoadmapRepository
from app.repositories.user_repository import UserRepository
from app.models.roadmap import Roadmap
from app.models.lesson import Lesson
from app.schemas.roadmap import RoadmapCreateRequest
import logging

logger = logging.getLogger("eduverse")

class RoadmapService:
    def __init__(self, db: Session):
        self.db = db
        self.roadmap_repo = RoadmapRepository(db)
        self.user_repo = UserRepository(db)

    def get_user_roadmap(self, user_id: int) -> Optional[Roadmap]:
        return self.roadmap_repo.get_by_user_id(user_id)

    def log_event(self, user_id: int, event_type: str, details: dict = None):
        try:
            import json
            from app.models.event import EventLog
            details_str = json.dumps(details) if details else None
            log = EventLog(user_id=user_id, event_type=event_type, details=details_str)
            self.db.add(log)
            self.db.commit()
            logger.info(f"Event Logged: {event_type} for User {user_id}")
        except Exception as e:
            logger.error(f"Failed to log event {event_type}: {e}")

    def generate_roadmap(self, user_id: int, request: RoadmapCreateRequest) -> Roadmap:
        # Update user's preferences first
        user = self.user_repo.get_by_id(user_id)
        if user:
            self.user_repo.update_profile(
                user=user,
                goal=request.goal,
                skill_level=request.skill_level,
                daily_study_time=request.daily_study_time
            )

        roadmap_title = f"Roadmap: {request.goal}"
        
        # Invoke the Multi-Agent Orchestrator to create the complete learning ecosystem
        import json
        from app.agents.orchestrator.orchestrator import AgentOrchestrator
        
        career_readiness = 15.0
        missing_skills = []
        target_roles = []
        certifications = []
        package = {"milestones": []}
        
        try:
            orchestrator = AgentOrchestrator()
            package = orchestrator.generate_learning_package(
                goal=request.goal,
                skill_level=request.skill_level,
                daily_study_time=request.daily_study_time
            )
            
            roadmap_title = package.get("roadmap_title", roadmap_title)
            career_list = package.get("career", [])
            
            # Parse career path data
            for item in career_list:
                # Distinguish structured milestones from fallback search results
                is_fallback_item = "skills" not in item
                
                title = item.get("title")
                if title and not is_fallback_item:
                    target_roles.append(title)
                
                # Extract explicit list of skills if present
                item_skills = item.get("skills", [])
                if isinstance(item_skills, list):
                    for sk in item_skills:
                        if sk and sk not in missing_skills:
                            missing_skills.append(sk)
                            
                # Extract explicit list of certifications if present
                item_certs = item.get("certifications", [])
                if isinstance(item_certs, list):
                    for cert in item_certs:
                        if cert and cert not in certifications:
                            certifications.append(cert)
            
            # Clean goal name for cleaner fallback texts (e.g. remove "Learn", "Become a")
            clean_goal = request.goal
            prefixes = ["learn ", "learning ", "become a ", "become an ", "mastering ", "master "]
            for p in prefixes:
                if clean_goal.lower().startswith(p):
                    clean_goal = clean_goal[len(p):].strip()
            if clean_goal:
                clean_goal = clean_goal[0].upper() + clean_goal[1:]
                    
            if not missing_skills:
                missing_skills = [f"Core {clean_goal} Fundamentals", f"Advanced {clean_goal} Concepts", "API Integration & MLOps"]
            if not target_roles:
                target_roles = [f"Junior {clean_goal} Engineer", f"Senior {clean_goal} Specialist"]
            if not certifications:
                certifications = [f"{clean_goal} Professional Certificate", f"Google Cloud {clean_goal} Professional"]
                
        except Exception as e:
            logger.error(f"Multi-Agent Orchestration failed: {e}")
            missing_skills = ["Fundamentals"]
            target_roles = ["Developer"]
            certifications = ["Standard Certificate"]

        roadmap = self.roadmap_repo.create_roadmap(
            user_id=user_id,
            title=roadmap_title,
            career_readiness=career_readiness,
            missing_skills=json.dumps(missing_skills[:5]),
            target_roles=json.dumps(target_roles[:5]),
            certifications=json.dumps(certifications[:5])
        )

        lessons_list = []
        order_counter = 1
        
        if package.get("milestones"):
            for milestone in package.get("milestones", []):
                milestone_title = milestone.get("title", "Milestone")
                for lesson_dict in milestone.get("lessons", []):
                    # Extract pre-generated details from the orchestrator
                    study_notes = lesson_dict.get("study_notes")
                    resources_val = lesson_dict.get("resources")
                    quiz_questions_val = lesson_dict.get("quiz_questions")
                    
                    # Ensure resources and quizzes are JSON encoded strings
                    resources_str = json.dumps(resources_val) if isinstance(resources_val, list) else (resources_val if isinstance(resources_val, str) else "[]")
                    quiz_questions_str = json.dumps(quiz_questions_val) if isinstance(quiz_questions_val, list) else (quiz_questions_val if isinstance(quiz_questions_val, str) else "[]")

                    lesson = Lesson(
                        roadmap_id=roadmap.id,
                        title=lesson_dict.get("title", "Untitled Lesson"),
                        description=lesson_dict.get("description", ""),
                        milestone_title=milestone_title,
                        difficulty=request.skill_level,
                        estimated_time=lesson_dict.get("estimated_time", 30),
                        status="Current" if order_counter == 1 else "Locked",
                        order=order_counter,
                        study_notes=study_notes,
                        resources=resources_str,
                        quiz_questions=quiz_questions_str
                    )
                    lessons_list.append(lesson)
                    order_counter += 1
            
            self.roadmap_repo.create_lessons(lessons_list)
        else:
            # Fallback template
            lessons_list = [
                Lesson(
                    roadmap_id=roadmap.id,
                    title="Introduction & Fundamental Terminology",
                    description=f"Overview of core terms and workflows for learning {request.goal}.",
                    milestone_title="Milestone 1: Foundations",
                    difficulty=request.skill_level,
                    estimated_time=30,
                    status="Current",
                    order=1,
                    study_notes=f"# Introduction to {request.goal}\nLet's cover foundations...",
                    resources="[]",
                    quiz_questions="[]"
                )
            ]
            self.roadmap_repo.create_lessons(lessons_list)

        self.roadmap_repo.update_roadmap_progress(roadmap.id)
        
        # Log event ROADMAP_CREATED
        self.log_event(user_id, "ROADMAP_CREATED", {"goal": request.goal, "lessons_count": len(lessons_list)})
        
        return roadmap

    def update_lesson_status(self, lesson_id: int, status: str) -> Optional[Lesson]:
        lesson = self.roadmap_repo.get_lesson(lesson_id)
        if not lesson:
            return None
        updated_lesson = self.roadmap_repo.update_lesson_status(lesson_id, status)
        
        # If a lesson completes, unlock the next lesson automatically
        if status == "Completed":
            # Fetch user ID from roadmap
            roadmap = self.roadmap_repo.get_roadmap_by_id(lesson.roadmap_id)
            user_id = roadmap.user_id if roadmap else 0
            self.log_event(user_id, "LESSON_COMPLETED", {"lesson_id": lesson_id, "title": lesson.title})
            
            lessons = self.roadmap_repo.get_lessons_by_roadmap(lesson.roadmap_id)
            next_lesson = next((l for l in lessons if l.order == lesson.order + 1), None)
            if next_lesson and next_lesson.status == "Locked":
                self.roadmap_repo.update_lesson_status(next_lesson.id, "Current")
                
        return updated_lesson

    def generate_roadmap_structure(self, user_id: int, request: RoadmapCreateRequest, gemini_key: str = None, tavily_key: str = None) -> Roadmap:
        # Update user's preferences first
        user = self.user_repo.get_by_id(user_id)
        if user:
            self.user_repo.update_profile(
                user=user,
                goal=request.goal,
                skill_level=request.skill_level,
                daily_study_time=request.daily_study_time
            )

        roadmap_title = f"Roadmap: {request.goal}"
        
        from app.agents.planner_agent.agent import PlannerAgent
        from app.agents.research_agent.agent import ResearchAgent
        import json
        
        career_readiness = 15.0
        missing_skills = []
        target_roles = []
        certifications = []
        package = {"milestones": []}
        
        try:
            planner = PlannerAgent(api_key=gemini_key)
            package = planner.generate_roadmap_data(request.goal, request.skill_level, request.daily_study_time)
            roadmap_title = package.get("title", roadmap_title)
            
            researcher = ResearchAgent(gemini_api_key=gemini_key, tavily_api_key=tavily_key)
            career_list = researcher.suggest_career_paths(request.goal)
            
            for item in career_list:
                is_fallback_item = "skills" not in item
                title = item.get("title")
                if title and not is_fallback_item:
                    target_roles.append(title)
                
                item_skills = item.get("skills", [])
                if isinstance(item_skills, list):
                    for sk in item_skills:
                        if sk and sk not in missing_skills:
                            missing_skills.append(sk)
                            
                item_certs = item.get("certifications", [])
                if isinstance(item_certs, list):
                    for cert in item_certs:
                        if cert and cert not in certifications:
                            certifications.append(cert)
            
            clean_goal = request.goal
            prefixes = ["learn ", "learning ", "become a ", "become an ", "mastering ", "master "]
            for p in prefixes:
                if clean_goal.lower().startswith(p):
                    clean_goal = clean_goal[len(p):].strip()
            if clean_goal:
                clean_goal = clean_goal[0].upper() + clean_goal[1:]
                    
            if not missing_skills:
                missing_skills = [f"Core {clean_goal} Fundamentals", f"Advanced {clean_goal} Concepts", "API Integration & MLOps"]
            if not target_roles:
                target_roles = [f"Junior {clean_goal} Engineer", f"Senior {clean_goal} Specialist"]
            if not certifications:
                certifications = [f"{clean_goal} Professional Certificate", f"Google Cloud {clean_goal} Professional"]
                
        except Exception as e:
            logger.error(f"Sequential step 1 generation failed: {e}")
            missing_skills = ["Fundamentals"]
            target_roles = ["Developer"]
            certifications = ["Standard Certificate"]

        roadmap = self.roadmap_repo.create_roadmap(
            user_id=user_id,
            title=roadmap_title,
            career_readiness=career_readiness,
            missing_skills=json.dumps(missing_skills[:5]),
            target_roles=json.dumps(target_roles[:5]),
            certifications=json.dumps(certifications[:5])
        )

        lessons_list = []
        order_counter = 1
        
        if package.get("milestones"):
            for milestone in package.get("milestones", []):
                milestone_title = milestone.get("title", "Milestone")
                for lesson_dict in milestone.get("lessons", []):
                    lesson = Lesson(
                        roadmap_id=roadmap.id,
                        title=lesson_dict.get("title", "Untitled Lesson"),
                        description=lesson_dict.get("description", ""),
                        milestone_title=milestone_title,
                        difficulty=request.skill_level,
                        estimated_time=lesson_dict.get("estimated_time", 30),
                        status="Current" if order_counter == 1 else "Locked",
                        order=order_counter,
                        study_notes="",
                        resources="[]",
                        quiz_questions="[]"
                    )
                    lessons_list.append(lesson)
                    order_counter += 1
            
            self.roadmap_repo.create_lessons(lessons_list)
        else:
            # Fallback template
            lessons_list = [
                Lesson(
                    roadmap_id=roadmap.id,
                    title="Introduction & Fundamental Terminology",
                    description=f"Overview of core terms and workflows for learning {request.goal}.",
                    milestone_title="Milestone 1: Foundations",
                    difficulty=request.skill_level,
                    estimated_time=30,
                    status="Current",
                    order=1,
                    study_notes="",
                    resources="[]",
                    quiz_questions="[]"
                )
            ]
            self.roadmap_repo.create_lessons(lessons_list)

        self.roadmap_repo.update_roadmap_progress(roadmap.id)
        self.log_event(user_id, "ROADMAP_CREATED", {"goal": request.goal, "lessons_count": len(lessons_list)})
        return roadmap

    def generate_roadmap_tutor(self, roadmap_id: int, gemini_key: str = None):
        from app.agents.tutor_agent.agent import TutorAgent
        tutor = TutorAgent(api_key=gemini_key)
        lessons = self.roadmap_repo.get_lessons_by_roadmap(roadmap_id)
        for lesson in lessons:
            try:
                notes = tutor.generate_study_notes(lesson.title, lesson.description or "", lesson.difficulty)
                lesson.study_notes = notes
                self.db.add(lesson)
            except Exception as e:
                logger.error(f"Failed to generate study notes for lesson {lesson.id}: {e}")
        self.db.commit()

    def generate_roadmap_quiz(self, roadmap_id: int, gemini_key: str = None):
        from app.agents.quiz_agent.agent import QuizAgent
        import json
        quiz_agent = QuizAgent(api_key=gemini_key)
        lessons = self.roadmap_repo.get_lessons_by_roadmap(roadmap_id)
        for lesson in lessons:
            try:
                questions = quiz_agent.generate_quiz(lesson.title, lesson.description or "", lesson.difficulty)
                lesson.quiz_questions = json.dumps(questions) if isinstance(questions, list) else (questions if isinstance(questions, str) else "[]")
                self.db.add(lesson)
            except Exception as e:
                logger.error(f"Failed to generate quiz for lesson {lesson.id}: {e}")
        self.db.commit()

    def generate_roadmap_research(self, roadmap_id: int, gemini_key: str = None, tavily_key: str = None):
        from app.agents.research_agent.agent import ResearchAgent
        import json
        researcher = ResearchAgent(gemini_api_key=gemini_key, tavily_api_key=tavily_key)
        lessons = self.roadmap_repo.get_lessons_by_roadmap(roadmap_id)
        for lesson in lessons:
            try:
                resources = researcher.find_resources(lesson.title, skill_level=lesson.difficulty)
                lesson.resources = json.dumps(resources) if isinstance(resources, list) else (resources if isinstance(resources, str) else "[]")
                self.db.add(lesson)
            except Exception as e:
                logger.error(f"Failed to generate resources for lesson {lesson.id}: {e}")
        self.db.commit()
