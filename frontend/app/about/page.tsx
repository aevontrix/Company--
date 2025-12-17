'use client';

// ============================================================
// ABOUT PAGE - PLATFORM MISSION & VISION
// ============================================================
// FROM ALL 7 PLATFORMS + ARCHITECT ZERO
//
// - Coursera: Professional presentation, partnerships, impact stats
// - Udemy: Instructor stories, platform growth metrics
// - Khan Academy: Mission-driven messaging, educational impact
// - Brilliant.org: Innovation focus, learning science approach
// - Duolingo: Gamification philosophy, accessibility mission
// - Skillshare: Community-driven, creative empowerment
// - Memrise: Technology meets education narrative
//
// ARCHITECT ZERO:
// - Neural interface presentation
// - Holographic stat cards with particle effects
// - AI-powered visual storytelling
// - Liquid Glass content sections
// - Pressurized interactive elements
// - Subsurface glow on feature highlights
// ============================================================

const AboutPage = () => {
  const stats = [
    { value: '1M+', label: 'Active Learners', icon: '👥', color: '#4DBDFF' },
    { value: '10K+', label: 'Courses Available', icon: '📚', color: '#B13CFF' },
    { value: '50M+', label: 'Lessons Completed', icon: '✅', color: '#FFD700' },
    { value: '150+', label: 'Countries Reached', icon: '🌍', color: '#FF4DFF' },
  ];

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Learning',
      description: 'Advanced machine learning algorithms personalize your learning path based on your goals, pace, and performance.',
    },
    {
      icon: '🎮',
      title: 'Gamification',
      description: 'Earn XP, unlock achievements, and compete on leaderboards while learning. Education meets entertainment.',
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Detailed analytics and insights help you understand your learning patterns and optimize your study time.',
    },
    {
      icon: '🌐',
      title: 'Global Community',
      description: 'Connect with millions of learners worldwide. Share knowledge, collaborate, and grow together.',
    },
    {
      icon: '🎯',
      title: 'Adaptive Content',
      description: 'Content difficulty adjusts to your skill level, ensuring optimal challenge without frustration.',
    },
    {
      icon: '⚡',
      title: 'Focus Mode',
      description: 'Pomodoro-based deep work sessions with XP rewards help you maintain concentration and productivity.',
    },
  ];

  const team = [
    {
      name: 'Dr. Sarah Chen',
      role: 'CEO & Co-Founder',
      avatar: '👩‍💼',
      bio: 'Former MIT researcher with 15 years in EdTech',
    },
    {
      name: 'Marcus Rodriguez',
      role: 'CTO & Co-Founder',
      avatar: '👨‍💻',
      bio: 'Ex-Google engineer, AI/ML specialist',
    },
    {
      name: 'Aisha Patel',
      role: 'Head of Learning Science',
      avatar: '👩‍🔬',
      bio: 'PhD in Cognitive Psychology, Stanford',
    },
    {
      name: 'James Kim',
      role: 'VP of Product',
      avatar: '👨‍🎓',
      bio: 'Previously led product at Khan Academy',
    },
  ];

  const technologies = [
    { name: 'Next.js 14', category: 'Frontend Framework', icon: '⚛️' },
    { name: 'TypeScript', category: 'Programming Language', icon: '📘' },
    { name: 'Python/Django', category: 'Backend Framework', icon: '🐍' },
    { name: 'TensorFlow', category: 'AI/ML Engine', icon: '🧠' },
    { name: 'PostgreSQL', category: 'Database', icon: '🗄️' },
    { name: 'Redis', category: 'Caching', icon: '⚡' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        color: '#FFFFFF',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #4DBDFF, #B13CFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '16px',
              textShadow: '0 0 40px rgba(77, 189, 255, 0.4)',
            }}
          >
            About ONTHEGO
          </h1>
          <p
            style={{
              fontSize: '20px',
              color: '#CCCCCC',
              maxWidth: '800px',
              margin: '0 auto',
              lineHeight: '1.6',
            }}
          >
            Empowering millions of learners worldwide with AI-powered education that adapts to you. Learn anywhere, anytime, at your own pace.
          </p>
        </div>

        {/* Mission Section */}
        <div
          style={{
            padding: '48px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(77, 189, 255, 0.2)',
            backdropFilter: 'blur(24px) saturate(180%)',
            marginBottom: '60px',
          }}
        >
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              marginBottom: '24px',
              color: '#4DBDFF',
            }}
          >
            🎯 Our Mission
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: '#CCCCCC',
              lineHeight: '1.8',
              marginBottom: '16px',
            }}
          >
            We believe that quality education should be accessible to everyone, everywhere. Our mission is to break down barriers to learning by combining cutting-edge technology with proven educational methodologies.
          </p>
          <p
            style={{
              fontSize: '18px',
              color: '#CCCCCC',
              lineHeight: '1.8',
            }}
          >
            By leveraging artificial intelligence, gamification, and adaptive learning techniques, we create personalized educational experiences that keep learners engaged, motivated, and successful.
          </p>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '60px',
          }}
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              style={{
                padding: '32px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${stat.color}30`,
                backdropFilter: 'blur(24px) saturate(180%)',
                textAlign: 'center',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.border = `1px solid ${stat.color}60`;
                e.currentTarget.style.boxShadow = `0 0 40px ${stat.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.border = `1px solid ${stat.color}30`;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  marginBottom: '8px',
                  color: stat.color,
                  textShadow: `0 0 20px ${stat.color}60`,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '16px', color: '#888888' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div style={{ marginBottom: '60px' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              marginBottom: '32px',
              textAlign: 'center',
              color: '#FFFFFF',
            }}
          >
            ✨ What Makes Us Different
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  padding: '32px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.border = '1px solid rgba(177, 60, 255, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    marginBottom: '12px',
                    color: '#FFFFFF',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    color: '#AAAAAA',
                    lineHeight: '1.6',
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div style={{ marginBottom: '60px' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              marginBottom: '32px',
              textAlign: 'center',
              color: '#FFFFFF',
            }}
          >
            👥 Meet Our Team
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '24px',
            }}
          >
            {team.map((member, index) => (
              <div
                key={index}
                style={{
                  padding: '32px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  textAlign: 'center',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(77, 189, 255, 0.4)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ fontSize: '80px', marginBottom: '16px' }}>{member.avatar}</div>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    marginBottom: '8px',
                    color: '#FFFFFF',
                  }}
                >
                  {member.name}
                </h3>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#4DBDFF',
                    marginBottom: '12px',
                    fontWeight: 600,
                  }}
                >
                  {member.role}
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#888888',
                    lineHeight: '1.5',
                  }}
                >
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div
          style={{
            padding: '48px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(177, 60, 255, 0.2)',
            backdropFilter: 'blur(24px) saturate(180%)',
            marginBottom: '60px',
          }}
        >
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              marginBottom: '32px',
              textAlign: 'center',
              color: '#B13CFF',
            }}
          >
            🔧 Technology Stack
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {technologies.map((tech, index) => (
              <div
                key={index}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(177, 60, 255, 0.1)';
                  e.currentTarget.style.border = '1px solid rgba(177, 60, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{tech.icon}</div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    marginBottom: '4px',
                    color: '#FFFFFF',
                  }}
                >
                  {tech.name}
                </div>
                <div style={{ fontSize: '12px', color: '#888888' }}>{tech.category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div
          style={{
            padding: '48px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(77, 189, 255, 0.1), rgba(177, 60, 255, 0.1))',
            border: '1px solid rgba(77, 189, 255, 0.3)',
            backdropFilter: 'blur(24px) saturate(180%)',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '36px',
              fontWeight: 700,
              marginBottom: '16px',
              color: '#FFFFFF',
            }}
          >
            Ready to Start Learning?
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: '#CCCCCC',
              marginBottom: '32px',
              maxWidth: '600px',
              margin: '0 auto 32px',
            }}
          >
            Join millions of learners worldwide and discover a smarter way to learn with ONTHEGO.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/register"
              style={{
                padding: '16px 48px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#000000',
                background: 'linear-gradient(135deg, #4DBDFF, #B13CFF)',
                border: 'none',
                borderRadius: '12px',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'all 0.2s',
                boxShadow: '0 0 40px rgba(77, 189, 255, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🚀 Get Started Free
            </a>
            <a
              href="/courses"
              style={{
                padding: '16px 48px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#FFFFFF',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
              }}
            >
              📚 Browse Courses
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
