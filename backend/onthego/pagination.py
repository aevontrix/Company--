"""
Custom pagination classes for ONTHEGO API

Provides flexible pagination with customizable page sizes
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination with 20 items per page

    Query params:
    - page: Page number
    - page_size: Items per page (max 100)

    Response format:
    {
        "count": 150,
        "next": "http://api.example.com?page=3",
        "previous": "http://api.example.com?page=1",
        "results": [...]
    }
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page_size': self.page.paginator.per_page,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'results': data
        })


class LargeResultsSetPagination(PageNumberPagination):
    """
    Pagination for large datasets with 50 items per page

    Use for: analytics, reports, bulk operations
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class SmallResultsSetPagination(PageNumberPagination):
    """
    Pagination for small datasets with 10 items per page

    Use for: detailed views, dashboards
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50
