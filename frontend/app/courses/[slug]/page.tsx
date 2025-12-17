'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { coursesAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToastStore } from '@/lib/store/toastStore';
import {
  BookOpen,
  Clock,
  Users,
  Star,
  Award,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  HelpCircle,
  Rocket,
  Lock,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'project' | 'reading';
  isCompleted: boolean;
  isLocked: boolean;
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
  isExpanded: boolean;
}

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  instructor: {
    name: string;
    avatar: string;
    title: string;
  };
  thumbnail: string;
  category: string;
  level: string;
  duration: string;
  lessonsCount: number;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  isFree: boolean;
  hasCertificate: boolean;
  isEnrolled: boolean;
  progress: number;
  skills: string[];
  requirements: string[];
  sections: Section[];
}

const LessonTypeIcon = ({ type, isLocked, isCompleted }: { type: string; isLocked: boolean; isCompleted: boolean }) => {
  if (isLocked) return <Lock size={18} className="text-text-secondary" />;
  if (isCompleted) return <CheckCircle size={18} className="text-green-400" />;

  const icons = {
    video: <Play size={18} className="text-primary" />,
    quiz: <HelpCircle size={18} className="text-yellow-400" />,
    project: <Rocket size={18} className="text-secondary" />,
    reading: <FileText size={18} className="text-blue-400" />,
  };

  return icons[type as keyof typeof icons] || <FileText size={18} />;
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToastStore();
  const slug = params.slug as string;
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);

  // Load course data from API
  useEffect(() => {
    const loadCourse = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);
        setSectionsLoaded(false);
        const courseData = await coursesAPI.getCourseBySlug(slug);

        setCourse({
          id: courseData.id.toString(),
          slug: courseData.slug,
          title: courseData.title,
          subtitle: courseData.short_description || '',
          description: courseData.description || courseData.short_description || 'No description available',
          instructor: {
            name: courseData.instructor_name || 'Unknown Instructor',
            avatar: '👨‍🏫',
            title: 'Course Instructor',
          },
          thumbnail: courseData.thumbnail || '📚',
          category: courseData.category_name || 'General',
          level: courseData.difficulty || 'beginner',
          duration: `${courseData.duration_hours || 0}h`,
          lessonsCount: courseData.modules_count || 0,
          studentsCount: courseData.enrolled_count || 0,
          rating: parseFloat(courseData.rating || '0'),
          reviewsCount: courseData.reviews_count || 0,
          isFree: courseData.is_free,
          hasCertificate: true,
          isEnrolled: courseData.is_enrolled || false,
          progress: 0,
          skills: courseData.learning_outcomes
            ? courseData.learning_outcomes.split('\n').filter(s => s.trim()).map(s => s.trim())
            : [],
          requirements: courseData.prerequisites
            ? courseData.prerequisites.split('\n').filter(s => s.trim()).map(s => s.trim())
            : [],
          sections: [],
        });
      } catch (err: any) {
        console.error('Failed to load course:', err);
        setError(err?.message || 'Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [slug]);

  // Load course structure
  useEffect(() => {
    const loadStructure = async () => {
      if (!slug || !course || sectionsLoaded) return;

      try {
        const structure = await coursesAPI.getCourseStructure(slug);

        const sectionsData = structure.modules.map((module: any) => ({
          id: module.id.toString(),
          title: module.title,
          lessons: module.lessons.map((lesson: any) => {
            // Map backend content_type to frontend type
            let lessonType: 'video' | 'quiz' | 'reading' | 'project' = 'reading';
            if (lesson.content_type === 'text') lessonType = 'reading';
            else if (lesson.content_type === 'video') lessonType = 'video';
            else if (lesson.content_type === 'quiz') lessonType = 'quiz';
            else if (lesson.content_type === 'project') lessonType = 'project';

            return {
              id: lesson.id.toString(),
              title: lesson.title,
              duration: `${lesson.duration_minutes || 0} мин`,
              isCompleted: false,
              isLocked: !lesson.is_free_preview && !user,
              type: lessonType,
            };
          }),
          isExpanded: false,
        }));

        setCourse(prev => prev ? {
          ...prev,
          sections: sectionsData,
          lessonsCount: structure.total_lessons,
        } : null);
        setSectionsLoaded(true);
      } catch (err) {
        console.error('Failed to load course structure:', err);
      }
    };

    if (!loading && !error && course && !sectionsLoaded) {
      loadStructure();
    }
  }, [slug, loading, error, course, user, sectionsLoaded]);

  const handleToggleSection = (sectionId: string) => {
    if (!course) return;
    setCourse({
      ...course,
      sections: course.sections.map(s =>
        s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
      ),
    });
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (enrolling || !course) return;

    try {
      setEnrolling(true);

      if (!course.isEnrolled) {
        await coursesAPI.enrollInCourse(course.slug);
        setCourse({ ...course, isEnrolled: true, progress: 0 });
        addToast({
          type: 'success',
          title: 'Успешная запись!',
          message: 'Вы успешно записались на курс! +50 XP',
          duration: 5000,
        });
      } else {
        router.push(`/courses/${course.slug}/${course.sections[0]?.lessons[0]?.id || '1-1'}`);
      }
    } catch (error: any) {
      console.error('Failed to enroll:', error);
      addToast({
        type: 'error',
        title: 'Ошибка записи',
        message: `Не удалось записаться на курс: ${error?.message || 'Неизвестная ошибка'}`,
        duration: 7000,
      });
    } finally {
      setEnrolling(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto mb-4 text-primary animate-pulse" size={48} />
          <p className="text-text-secondary">Загрузка курса...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-3">Курс не найден</h1>
          <p className="text-text-secondary mb-6">{error || 'Курс не существует или был удален'}</p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary/20 border border-primary/40 rounded-xl hover:bg-primary/30 transition-all"
          >
            <ArrowLeft size={20} />
            Назад к курсам
          </Link>
        </div>
      </div>
    );
  }

  const levelColors = {
    beginner: 'text-green-400 bg-green-500/20 border-green-500/40',
    intermediate: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40',
    advanced: 'text-red-400 bg-red-500/20 border-red-500/40',
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/courses" className="text-primary hover:text-secondary transition-colors inline-flex items-center gap-2">
          <ArrowLeft size={18} />
          Назад к курсам
        </Link>
        <span className="text-text-secondary mx-2">/</span>
        <span className="text-text-secondary">{course.category}</span>
      </div>

      {/* Hero Section */}
      <div className="cyber-card p-8 mb-8 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="grid lg:grid-cols-[1fr_350px] gap-8">
          {/* Left: Course Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">{course.thumbnail}</span>
              <div>
                <h1 className="text-4xl font-bold font-display mb-2">{course.title}</h1>
                {course.subtitle && <p className="text-lg text-text-secondary">{course.subtitle}</p>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-1 text-yellow-400">
                <Star size={18} className="fill-yellow-400" />
                <span className="font-bold">{course.rating.toFixed(1)}</span>
                <span className="text-text-secondary text-sm">({course.reviewsCount} отзывов)</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <Users size={18} />
                <span>{course.studentsCount.toLocaleString()} студентов</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <Clock size={18} />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <BookOpen size={18} />
                <span>{course.lessonsCount} уроков</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${levelColors[course.level as keyof typeof levelColors] || levelColors.beginner}`}>
                {course.level === 'beginner' ? 'Начальный' : course.level === 'intermediate' ? 'Средний' : 'Продвинутый'}
              </span>
              {course.isFree && (
                <span className="px-3 py-1 rounded-lg text-sm font-medium bg-green-500/20 border border-green-500/40 text-green-400">
                  Бесплатно
                </span>
              )}
              {course.hasCertificate && (
                <span className="px-3 py-1 rounded-lg text-sm font-medium bg-primary/20 border border-primary/40 text-primary flex items-center gap-1">
                  <Award size={16} />
                  Сертификат
                </span>
              )}
            </div>

            <p className="text-text-secondary leading-relaxed">{course.description}</p>
          </div>

          {/* Right: Enroll Card */}
          <div className="cyber-card p-6">
            <button
              type="button"
              onClick={handleEnroll}
              disabled={enrolling}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all mb-4 ${
                course.isEnrolled
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                  : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'
              }`}
            >
              {enrolling ? 'Загрузка...' : course.isEnrolled ? '✓ Продолжить обучение' : '🚀 Записаться на курс'}
            </button>

            {course.isEnrolled && course.progress > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-secondary">Прогресс</span>
                  <span className="text-primary font-bold">{course.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${course.progress}%` }} />
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Users size={16} />
                <span>{course.studentsCount.toLocaleString()} студентов уже записались</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock size={16} />
                <span>Доступ навсегда</span>
              </div>
              {course.hasCertificate && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Award size={16} />
                  <span>Сертификат по окончании</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* What You'll Learn */}
          {course.skills.length > 0 && (
            <div className="cyber-card p-6">
              <h2 className="text-2xl font-bold font-display mb-4">Чему вы научитесь</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {course.skills.map((skill, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-text-secondary">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course Content */}
          {course.sections.length > 0 && (
            <div className="cyber-card p-6">
              <h2 className="text-2xl font-bold font-display mb-4">Содержание курса</h2>
              <div className="space-y-3">
                {course.sections.map((section) => (
                  <div key={section.id} className="border border-white/10 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleToggleSection(section.id)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
                    >
                      {section.isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <span className="flex-1 text-left font-medium">{section.title}</span>
                      <span className="text-sm text-text-secondary">
                        {section.lessons.length} {section.lessons.length === 1 ? 'урок' : 'уроков'}
                      </span>
                    </button>

                    {section.isExpanded && (
                      <div className="border-t border-white/10">
                        {section.lessons.map((lesson) => (
                          <Link
                            key={lesson.id}
                            href={lesson.isLocked ? '#' : `/courses/${course.slug}/${lesson.id}`}
                            className={`flex items-center gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                              lesson.isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                            }`}
                            onClick={(e) => lesson.isLocked && e.preventDefault()}
                          >
                            <LessonTypeIcon type={lesson.type} isLocked={lesson.isLocked} isCompleted={lesson.isCompleted} />
                            <span className={`flex-1 ${lesson.isCompleted ? 'line-through text-text-secondary' : ''}`}>
                              {lesson.title}
                            </span>
                            <span className="text-sm text-text-secondary">{lesson.duration}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Instructor */}
          <div className="cyber-card p-6">
            <h3 className="text-xl font-bold mb-4">Преподаватель</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl">
                {course.instructor.avatar}
              </div>
              <div>
                <div className="font-bold">{course.instructor.name}</div>
                <div className="text-sm text-text-secondary">{course.instructor.title}</div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {course.requirements.length > 0 && (
            <div className="cyber-card p-6">
              <h3 className="text-xl font-bold mb-4">Требования</h3>
              <ul className="space-y-2">
                {course.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-text-secondary">
                    <span className="text-primary mt-1">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
