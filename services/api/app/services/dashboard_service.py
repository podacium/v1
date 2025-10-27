from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from app.core.prisma import prisma
from app.schemas.dashboard import (
    DashboardStats, RecentActivity, CourseProgress, 
    ProjectStatus, DatasetInfo, DashboardResponse
)

class DashboardService:
    
    async def get_user_dashboard(self, user_id: int) -> DashboardResponse:
        """Get comprehensive dashboard data for a user"""
        
        # Get all data in parallel for better performance
        stats = await self._get_user_stats(user_id)
        activities = await self._get_recent_activities(user_id)
        courses = await self._get_ongoing_courses(user_id)
        projects = await self._get_active_projects(user_id)
        datasets = await self._get_recent_datasets(user_id)
        skills = await self._get_skill_breakdown(user_id)
        recommendations = await self._get_recommendations(user_id)
        
        return DashboardResponse(
            user_stats=stats,
            recent_activities=activities,
            ongoing_courses=courses,
            active_projects=projects,
            recent_datasets=datasets,
            skill_breakdown=skills,
            recommendations=recommendations
        )
    
    async def _get_user_stats(self, user_id: int) -> DashboardStats:
        """Calculate user statistics"""
        
        # Course statistics
        enrollments = await prisma.enrollment.find_many(
            where={"userId": user_id},
            include={"module": True}
        )
        
        total_courses = len(enrollments)
        completed_courses = len([e for e in enrollments if e.completedAt])
        
        # Project statistics
        contracts_as_freelancer = await prisma.contract.find_many(
            where={"freelancerId": user_id}
        )
        contracts_as_client = await prisma.contract.find_many(
            where={"clientId": user_id}
        )
        all_contracts = contracts_as_freelancer + contracts_as_client
        
        active_projects = len([c for c in all_contracts if c.status == "ACTIVE"])
        completed_projects = len([c for c in all_contracts if c.status == "COMPLETED"])
        
        # Dataset statistics
        datasets_count = await prisma.dataset.count(where={"userId": user_id})
        
        # Certification statistics
        certifications_count = await prisma.certificate.count(where={"userId": user_id})
        
        # Earnings calculation (from freelancer contracts)
        total_earnings = sum(
            [contract.amountCents or 0 for contract in contracts_as_freelancer 
             if contract.status == "COMPLETED"]
        ) / 100  # Convert cents to currency units
        
        # Skill level calculation
        skill_level = self._calculate_skill_level(user_id, enrollments, all_contracts)
        
        return DashboardStats(
            total_courses=total_courses,
            completed_courses=completed_courses,
            active_projects=active_projects,
            completed_projects=completed_projects,
            datasets_count=datasets_count,
            certifications_count=certifications_count,
            total_earnings=total_earnings,
            skill_level=skill_level
        )
    
    async def _get_recent_activities(self, user_id: int) -> List[RecentActivity]:
        """Get user's recent activities across all pillars"""
        activities = []
        
        # Recent course completions
        recent_completions = await prisma.enrollment.find_many(
            where={
                "userId": user_id,
                "completedAt": {"not": None}
            },
            include={"module": True},
            take=5,
            order={"completedAt": "desc"}
        )
        
        for completion in recent_completions:
            activities.append(RecentActivity(
                id=completion.id,
                type="course_completed",
                title=completion.module.title if completion.module else "Course",
                description=f"Completed {completion.module.title}" if completion.module else "Completed course",
                timestamp=completion.completedAt or datetime.utcnow(),
                metadata={"module_id": completion.moduleId}
            ))
        
        # Recent project activities
        recent_contracts = await prisma.contract.find_many(
            where={
                "OR": [
                    {"freelancerId": user_id},
                    {"clientId": user_id}
                ]
            },
            include={"project": True},
            take=5,
            order={"updatedAt": "desc"}
        )
        
        for contract in recent_contracts:
            activity_type = "project_started" if contract.status == "ACTIVE" else "project_updated"
            activities.append(RecentActivity(
                id=contract.id,
                type=activity_type,
                title=contract.project.title if contract.project else "Project",
                description=f"Project status: {contract.status}",
                timestamp=contract.updatedAt,
                metadata={"project_id": contract.projectId, "status": contract.status}
            ))
        
        # Sort all activities by timestamp and return top 10
        activities.sort(key=lambda x: x.timestamp, reverse=True)
        return activities[:10]
    
    async def _get_ongoing_courses(self, user_id: int) -> List[CourseProgress]:
        """Get user's ongoing courses with progress"""
        enrollments = await prisma.enrollment.find_many(
            where={
                "userId": user_id,
                "completedAt": None
            },
            include={
                "module": {
                    "include": {
                        "lessons": True,
                        "pathLinks": {
                            "include": {"path": True}
                        }
                    }
                }
            }
        )
        
        courses = []
        for enrollment in enrollments:
            if not enrollment.module:
                continue
                
            # Calculate progress
            total_lessons = len(enrollment.module.lessons)
            completed_lessons = await prisma.lessonprogress.count(
                where={
                    "userId": user_id,
                    "lessonId": {"in": [lesson.id for lesson in enrollment.module.lessons]},
                    "isCompleted": True
                }
            )
            
            progress = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
            
            # Find next lesson
            next_lesson = None
            if progress < 100:
                next_lesson_progress = await prisma.lessonprogress.find_first(
                    where={
                        "userId": user_id,
                        "lesson": {"moduleId": enrollment.moduleId},
                        "isCompleted": False
                    },
                    include={"lesson": True},
                    order={"lesson": {"order": "asc"}}
                )
                if next_lesson_progress and next_lesson_progress.lesson:
                    next_lesson = next_lesson_progress.lesson.title
            
            courses.append(CourseProgress(
                id=enrollment.module.id,
                title=enrollment.module.title,
                progress=progress,
                module_count=total_lessons,
                completed_modules=completed_lessons,
                next_lesson=next_lesson,
                estimated_completion=self._estimate_completion_date(progress),
                thumbnail_url=enrollment.module.thumbnailUrl
            ))
        
        return courses
    
    async def _get_active_projects(self, user_id: int) -> List[ProjectStatus]:
        """Get user's active projects"""
        contracts = await prisma.contract.find_many(
            where={
                "OR": [
                    {"freelancerId": user_id},
                    {"clientId": user_id}
                ],
                "status": "ACTIVE"
            },
            include={
                "project": {
                    "include": {
                        "organization": True,
                        "owner": True
                    }
                },
                "client": True,
                "freelancer": True
            }
        )
        
        projects = []
        for contract in contracts:
            # Determine client name
            client_name = None
            if contract.client:
                client_name = contract.client.fullName
            elif contract.project and contract.project.organization:
                client_name = contract.project.organization.name
            elif contract.project and contract.project.owner:
                client_name = contract.project.owner.fullName
            
            projects.append(ProjectStatus(
                id=contract.projectId,
                title=contract.project.title if contract.project else "Project",
                status=contract.status,
                client=client_name,
                deadline=contract.endDate,
                progress=50,  # This would need actual progress calculation
                amount=(contract.project.budgetCents or 0) / 100 if contract.project else 0
            ))
        
        return projects
    
    async def _get_recent_datasets(self, user_id: int) -> List[DatasetInfo]:
        """Get user's recent datasets"""
        datasets = await prisma.dataset.find_many(
            where={"userId": user_id},
            take=5,
            order={"updatedAt": "desc"}
        )
        
        dataset_info = []
        for dataset in datasets:
            dataset_info.append(DatasetInfo(
                id=dataset.id,
                name=dataset.name,
                size=self._format_size(dataset.size or 0),
                last_accessed=dataset.updatedAt,
                record_count=len(dataset.previewRows or []) if dataset.previewRows else 0,
                processing_status=dataset.processingStatus
            ))
        
        return dataset_info
    
    async def _get_skill_breakdown(self, user_id: int) -> Dict[str, float]:
        """Calculate user's skill breakdown"""
        # Get user skills
        user_skills = await prisma.userskill.find_many(where={"userId": user_id})
        
        # Get skills from completed courses
        completed_enrollments = await prisma.enrollment.find_many(
            where={
                "userId": user_id,
                "completedAt": {"not": None}
            },
            include={"module": True}
        )
        
        skill_levels = {}
        
        # Add explicit user skills
        for skill in user_skills:
            skill_levels[skill.name] = skill_levels.get(skill.name, 0) + 30
        
        # Add skills from completed courses
        for enrollment in completed_enrollments:
            if enrollment.module and enrollment.module.skills:
                for skill in enrollment.module.skills:
                    skill_levels[skill] = skill_levels.get(skill, 0) + 20
        
        # Normalize skill levels (0-100)
        if skill_levels:
            max_level = max(skill_levels.values())
            skill_levels = {skill: (level / max_level * 100) for skill, level in skill_levels.items()}
        
        return skill_levels
    
    async def _get_recommendations(self, user_id: int) -> List[Dict[str, Any]]:
        """Get AI-powered recommendations for the user"""
        # This would integrate with your AI service for Algerian context
        recommendations = [
            {
                "type": "course",
                "title": "Data Analysis for Algerian SMEs",
                "description": "Learn to analyze local business data",
                "reason": "Based on your completed Python courses",
                "action_url": "/courses/data-analysis-algerian-smes"
            },
            {
                "type": "project",
                "title": "Sales Dashboard for Local Retailer",
                "description": "Help a local business visualize their sales data",
                "reason": "Matches your BI skills and location",
                "action_url": "/projects/sales-dashboard-retail"
            }
        ]
        
        return recommendations
    
    def _calculate_skill_level(self, user_id: int, enrollments: List, contracts: List) -> str:
        """Calculate overall skill level based on activities"""
        total_activities = len(enrollments) + len(contracts)
        
        if total_activities == 0:
            return "Beginner"
        elif total_activities < 5:
            return "Intermediate"
        elif total_activities < 15:
            return "Advanced"
        else:
            return "Expert"
    
    def _estimate_completion_date(self, progress: float) -> Optional[datetime]:
        """Estimate course completion date based on progress"""
        if progress >= 100:
            return None
        # Simple estimation: complete in 30 days from now if 0% progress
        days_remaining = (100 - progress) / 3.33  # ~3.33% per day
        return datetime.utcnow() + timedelta(days=days_remaining)
    
    def _format_size(self, size_bytes: int) -> str:
        """Format file size in human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"

# Singleton instance
dashboard_service = DashboardService()