from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseEnrollmentViewSet,
    ModuleProgressViewSet,
    LessonProgressViewSet,
    NoteViewSet,
    QuizAttemptViewSet,
    ReviewViewSet,
    BookmarkViewSet,
)

router = DefaultRouter()
router.register(r'enrollments', CourseEnrollmentViewSet, basename='enrollment')
router.register(r'module-progress', ModuleProgressViewSet, basename='module-progress')
router.register(r'lesson-progress', LessonProgressViewSet, basename='lesson-progress')
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'quiz-attempts', QuizAttemptViewSet, basename='quiz-attempt')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')

urlpatterns = [
    path('', include(router.urls)),
]

# ====================================================================
# ДОПОЛНИТЕЛЬНЫЕ ENDPOINTS - ЗАКОММЕНТИРОВАНЫ ДО РЕАЛИЗАЦИИ
# ====================================================================
# Раскомментируйте когда добавите соответствующие методы в ViewSets

# # Custom endpoints - требуют реализации методов в ViewSets
# urlpatterns += [
#     # Требуют реализации в CourseEnrollmentViewSet:
#     # path('dashboard/',
#     #      CourseEnrollmentViewSet.as_view({'get': 'dashboard'}),
#     #      name='learning-dashboard'),
#     # path('progress/overview/',
#     #      CourseEnrollmentViewSet.as_view({'get': 'progress_overview'}),
#     #      name='progress-overview'),
#     # path('progress/course/<int:course_id>/',
#     #      CourseEnrollmentViewSet.as_view({'get': 'course_progress'}),
#     #      name='course-progress-detail'),
#
#     # Требуют реализации в NoteViewSet и BookmarkViewSet:
#     # path('notes/course/<int:course_id>/',
#     #      NoteViewSet.as_view({'get': 'by_course', 'post': 'create'}),
#     #      name='course-notes'),
#     # path('bookmarks/course/<int:course_id>/',
#     #      BookmarkViewSet.as_view({'get': 'by_course'}),
#     #      name='course-bookmarks'),
#
#     # Требуют реализации в QuizAttemptViewSet:
#     # path('quiz-attempts/course/<int:course_id>/',
#     #      QuizAttemptViewSet.as_view({'get': 'by_course'}),
#     #      name='course-quiz-attempts'),
#     # path('quiz-attempts/<int:quiz_id>/latest/',
#     #      QuizAttemptViewSet.as_view({'get': 'latest_attempt'}),
#     #      name='latest-quiz-attempt'),
#
#     # Требуют реализации в ReviewViewSet:
#     # path('reviews/course/<int:course_id>/',
#     #      ReviewViewSet.as_view({'get': 'by_course', 'post': 'create'}),
#     #      name='course-reviews'),
#     # path('reviews/course/<int:course_id>/my/',
#     #      ReviewViewSet.as_view({'get': 'my_review'}),
#     #      name='my-course-review'),
#
#     # Требуют реализации в CourseEnrollmentViewSet:
#     # path('certificates/completed/',
#     #      CourseEnrollmentViewSet.as_view({'get': 'completed_certificates'}),
#     #      name='completed-certificates'),
#     # path('certificates/course/<int:course_id>/generate/',
#     #      CourseEnrollmentViewSet.as_view({'post': 'generate_certificate'}),
#     #      name='generate-certificate'),
#     # path('statistics/learning-summary/',
#     #      CourseEnrollmentViewSet.as_view({'get': 'learning_summary'}),
#     #      name='learning-summary'),
#     # path('statistics/weekly-activity/',
#     #      CourseEnrollmentViewSet.as_view({'get': 'weekly_activity'}),
#     #      name='weekly-activity'),
# ]

# # Bulk operations - требуют реализации методов
# urlpatterns += [
#     # path('bulk/mark-lessons-complete/',
#     #      LessonProgressViewSet.as_view({'post': 'bulk_complete'}),
#     #      name='bulk-lessons-complete'),
#     # path('bulk/add-notes/',
#     #      NoteViewSet.as_view({'post': 'bulk_create'}),
#     #      name='bulk-notes-create'),
# ]
