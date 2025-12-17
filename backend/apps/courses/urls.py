from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    CourseViewSet,
    ModuleViewSet,
    LessonViewSet,
    QuizViewSet,
    QuestionViewSet,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'modules', ModuleViewSet, basename='module')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'questions', QuestionViewSet, basename='question')

urlpatterns = [
    path('', include(router.urls)),
]

# ====================================================================
# ДОПОЛНИТЕЛЬНЫЕ ENDPOINTS - ЗАКОММЕНТИРОВАНЫ ДО РЕАЛИЗАЦИИ
# ====================================================================
# Раскомментируйте когда добавите соответствующие методы в ViewSets

# # Custom endpoints - требуют реализации методов
# urlpatterns += [
#     # CourseViewSet уже имеет метод 'modules' через @action
#     # Используйте: /api/courses/{slug}/modules/ (из router)
#
#     # CourseViewSet уже имеет метод 'enroll' через @action
#     # Используйте: /api/courses/{slug}/enroll/ (из router)
#
#     # Эти методы НЕ реализованы - требуют добавления в CourseViewSet:
#     # path('courses/<int:course_pk>/progress/',
#     #      CourseViewSet.as_view({'get': 'progress'}),
#     #      name='course-progress'),
#
#     # ModuleViewSet уже имеет метод 'lessons' через @action
#     # Используйте: /api/modules/{id}/lessons/ (из router)
#
#     # QuizViewSet уже имеет метод 'questions' через @action
#     # Используйте: /api/quizzes/{id}/questions/ (из router)
#
#     # Этот метод НЕ реализован - требует добавления в QuizViewSet:
#     # path('quizzes/<int:quiz_pk>/submit/',
#     #      QuizViewSet.as_view({'post': 'submit'}),
#     #      name='quiz-submit'),
# ]

# # Search and filtering endpoints - требуют реализации методов в CourseViewSet
# urlpatterns += [
#     # path('courses/search/',
#     #      CourseViewSet.as_view({'get': 'search'}),
#     #      name='course-search'),
#     # path('courses/by-category/<int:category_id>/',
#     #      CourseViewSet.as_view({'get': 'by_category'}),
#     #      name='courses-by-category'),
#     # path('courses/popular/',
#     #      CourseViewSet.as_view({'get': 'popular'}),
#     #      name='popular-courses'),
#     # path('courses/featured/',
#     #      CourseViewSet.as_view({'get': 'featured'}),
#     #      name='featured-courses'),
# ]
