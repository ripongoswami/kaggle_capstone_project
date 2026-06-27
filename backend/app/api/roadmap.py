from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.schemas.roadmap import RoadmapResponse, RoadmapCreateRequest, LessonResponse
from app.services.roadmap_service import RoadmapService
from app.models.user import User

router = APIRouter(prefix="/roadmap", tags=["roadmap"])

@router.get("/active", response_model=RoadmapResponse)
def get_active_roadmap(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roadmap_service = RoadmapService(db)
    roadmap = roadmap_service.get_user_roadmap(current_user.id)
    if not roadmap:
        raise HTTPException(status_code=404, detail="No active roadmap found. Please onboard first.")
        
    # Group lessons into milestones for schema validation
    lessons = roadmap_service.roadmap_repo.get_lessons_by_roadmap(roadmap.id)
    milestones_dict = {}
    for l in lessons:
        m_title = l.milestone_title
        if m_title not in milestones_dict:
            milestones_dict[m_title] = []
        milestones_dict[m_title].append(LessonResponse.model_validate(l))
        
    milestones = [{"title": k, "lessons": v} for k, v in milestones_dict.items()]
    
    response_data = RoadmapResponse.model_validate(roadmap)
    response_data.milestones = milestones
    return response_data

@router.post("/create", response_model=RoadmapResponse)
@router.post("/generate", response_model=RoadmapResponse)
def generate_roadmap(request: RoadmapCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roadmap_service = RoadmapService(db)
    roadmap = roadmap_service.generate_roadmap(current_user.id, request)
    
    lessons = roadmap_service.roadmap_repo.get_lessons_by_roadmap(roadmap.id)
    milestones_dict = {}
    for l in lessons:
        m_title = l.milestone_title
        if m_title not in milestones_dict:
            milestones_dict[m_title] = []
        milestones_dict[m_title].append(LessonResponse.model_validate(l))
        
    milestones = [{"title": k, "lessons": v} for k, v in milestones_dict.items()]
    
    response_data = RoadmapResponse.model_validate(roadmap)
    response_data.milestones = milestones
    return response_data

@router.put("/lesson/{lesson_id}/status", response_model=LessonResponse)
def update_lesson_status(lesson_id: int, status: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if status not in ["Locked", "Current", "Completed"]:
        raise HTTPException(status_code=400, detail="Invalid lesson status")
    roadmap_service = RoadmapService(db)
    lesson = roadmap_service.update_lesson_status(lesson_id, status)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return LessonResponse.model_validate(lesson)

@router.post("/lesson/{lesson_id}/start", response_model=LessonResponse)
def start_lesson(lesson_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Manually unlock and start a locked lesson — sets its status to 'Current' and logs event."""
    roadmap_service = RoadmapService(db)
    lesson = roadmap_service.roadmap_repo.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if lesson.status == "Completed":
        raise HTTPException(status_code=400, detail="Lesson already completed.")
    updated = roadmap_service.roadmap_repo.update_lesson_status(lesson_id, "Current")
    roadmap_service.log_event(current_user.id, "LESSON_STARTED", {"lesson_id": lesson_id, "title": lesson.title})
    return LessonResponse.model_validate(updated)

class StepRequest(BaseModel):
    roadmap_id: int

@router.post("/step/planner", response_model=RoadmapResponse)
def step_planner(request: RoadmapCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roadmap_service = RoadmapService(db)
    roadmap = roadmap_service.generate_roadmap_structure(
        user_id=current_user.id,
        request=request,
        gemini_key=current_user.gemini_api_key,
        tavily_key=current_user.tavily_api_key
    )
    
    lessons = roadmap_service.roadmap_repo.get_lessons_by_roadmap(roadmap.id)
    milestones_dict = {}
    for l in lessons:
        m_title = l.milestone_title
        if m_title not in milestones_dict:
            milestones_dict[m_title] = []
        milestones_dict[m_title].append(LessonResponse.model_validate(l))
        
    milestones = [{"title": k, "lessons": v} for k, v in milestones_dict.items()]
    
    response_data = RoadmapResponse.model_validate(roadmap)
    response_data.milestones = milestones
    return response_data

@router.post("/step/tutor")
def step_tutor(req: StepRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roadmap_service = RoadmapService(db)
    roadmap_service.generate_roadmap_tutor(req.roadmap_id, gemini_key=current_user.gemini_api_key)
    return {"status": "success", "message": "Study notes generated successfully"}

@router.post("/step/quiz")
def step_quiz(req: StepRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roadmap_service = RoadmapService(db)
    roadmap_service.generate_roadmap_quiz(req.roadmap_id, gemini_key=current_user.gemini_api_key)
    return {"status": "success", "message": "Quiz questions generated successfully"}

@router.post("/step/research")
def step_research(req: StepRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roadmap_service = RoadmapService(db)
    roadmap_service.generate_roadmap_research(req.roadmap_id, gemini_key=current_user.gemini_api_key, tavily_key=current_user.tavily_api_key)
    roadmap_service.log_event(current_user.id, "CAREER_ANALYSIS_REQUIRED", {"roadmap_id": req.roadmap_id})
    roadmap_service.log_event(current_user.id, "RESOURCE_REFRESH_REQUIRED", {"roadmap_id": req.roadmap_id})
    return {"status": "success", "message": "Resources and career research completed successfully"}

@router.post("/lesson/{lesson_id}/regenerate", response_model=LessonResponse)
def regenerate_lesson_content(lesson_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roadmap_service = RoadmapService(db)
    lesson = roadmap_service.roadmap_repo.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    from app.agents.tutor_agent.agent import TutorAgent
    from app.agents.research_agent.agent import ResearchAgent
    import json
    
    try:
        tutor = TutorAgent(api_key=current_user.gemini_api_key)
        notes = tutor.generate_study_notes(lesson.title, lesson.description or "", lesson.difficulty)
        lesson.study_notes = notes
    except Exception as e:
        import logging
        logging.getLogger("eduverse").error(f"Regenerate tutor notes failed: {e}")
        
    try:
        researcher = ResearchAgent(gemini_api_key=current_user.gemini_api_key, tavily_api_key=current_user.tavily_api_key)
        resources = researcher.find_resources(lesson.title)
        lesson.resources = json.dumps(resources) if isinstance(resources, list) else (resources if isinstance(resources, str) else "[]")
    except Exception as e:
        import logging
        logging.getLogger("eduverse").error(f"Regenerate resources failed: {e}")
        
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return LessonResponse.model_validate(lesson)
