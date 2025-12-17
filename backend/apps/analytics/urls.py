from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LearningStatsViewSet, DailyActivityViewSet, CourseStatsViewSet,
    UserLearningPathViewSet, RecommendationViewSet, AuditLogViewSet,
    UserProgressReportView, AnalyticsDashboardView
)

router = DefaultRouter()
router.register(r'learning-stats', LearningStatsViewSet, basename='learning-stats')
router.register(r'daily-activities', DailyActivityViewSet, basename='daily-activity')
router.register(r'course-stats', CourseStatsViewSet, basename='course-stats')
router.register(r'learning-paths', UserLearningPathViewSet, basename='learning-path')
router.register(r'recommendations', RecommendationViewSet, basename='recommendation')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('dashboard/', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),
    path('progress-report/', UserProgressReportView.as_view(), name='progress-report'),
    path('', include(router.urls)),
]

# ====================================================================
# ПРОДВИНУТЫЕ ENDPOINTS - ЗАКОММЕНТИРОВАНЫ ДО РЕАЛИЗАЦИИ
# ====================================================================
# Эти endpoints будут работать после реализации соответствующих методов
# в ViewSet-ах. Раскомментируйте когда добавите методы в views.py

# # Enhanced analytics endpoints
# urlpatterns += [
#     # Real-time analytics
#     path('realtime/active-users/',
#          AnalyticsDashboardView.as_view(),
#          name='realtime-active-users'),
#     path('realtime/course-activity/',
#          AnalyticsDashboardView.as_view(),
#          name='realtime-course-activity'),
#
#     # Custom reports - требуют реализации методов в ViewSets
#     # path('reports/course-performance/<int:course_id>/',
#     #      CourseStatsViewSet.as_view({'get': 'performance_report'}),
#     #      name='course-performance-report'),
#     # path('reports/user-engagement/',
#     #      LearningStatsViewSet.as_view({'get': 'engagement_report'}),
#     #      name='user-engagement-report'),
#     # path('reports/completion-rates/',
#     #      LearningStatsViewSet.as_view({'get': 'completion_report'}),
#     #      name='completion-rates-report'),
#
#     # Time-based analytics
#     path('trends/weekly/',
#          AnalyticsDashboardView.as_view(),
#          name='weekly-trends'),
#     path('trends/monthly/',
#          AnalyticsDashboardView.as_view(),
#          name='monthly-trends'),
#     path('trends/quarterly/',
#          AnalyticsDashboardView.as_view(),
#          name='quarterly-trends'),
#
#     # User-specific analytics - требуют реализации методов
#     # path('user/<int:user_id>/learning-patterns/',
#     #      LearningStatsViewSet.as_view({'get': 'user_learning_patterns'}),
#     #      name='user-learning-patterns'),
#     # path('user/<int:user_id>/performance/',
#     #      LearningStatsViewSet.as_view({'get': 'user_performance'}),
#     #      name='user-performance'),
#
#     # Export endpoints
#     path('export/csv/',
#          AnalyticsDashboardView.as_view(),
#          name='analytics-export-csv'),
#     path('export/pdf/',
#          AnalyticsDashboardView.as_view(),
#          name='analytics-export-pdf'),
#     path('export/json/',
#          AnalyticsDashboardView.as_view(),
#          name='analytics-export-json'),
# ]

# # Advanced analytics and predictions - требуют реализации методов
# urlpatterns += [
#     # Predictive analytics
#     # path('predictions/dropout-risk/',
#     #      LearningStatsViewSet.as_view({'get': 'dropout_risk_prediction'}),
#     #      name='dropout-risk-prediction'),
#     # path('predictions/completion-forecast/',
#     #      LearningStatsViewSet.as_view({'get': 'completion_forecast'}),
#     #      name='completion-forecast'),
#
#     # A/B Testing and experiments
#     path('experiments/',
#          AnalyticsDashboardView.as_view(),
#          name='analytics-experiments'),
#     path('experiments/results/',
#          AnalyticsDashboardView.as_view(),
#          name='experiment-results'),
#
#     # Cohort analysis - требуют реализации методов
#     # path('cohorts/analysis/',
#     #      LearningStatsViewSet.as_view({'get': 'cohort_analysis'}),
#     #      name='cohort-analysis'),
#     # path('cohorts/retention/',
#     #      LearningStatsViewSet.as_view({'get': 'retention_analysis'}),
#     #      name='retention-analysis'),
#
#     # Custom query builder
#     path('query/builder/',
#          AnalyticsDashboardView.as_view(),
#          name='analytics-query-builder'),
# ]
