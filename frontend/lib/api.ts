// ============================================================
// DJANGO API INTEGRATION - ONTHEGO BACKEND
// ============================================================

import apiCache from './apiCache';
// ✅ FIX: Use unified token management from utils/auth (removes duplication)
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens
} from './utils/auth';

// Re-export for backwards compatibility
export { getAccessToken, getRefreshToken, setTokens, clearTokens };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// ============================================================
// API REQUEST HELPER
// ============================================================
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired - try to refresh
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/api/users/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.ok) {
          const { access } = await refreshResponse.json();
          setTokens(access, refreshToken);

          // Retry original request
          headers['Authorization'] = `Bearer ${access}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });

          if (!retryResponse.ok) {
            throw new Error(`API Error: ${retryResponse.statusText}`);
          }

          return retryResponse.json();
        } else {
          clearTokens();
          throw new Error('Session expired. Please login again.');
        }
      } catch (error) {
        clearTokens();
        throw error;
      }
    } else {
      clearTokens();
      throw new Error('Unauthorized. Please login.');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || errorData.message || 'API Request failed');
  }

  return response.json();
}

// ============================================================
// AUTH API
// ============================================================
export interface RegisterData {
  email: string;
  password: string;
  password_confirm?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  country?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  country?: string;
  avatar?: string;
  bio?: string;
  xp: number;
  level: number;
  streak: number;
  badges: any[];
  enrolled_courses: number[];
  completed_courses: number[];
  achievements: any[];
}

export const authAPI = {
  register: async (data: RegisterData) => {
    return apiRequest<{ user: UserProfile; access: string; refresh: string }>(
      '/api/users/register/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  login: async (data: LoginData) => {
    return apiRequest<{ access: string; refresh: string }>(
      '/api/users/login/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiRequest('/api/users/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken }),
      });
    }
    clearTokens();
    // Clear all cache on logout
    apiCache.clearAll();
  },

  getCurrentUser: async () => {
    // Cache current user for 1 minute
    return apiCache.cached(
      'user:current',
      () => apiRequest<UserProfile>('/api/users/me/'),
      1 * 60 * 1000
    );
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const result = await apiRequest<UserProfile>('/api/users/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    // Clear user cache after profile update
    apiCache.clear('user:current');
    return result;
  },

  getAllUsers: async () => {
    // Cache all users for 5 minutes
    return apiCache.cached(
      'users:all',
      () => apiRequest<{ results: Array<{ id: number; first_name: string; last_name: string; email: string; avatar?: string; xp: number; level: number }> }>('/api/users/all/'),
      5 * 60 * 1000
    );
  },

  getUserProfile: async (userId: number) => {
    // Cache individual user profile for 3 minutes
    return apiCache.cached(
      `user:${userId}`,
      () => apiRequest<UserProfile>(`/api/users/${userId}/`),
      3 * 60 * 1000
    );
  },
};

// ============================================================
// COURSES API
// ============================================================
export interface Course {
  id: number;
  slug: string;
  title: string;
  description?: string;  // Full description
  short_description: string;
  thumbnail: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_hours: number;
  rating: string;
  reviews_count: number;
  enrolled_count: number;
  is_free: boolean;
  is_featured: boolean;
  is_enrolled?: boolean;  // User enrollment status
  status: string;
  category: number;
  category_name: string;
  instructor_name: string;
  modules_count: number;
  learning_outcomes?: string;  // What you'll learn
  prerequisites?: string;  // Requirements
  target_audience?: string;  // Who this is for
  created_at: string;
}

// Course structure types
export interface LessonStructure {
  id: number;
  title: string;
  content_type: string;
  duration_minutes: number;
  order: number;
  is_published: boolean;
  is_free_preview: boolean;
  video_url: string | null;
}

export interface ModuleStructure {
  id: number;
  title: string;
  description: string;
  order: number;
  duration_minutes: number;
  is_published: boolean;
  lessons: LessonStructure[];
}

export interface CourseStructure {
  course_id: number;
  course_slug: string;
  course_title: string;
  modules: ModuleStructure[];
  total_modules: number;
  total_lessons: number;
}

export const coursesAPI = {
  getAllCourses: async () => {
    // Cache courses list for 3 minutes for performance
    return apiCache.cached(
      'courses:all',
      () => apiRequest<{ results: Course[] }>('/api/courses/courses/'),
      3 * 60 * 1000
    );
  },

  getCourseBySlug: async (slug: string) => {
    // Cache individual course for 5 minutes
    return apiCache.cached(
      `course:${slug}`,
      () => apiRequest<Course>(`/api/courses/courses/${slug}/`),
      5 * 60 * 1000
    );
  },

  getCourseStructure: async (slug: string) => {
    // Cache course structure for 5 minutes
    return apiCache.cached(
      `course-structure:${slug}`,
      () => apiRequest<CourseStructure>(`/api/courses/courses/${slug}/structure/`),
      5 * 60 * 1000
    );
  },

  enrollInCourse: async (slug: string) => {
    const result = await apiRequest(`/api/courses/courses/${slug}/enroll/`, {
      method: 'POST',
    });
    // Clear enrolled courses cache after enrollment
    apiCache.clear('courses:enrolled');
    return result;
  },

  getEnrolledCourses: async () => {
    // Cache enrolled courses for 2 minutes
    return apiCache.cached(
      'courses:enrolled',
      () => apiRequest<{ results: Course[] }>('/api/courses/courses/?enrolled=true'),
      2 * 60 * 1000
    );
  },
};

// ============================================================
// LESSONS API
// ============================================================
export interface LessonDetail {
  id: number;
  module: number;
  title: string;
  content: string;
  content_type: 'video' | 'text' | 'quiz' | 'code';
  video_url: string | null;
  audio_url: string | null;
  attachments: any;
  resources: any;
  duration_minutes: number;
  order: number;
  is_published: boolean;
  is_free_preview: boolean;
  created_at: string;
  updated_at: string;
  quiz?: any;
}

export const lessonsAPI = {
  getLesson: async (lessonId: number) => {
    // Cache lesson data for 5 minutes
    return apiCache.cached(
      `lesson:${lessonId}`,
      () => apiRequest<LessonDetail>(`/api/courses/lessons/${lessonId}/`),
      5 * 60 * 1000
    );
  },

  getLessonQuiz: async (lessonId: number) => {
    // Cache quiz data for 10 minutes
    return apiCache.cached(
      `lesson-quiz:${lessonId}`,
      () => apiRequest(`/api/courses/lessons/${lessonId}/quiz/`),
      10 * 60 * 1000
    );
  },
};

// ============================================================
// QUIZ API
// ============================================================
export interface QuizSubmitAnswer {
  question_id: number;
  selected_answer: string;
}

export interface QuizSubmitResponse {
  score: number;
  total: number;
  percentage: number;
  xp_awarded: number;
  passed: boolean;
  results: Array<{
    question_id: number;
    question_text: string;
    selected_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
  }>;
}

export const quizzesAPI = {
  submitQuiz: async (quizId: number, answers: QuizSubmitAnswer[]) => {
    return apiRequest<QuizSubmitResponse>(`/api/courses/quizzes/${quizId}/submit/`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },
};

// ============================================================
// LEARNING API
// ============================================================
export interface EnrolledCourse {
  id: string;
  course_id: number;
  course_title: string;
  course_slug: string;
  course_thumbnail: string;
  progress_percentage: number;
  status: string;
  enrolled_at: string;
  last_accessed: string;
}

export const learningAPI = {
  getProgress: async (courseSlug: string) => {
    // Cache progress for 1 minute (frequently updated)
    return apiCache.cached(
      `progress:${courseSlug}`,
      () => apiRequest(`/api/learning/progress/?course=${courseSlug}`),
      1 * 60 * 1000
    );
  },

  updateLessonProgress: async (lessonId: number, completed: boolean) => {
    const result = await apiRequest('/api/learning/lesson-progress/', {
      method: 'POST',
      body: JSON.stringify({ lesson_id: lessonId, completed }),
    });
    // Clear related caches
    apiCache.clear(`lesson-progress:${lessonId}`);
    return result;
  },

  // Mark lesson as completed and award XP
  markLessonCompleted: async (lessonProgressId: number) => {
    const result = await apiRequest(`/api/learning/lesson-progress/${lessonProgressId}/mark_completed/`, {
      method: 'POST',
    });
    // Clear user stats cache when XP is awarded
    apiCache.clear('user:stats');
    apiCache.clear('gamification:stats');
    return result;
  },

  // Get or create lesson progress for a lesson
  getLessonProgress: async (lessonId: number) => {
    return apiRequest(`/api/learning/lesson-progress/?lesson=${lessonId}`);
  },

  getEnrollments: async () => {
    // Cache enrollments for 2 minutes
    return apiCache.cached(
      'learning:enrollments',
      () => apiRequest<EnrolledCourse[]>('/api/learning/enrollments/'),
      2 * 60 * 1000
    );
  },

  // Get last accessed lesson for Continue Learning feature
  getLastLesson: async (enrollmentId: string) => {
    return apiRequest(`/api/learning/enrollments/${enrollmentId}/last_lesson/`);
  },

  getWeeklyStats: async () => {
    // Cache weekly stats for 5 minutes
    return apiCache.cached(
      'user:weekly-stats',
      () => apiRequest<{ weekly_xp: number; weekly_hours: number }>('/api/users/me/weekly-stats/'),
      5 * 60 * 1000
    );
  },

  // Update lesson time spent
  updateLessonTime: async (lessonProgressId: number, timeSpent: number) => {
    return apiRequest(`/api/learning/lesson-progress/${lessonProgressId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ time_spent: timeSpent }),
    });
  },

  // Update lesson score/rating
  updateLessonScore: async (lessonProgressId: number, score: number) => {
    return apiRequest(`/api/learning/lesson-progress/${lessonProgressId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ score }),
    });
  },
};

// ============================================================
// MESSAGING API
// ============================================================
export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  last_message?: {
    id: string;
    content: string;
    created_at: string;
    sender: {
      id: number;
      first_name: string;
      last_name: string;
    };
  };
  members_count: number;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat: string;
  sender: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  type: 'text' | 'image' | 'file' | 'system';
  content: string;
  file_url?: string;
  file_name?: string;
  is_edited: boolean;
  created_at: string;
  is_own: boolean;
}

export const messagingAPI = {
  // Get all chats for current user
  getChats: async () => {
    return apiRequest<{ results: Chat[] }>('/api/messaging/chats/');
  },

  // Get messages for a specific chat
  getMessages: async (chatId: string) => {
    return apiRequest<{ results: Message[] }>(`/api/messaging/messages/?chat_id=${chatId}`);
  },

  // Send a message
  sendMessage: async (chatId: string, content: string, type: 'text' | 'image' | 'file' = 'text') => {
    return apiRequest<Message>('/api/messaging/messages/', {
      method: 'POST',
      body: JSON.stringify({ chat: chatId, content, type }),
    });
  },

  // Edit a message
  editMessage: async (messageId: string, content: string) => {
    return apiRequest<Message>(`/api/messaging/messages/${messageId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },

  // Delete a message
  deleteMessage: async (messageId: string) => {
    return apiRequest(`/api/messaging/messages/${messageId}/`, {
      method: 'DELETE',
    });
  },

  // Create direct chat with a user
  createDirectChat: async (userId: number) => {
    return apiRequest<Chat>('/api/messaging/chats/create_direct/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  // Create group chat
  createGroupChat: async (name: string, memberIds: number[], avatar?: string) => {
    return apiRequest<Chat>('/api/messaging/chats/create_group/', {
      method: 'POST',
      body: JSON.stringify({ name, member_ids: memberIds, avatar }),
    });
  },

  // Mark chat as read
  markAsRead: async (chatId: string) => {
    // ✅ Fix: Backend action is mark_as_read, not mark_read
    return apiRequest(`/api/messaging/chats/${chatId}/mark_as_read/`, {
      method: 'POST',
    });
  },
};

// ============================================================
// FRIENDS API
// ============================================================
export interface Friend {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
  xp: number;
  level: number;
}

export interface FriendRequest {
  id: string;
  from_user: Friend;
  to_user: Friend;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export const friendsAPI = {
  // Get list of friends
  getFriends: async () => {
    // Cache friends list for 2 minutes
    return apiCache.cached(
      'friends:list',
      () => apiRequest<{ results: Friend[] }>('/api/users/friends/friends/'),
      2 * 60 * 1000
    );
  },

  // Get pending friend requests (incoming)
  getPendingRequests: async () => {
    // Cache pending requests for 1 minute
    return apiCache.cached(
      'friends:pending',
      () => apiRequest<{ results: FriendRequest[] }>('/api/users/friends/pending_requests/'),
      1 * 60 * 1000
    );
  },

  // Get sent friend requests (outgoing)
  getSentRequests: async () => {
    // Cache sent requests for 1 minute
    return apiCache.cached(
      'friends:sent',
      () => apiRequest<{ results: FriendRequest[] }>('/api/users/friends/sent_requests/'),
      1 * 60 * 1000
    );
  },

  // Send friend request
  sendFriendRequest: async (userId: number) => {
    const result = await apiRequest<FriendRequest>('/api/users/friends/send_request/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
    // Clear sent requests cache
    apiCache.clear('friends:sent');
    return result;
  },

  // Accept friend request
  acceptFriendRequest: async (requestId: string) => {
    const result = await apiRequest<FriendRequest>(`/api/users/friends/${requestId}/accept/`, {
      method: 'POST',
    });
    // Clear friends and pending requests cache
    apiCache.clear('friends:list');
    apiCache.clear('friends:pending');
    return result;
  },

  // Reject friend request
  rejectFriendRequest: async (requestId: string) => {
    const result = await apiRequest<FriendRequest>(`/api/users/friends/${requestId}/reject/`, {
      method: 'POST',
    });
    // Clear pending requests cache
    apiCache.clear('friends:pending');
    return result;
  },

  // Remove friend
  removeFriend: async (friendshipId: string) => {
    const result = await apiRequest(`/api/users/friends/${friendshipId}/remove_friend/`, {
      method: 'DELETE',
    });
    // Clear friends list cache
    apiCache.clear('friends:list');
    return result;
  },
};

// ============================================================
// GAMIFICATION API
// ============================================================
export interface GamificationStats {
  xp: number;
  level: number;
  streak: number;
  badges: Array<{
    id: string;
    name: string;
    emoji: string;
    unlocked_at: string;
  }>;
  achievements: any[];
  progress: {
    current: number;
    needed: number;
    percentage: number;
  };
  next_level_xp: number;
}

export interface StreakUpdate {
  streak_continued: boolean;
  streak_broken: boolean;
  streak_count: number;
  bonus_xp: number;
  already_counted: boolean;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  xp: number;
  level: number;
  avatar?: string;
}

// ============================================================
// ANALYTICS API
// ============================================================
export interface DailyActivity {
  date: string;
  time_spent: number;
  lessons_completed: number;
  quizzes_taken: number;
  xp_earned: number;
}

export const analyticsAPI = {
  getWeeklyActivity: async () => {
    return apiCache.cached(
      'analytics:weekly',
      () => apiRequest<DailyActivity[]>('/api/analytics/daily-activity/week/'),
      2 * 60 * 1000
    );
  },
};

// ============================================================
// GAMIFICATION API
// ============================================================
export const gamificationAPI = {
  getStats: async () => {
    // Cache gamification stats for 1 minute
    return apiCache.cached(
      'gamification:stats',
      () => apiRequest<GamificationStats>('/api/gamification/stats/'),
      1 * 60 * 1000
    );
  },

  getUserStats: async () => {
    // Cache user stats for 1 minute
    return apiCache.cached(
      'user:stats',
      () => apiRequest('/api/gamification/stats/'),
      1 * 60 * 1000
    );
  },

  updateStreak: async () => {
    const result = await apiRequest<StreakUpdate>('/api/gamification/streak/', {
      method: 'POST',
    });
    // Clear stats cache after streak update
    apiCache.clear('gamification:stats');
    apiCache.clear('user:stats');
    return result;
  },

  getLeaderboard: async (params?: { limit?: number; period?: 'all_time' | 'weekly' | 'monthly' }) => {
    const limit = params?.limit || 10;
    const period = params?.period || 'all_time';
    // Cache leaderboard for 2 minutes
    return apiCache.cached(
      `leaderboard:${period}:${limit}`,
      () => apiRequest<{ results: LeaderboardEntry[] }>(
        `/api/gamification/leaderboard/?limit=${limit}&period=${period}`
      ),
      2 * 60 * 1000
    );
  },

  awardXP: async (action: string, amount?: number) => {
    const result = await apiRequest('/api/gamification/award/', {
      method: 'POST',
      body: JSON.stringify({ action, amount }),
    });
    // Clear stats and leaderboard cache after XP award
    apiCache.clear('gamification:stats');
    apiCache.clear('user:stats');
    return result;
  },
};

// ============================================================
// DEFAULT EXPORT
// ============================================================
export default {
  auth: authAPI,
  courses: coursesAPI,
  learning: learningAPI,
  messaging: messagingAPI,
  friends: friendsAPI,
  gamification: gamificationAPI,
  analytics: analyticsAPI,
};

// Export apiCache for cache management
export { apiCache };
