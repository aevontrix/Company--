// User types
export interface UserProfile {
  user: number;
  preferred_language: string;
  timezone: string;
  email_notifications: boolean;
  push_notifications: boolean;
  total_courses_completed: number;
  total_learning_time: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  order: number;
  courses_count: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  short_description: string;
  thumbnail?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_hours: number;
  rating: number;
  reviews_count: number;
  enrolled_count: number;
  is_free: boolean;
  is_featured: boolean;
  status: 'draft' | 'published' | 'archived';
  category: Category;
  instructor: User;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
