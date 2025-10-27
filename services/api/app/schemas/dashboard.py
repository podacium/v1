from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class DashboardStats(BaseModel):
    total_courses: int
    completed_courses: int
    active_projects: int
    completed_projects: int
    datasets_count: int
    certifications_count: int
    total_earnings: float
    skill_level: str

class RecentActivity(BaseModel):
    id: int
    type: str  # 'course_completed', 'project_started', 'certification_earned', etc.
    title: str
    description: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class CourseProgress(BaseModel):
    id: int
    title: str
    progress: float
    module_count: int
    completed_modules: int
    next_lesson: Optional[str]
    estimated_completion: Optional[datetime]
    thumbnail_url: Optional[str]

class ProjectStatus(BaseModel):
    id: int
    title: str
    status: str  # 'active', 'completed', 'pending'
    client: Optional[str]
    deadline: Optional[datetime]
    progress: float
    amount: Optional[float]

class DatasetInfo(BaseModel):
    id: int
    name: str
    size: str
    last_accessed: datetime
    record_count: int
    processing_status: str

class DashboardResponse(BaseModel):
    user_stats: DashboardStats
    recent_activities: List[RecentActivity]
    ongoing_courses: List[CourseProgress]
    active_projects: List[ProjectStatus]
    recent_datasets: List[DatasetInfo]
    skill_breakdown: Dict[str, float]
    recommendations: List[Dict[str, Any]]