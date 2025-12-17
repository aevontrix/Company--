import { apiClient } from './client';

export interface Course {
  id: number;
  slug: string;
  title: string;
  description?: string;
  short_description?: string;
  thumbnail?: string;
  instructor_name: string;
  category: number;
  category_name?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_hours: number;
  status: 'draft' | 'published' | 'archived';
  is_free: boolean;
  is_featured: boolean;
  rating: number;
  enrolled_count: number;
  reviews_count: number;
  modules_count: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  courses_count?: number;
}

export interface CourseListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Course[];
}

export const coursesAPI = {
  // Get all courses with pagination
  getCourses: async (params?: {
    page?: number;
    search?: string;
    category?: string;
    level?: string;
    is_free?: boolean;
  }): Promise<CourseListResponse> => {
    return await apiClient.get<CourseListResponse>('/courses/courses/', { params });
  },

  // Get single course by ID
  getCourse: async (id: number): Promise<Course> => {
    return await apiClient.get<Course>(`/courses/courses/${id}/`);
  },

  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    return await apiClient.get<Category[]>('/courses/categories/');
  },

  // Get courses by category
  getCoursesByCategory: async (categoryId: number): Promise<Course[]> => {
    const response = await apiClient.get<CourseListResponse>(`/courses/courses/?category=${categoryId}`);
    return response.results;
  },

  // Enroll in a course
  enrollCourse: async (courseId: number): Promise<any> => {
    return await apiClient.post<any>(`/courses/courses/${courseId}/enroll/`);
  },

  // Get my enrolled courses
  getMyEnrolledCourses: async (): Promise<Course[]> => {
    return await apiClient.get<Course[]>('/learning/my-courses/');
  },
};
