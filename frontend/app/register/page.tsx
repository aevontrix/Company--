'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getPasswordStrength } from '@/lib/utils/passwordStrength';

// ============================================================
// REGISTRATION PAGE - ARCHITECT ZERO DESIGN
// ============================================================
export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const countries = [
    'Россия', 'Казахстан', 'Беларусь', 'Украина', 'США', 'Канада',
    'Великобритания', 'Германия', 'Франция', 'Испания', 'Италия',
    'Китай', 'Япония', 'Южная Корея', 'Индия', 'Австралия', 'Другое'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'Введите имя';
    if (!formData.last_name.trim()) newErrors.last_name = 'Введите фамилию';
    if (!formData.email.trim()) newErrors.email = 'Введите email';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Некорректный email';
    if (!formData.password) newErrors.password = 'Введите пароль';
    else if (formData.password.length < 8) newErrors.password = 'Минимум 8 символов';
    else if (passwordStrength.score < 2) newErrors.password = 'Пароль слишком слабый';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    if (!formData.country) newErrors.country = 'Выберите страну';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        country: formData.country,
      });

      router.push('/dashboard');
    } catch (error: any) {
      setErrors({ submit: error.message || 'Ошибка регистрации' });
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
          top: '10%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(77, 189, 255, 0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(177, 60, 255, 0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
        }}
      />

      {/* Registration Form Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
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
            Создайте аккаунт для начала обучения
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* First Name & Last Name */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#FFFFFF',
                }}
              >
                Имя *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${errors.first_name ? '#FF4D4D' : 'rgba(255, 255, 255, 0.1)'}`,
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
                  if (!errors.first_name) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.first_name && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#FF4D4D' }}>
                  {errors.first_name}
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#FFFFFF',
                }}
              >
                Фамилия *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${errors.last_name ? '#FF4D4D' : 'rgba(255, 255, 255, 0.1)'}`,
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
                  if (!errors.last_name) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.last_name && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#FF4D4D' }}>
                  {errors.last_name}
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#FFFFFF',
              }}
            >
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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

          {/* Password & Confirm Password */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#FFFFFF',
                }}
              >
                Пароль *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
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
              {/* Password Strength Indicator */}
              {formData.password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          background: i < passwordStrength.score
                            ? passwordStrength.score <= 1 ? '#FF4D4D'
                              : passwordStrength.score === 2 ? '#FFB84D'
                              : passwordStrength.score === 3 ? '#4DBDFF'
                              : passwordStrength.score === 4 ? '#4DFF77'
                              : '#00FFFF'
                            : 'rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px',
                      color: passwordStrength.score <= 1 ? '#FF4D4D'
                        : passwordStrength.score === 2 ? '#FFB84D'
                        : passwordStrength.score === 3 ? '#4DBDFF'
                        : passwordStrength.score === 4 ? '#4DFF77'
                        : '#00FFFF',
                      fontWeight: 500,
                    }}>
                      {passwordStrength.label}
                    </span>
                    {passwordStrength.feedback.length > 0 && (
                      <span style={{ fontSize: '10px', color: '#888888' }}>
                        {passwordStrength.feedback[0]}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#FFFFFF',
                }}
              >
                Подтверждение *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${errors.confirmPassword ? '#FF4D4D' : 'rgba(255, 255, 255, 0.1)'}`,
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
                  if (!errors.confirmPassword) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.confirmPassword && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#FF4D4D' }}>
                  {errors.confirmPassword}
                </div>
              )}
            </div>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#FFFFFF',
              }}
            >
              Телефон (опционально)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+7 (XXX) XXX-XX-XX"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
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
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Country */}
          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#FFFFFF',
              }}
            >
              Страна *
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${errors.country ? '#FF4D4D' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '12px',
                color: formData.country ? '#FFFFFF' : '#888888',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.15s',
                cursor: 'pointer',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#4DBDFF';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(77, 189, 255, 0.2)';
              }}
              onBlur={(e) => {
                if (!errors.country) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <option value="" disabled>Выберите страну</option>
              {countries.map((country) => (
                <option key={country} value={country} style={{ background: '#0A0814', color: '#FFFFFF' }}>
                  {country}
                </option>
              ))}
            </select>
            {errors.country && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#FF4D4D' }}>
                {errors.country}
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
            {loading ? 'Регистрация...' : 'Создать аккаунт'}
          </button>
        </form>

        {/* Login Link */}
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#888888',
          }}
        >
          Уже есть аккаунт?{' '}
          <Link
            href="/login"
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
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
