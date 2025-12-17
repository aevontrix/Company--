'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// ============================================================
// LOGIN PAGE - NEURAL ACCESS TERMINAL
// ============================================================
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) newErrors.email = 'Введите email';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Некорректный email';
    if (!formData.password) newErrors.password = 'Введите пароль';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await login(formData.email, formData.password);
      router.push('/dashboard');
    } catch (error: any) {
      setErrors({ submit: error.message || 'Ошибка входа' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #05040F 0%, #0A0814 50%, #05040F 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(77, 189, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(77, 189, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.3,
        }}
      />

      {/* Glowing Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '15%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(77, 189, 255, 0.25) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '15%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(177, 60, 255, 0.25) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
        }}
      />

      {/* Login Form Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '450px',
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(77, 189, 255, 0.2)',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 0 60px rgba(77, 189, 255, 0.1)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              fontSize: '36px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #4DBDFF, #B13CFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
            }}
          >
            ONTHEGO
          </div>
          <div
            style={{
              fontSize: '16px',
              color: '#888888',
              fontWeight: 400,
            }}
          >
            Войдите в свой аккаунт
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#FFFFFF',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${errors.email ? '#FF4D4D' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#4DBDFF';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(77, 189, 255, 0.2)';
              }}
              onBlur={(e) => {
                if (!errors.email) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            />
            {errors.email && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#FF4D4D' }}>
                {errors.email}
              </div>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#FFFFFF',
              }}
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${errors.password ? '#FF4D4D' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#4DBDFF';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(77, 189, 255, 0.2)';
              }}
              onBlur={(e) => {
                if (!errors.password) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            />
            {errors.password && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#FF4D4D' }}>
                {errors.password}
              </div>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                background: 'rgba(255, 77, 77, 0.1)',
                border: '1px solid rgba(255, 77, 77, 0.3)',
                borderRadius: '12px',
                color: '#FF4D4D',
                fontSize: '14px',
              }}
            >
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading
                ? 'rgba(255, 255, 255, 0.1)'
                : 'linear-gradient(135deg, #4DBDFF, #B13CFF)',
              border: 'none',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              opacity: loading ? 0.6 : 1,
              boxShadow: loading ? 'none' : '0 0 30px rgba(77, 189, 255, 0.3)',
            }}
            onMouseDown={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'scale(0.97) translateY(2px)';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow = '0 0 40px rgba(77, 189, 255, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = loading ? 'none' : '0 0 30px rgba(77, 189, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
            }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        {/* Register Link */}
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#888888',
          }}
        >
          Нет аккаунта?{' '}
          <Link
            href="/register"
            style={{
              color: '#4DBDFF',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#B13CFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#4DBDFF';
            }}
          >
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}
