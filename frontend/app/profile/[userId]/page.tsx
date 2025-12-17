'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI, friendsAPI, messagingAPI, Friend } from '@/lib/api';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const userId = parseInt(params.userId as string);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser || !userId) return;

      // Redirect if viewing own profile
      if (currentUser.id === userId) {
        router.push('/profile');
        return;
      }

      try {
        setLoading(true);
        const profile = await authAPI.getUserProfile(userId);
        setProfileUser(profile);

        // Check friendship status
        const friends = await friendsAPI.getFriends();
        const friendsData = friends.results || [];
        const isFriendNow = friendsData.some((f: Friend) => f.id === userId);
        setIsFriend(isFriendNow);

        // Check if request already sent
        const sent = await friendsAPI.getSentRequests();
        const sentData = sent.results || [];
        const hasRequest = sentData.some((req: any) => req.to_user.id === userId);
        setRequestSent(hasRequest);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, currentUser, router]);

  const handleSendFriendRequest = async () => {
    try {
      await friendsAPI.sendFriendRequest(userId);
      setRequestSent(true);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleSendMessage = async () => {
    try {
      await messagingAPI.createDirectChat(userId);
      router.push('/messages');
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#888888' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '18px' }}>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#888888' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <p style={{ fontSize: '18px' }}>Профиль не найден</p>
        </div>
      </div>
    );
  }

  const userAvatar = profileUser.xp === 0 ? '🌱' : profileUser.xp > 5000 ? '🌳' : '🌿';

  return (
    <div style={{ minHeight: '100vh', background: '#050505', padding: '40px', color: '#FFFFFF' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header with Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ← Назад
          </button>
          <h1 style={{
            fontSize: '42px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #4DBDFF, #B13CFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Профиль пользователя
          </h1>
        </div>

        {/* Profile Card */}
        <div style={{
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          backdropFilter: 'blur(24px) saturate(180%)',
        }}>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(77, 189, 255, 0.2), rgba(177, 60, 255, 0.2))',
                border: '3px solid rgba(77, 189, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px',
                marginBottom: '16px',
              }}>
                {userAvatar}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#4DBDFF',
                fontWeight: 600,
                marginBottom: '8px',
              }}>
                Level {profileUser.level || 1}
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#FFD700',
              }}>
                {profileUser.xp || 0} XP
              </div>
            </div>

            {/* User Info */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
                {profileUser.first_name} {profileUser.last_name}
              </h2>
              <div style={{ fontSize: '16px', color: '#888888', marginBottom: '24px' }}>
                {profileUser.email}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {/* Message Button - Always visible */}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  style={{
                    padding: '14px 28px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(77, 189, 255, 0.4)',
                    borderRadius: '12px',
                    color: '#4DBDFF',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(77, 189, 255, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  💬 Написать сообщение
                </button>

                {/* Friend Request Button */}
                {!isFriend && !requestSent && (
                  <button
                    type="button"
                    onClick={handleSendFriendRequest}
                    style={{
                      padding: '14px 28px',
                      background: 'linear-gradient(135deg, #4DBDFF, #B13CFF)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: '0 0 30px rgba(77, 189, 255, 0.4)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 0 50px rgba(77, 189, 255, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(77, 189, 255, 0.4)';
                    }}
                  >
                    + Добавить в друзья
                  </button>
                )}

                {requestSent && (
                  <div style={{
                    padding: '14px 28px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#888888',
                    fontSize: '16px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    ✓ Запрос отправлен
                  </div>
                )}

                {isFriend && (
                  <div style={{
                    padding: '14px 28px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '12px',
                    color: '#10B981',
                    fontSize: '16px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    ✓ В друзьях
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginTop: '32px' }}>
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#FF4DFF', marginBottom: '4px' }}>
                    {profileUser.streak || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888888' }}>Streak</div>
                </div>
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#4DBDFF', marginBottom: '4px' }}>
                    {profileUser.level || 1}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888888' }}>Level</div>
                </div>
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFD700', marginBottom: '4px' }}>
                    {profileUser.xp || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888888' }}>XP</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
