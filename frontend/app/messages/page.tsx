'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { messagingAPI, authAPI, Chat as APIChat, Message as APIMessage } from '@/lib/api';
import { useToastStore } from '@/lib/store/toastStore';
import { MessageCircle, Users, Send, Plus, Search, X } from 'lucide-react';

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isOnline: boolean;
  type: 'direct' | 'group';
  members?: number;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showCreateChatModal, setShowCreateChatModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('👥');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  const emojiAvatars = ['👥', '🎓', '💻', '📚', '🚀', '🎯', '⚡', '🔥', '💡', '🌟', '🎨', '🎭', '🎪', '🎬', '🎵', '🎮', '🏆', '💰', '🌈', '🦄'];

  const loadChats = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await messagingAPI.getChats();
      const apiChats = response.results || [];

      const transformedChats: Chat[] = apiChats.map((chat: APIChat) => {
        const lastMessageTime = chat.last_message?.created_at
          ? formatTimestamp(new Date(chat.last_message.created_at))
          : 'Нет сообщений';

        return {
          id: chat.id,
          name: chat.type === 'group' ? (chat.name || 'Группа') : 'Пользователь',
          avatar: chat.avatar || (chat.type === 'group' ? '👥' : '👤'),
          lastMessage: chat.last_message?.content || 'Нет сообщений',
          timestamp: lastMessageTime,
          unread: chat.unread_count,
          isOnline: false,
          type: chat.type,
          members: chat.members_count,
        };
      });

      setChats(transformedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadChats();
    const chatPollInterval = setInterval(() => {
      loadChats();
    }, 5000);

    return () => clearInterval(chatPollInterval);
  }, [loadChats]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!showCreateChatModal && !showCreateGroupModal) return;

      try {
        const response = await authAPI.getAllUsers();
        const users = response.results || [];
        setAllUsers(users.filter((u: User) => u.id !== user?.id));
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
  }, [showCreateChatModal, showCreateGroupModal, user]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChat) {
        setMessages([]);
        return;
      }

      try {
        const response = await messagingAPI.getMessages(selectedChat);
        const apiMessages = response.results || [];

        const transformedMessages: Message[] = apiMessages.map((msg: APIMessage) => ({
          id: msg.id,
          sender: msg.is_own ? 'Вы' : `${msg.sender.first_name} ${msg.sender.last_name}`,
          content: msg.content,
          timestamp: formatMessageTime(new Date(msg.created_at)),
          isOwn: msg.is_own,
        }));

        setMessages(transformedMessages);
        await messagingAPI.markAsRead(selectedChat);

        setChats(prev => prev.map(chat =>
          chat.id === selectedChat ? { ...chat, unread: 0 } : chat
        ));
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
    const pollInterval = setInterval(() => {
      if (selectedChat) {
        loadMessages();
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} час${diffHours > 1 ? 'а' : ''} назад`;
    if (diffDays < 7) return `${diffDays} дн${diffDays > 1 ? 'я' : 'ь'} назад`;

    return date.toLocaleDateString('ru-RU');
  };

  const formatMessageTime = (date: Date): string => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    try {
      const newMessage = await messagingAPI.sendMessage(selectedChat, messageInput.trim());

      const transformedMessage: Message = {
        id: newMessage.id,
        sender: 'Вы',
        content: newMessage.content,
        timestamp: formatMessageTime(new Date(newMessage.created_at)),
        isOwn: true,
      };

      setMessages(prev => [...prev, transformedMessage]);

      setChats(prev => prev.map(chat => {
        if (chat.id === selectedChat) {
          return {
            ...chat,
            lastMessage: newMessage.content,
            timestamp: formatTimestamp(new Date(newMessage.created_at)),
          };
        }
        return chat;
      }));

      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCreateDirectChat = async () => {
    if (!selectedUserId) return;

    try {
      const newChat = await messagingAPI.createDirectChat(selectedUserId);

      const transformedChat: Chat = {
        id: newChat.id,
        name: 'Пользователь',
        avatar: newChat.avatar || '👤',
        lastMessage: 'Нет сообщений',
        timestamp: formatTimestamp(new Date(newChat.created_at)),
        unread: 0,
        isOnline: false,
        type: 'direct',
        members: newChat.members_count,
      };

      setChats(prev => [transformedChat, ...prev]);
      setSelectedChat(newChat.id);
      setShowCreateChatModal(false);
      setSelectedUserId(null);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    try {
      setLoading(true);
      const newChat = await messagingAPI.createGroupChat(groupName.trim(), selectedMembers.length > 0 ? selectedMembers : [], groupAvatar);

      const transformedChat: Chat = {
        id: newChat.id,
        name: newChat.name || groupName,
        avatar: newChat.avatar || groupAvatar,
        lastMessage: 'Нет сообщений',
        timestamp: formatTimestamp(new Date(newChat.created_at)),
        unread: 0,
        isOnline: false,
        type: 'group',
        members: newChat.members_count,
      };

      setChats(prev => [transformedChat, ...prev]);
      setSelectedChat(newChat.id);
      setShowCreateGroupModal(false);
      setGroupName('');
      setGroupAvatar('👥');
      setSelectedMembers([]);

      await loadChats();
    } catch (error) {
      console.error('Error creating group:', error);
      addToast({
        type: 'error',
        title: 'Ошибка создания группы',
        message: 'Не удалось создать группу. Попробуйте снова.',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId: number) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredChats = chats.filter(chat => chat.type === activeTab);
  const currentChat = chats.find((c) => c.id === selectedChat);

  if (loading && chats.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="mx-auto mb-4 text-primary" size={48} />
          <p className="text-text-secondary">Загрузка сообщений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display flex items-center gap-3 mb-2">
          <MessageCircle className="text-primary" />
          Сообщения
        </h1>
        <p className="text-text-secondary">
          Общайтесь с другими студентами и обсуждайте курсы
        </p>
      </div>

      {/* Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'direct'
                ? 'bg-primary/20 border border-primary/40 text-white'
                : 'bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10'
            }`}
          >
            💬 Личные ({chats.filter(c => c.type === 'direct').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('group')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'group'
                ? 'bg-primary/20 border border-primary/40 text-white'
                : 'bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10'
            }`}
          >
            👥 Группы ({chats.filter(c => c.type === 'group').length})
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowCreateChatModal(true)}
            className="px-4 py-2.5 bg-primary/20 border border-primary/40 rounded-xl text-white hover:bg-primary/30 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Создать чат
          </button>
          <button
            type="button"
            onClick={() => setShowCreateGroupModal(true)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Users size={18} />
            Создать группу
          </button>
        </div>
      </div>

      {/* Chat Layout */}
      <div className="grid lg:grid-cols-[350px_1fr] gap-6 h-[calc(100vh-300px)]">
        {/* Chat List */}
        <div className="cyber-card p-5 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">
                {activeTab === 'direct' ? '💬' : '👥'}
              </div>
              <p className="text-text-secondary mb-2">
                {activeTab === 'direct' ? 'Нет личных чатов' : 'Нет групповых чатов'}
              </p>
              <p className="text-sm text-text-secondary">
                Создайте новый {activeTab === 'direct' ? 'чат' : 'группу'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedChat === chat.id
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative text-3xl">
                      {chat.avatar}
                      {chat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-bg-surface" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{chat.name}</span>
                        {chat.unread > 0 && (
                          <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full font-bold">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                      {chat.type === 'group' && chat.members && (
                        <p className="text-xs text-text-secondary">{chat.members} участников</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary truncate mb-1">{chat.lastMessage}</p>
                  <p className="text-xs text-text-secondary">{chat.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className="cyber-card flex flex-col">
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="mx-auto mb-4 text-text-secondary" size={64} />
                <p className="text-text-secondary">Выберите чат для начала общения</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-5 border-b border-white/10 flex items-center gap-3">
                <div className="text-3xl">{currentChat?.avatar}</div>
                <div>
                  <div className="font-semibold">{currentChat?.name}</div>
                  {currentChat?.type === 'group' && currentChat.members && (
                    <p className="text-sm text-text-secondary">{currentChat.members} участников</p>
                  )}
                  {currentChat?.type === 'direct' && (
                    <p className="text-sm text-text-secondary">
                      {currentChat.isOnline ? '🟢 В сети' : 'Не в сети'}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="mx-auto mb-4 text-text-secondary" size={48} />
                    <p className="text-text-secondary mb-2">Нет сообщений</p>
                    <p className="text-sm text-text-secondary">Начните беседу!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl ${
                            msg.isOwn
                              ? 'bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30'
                              : 'bg-white/5 border border-white/10'
                          }`}
                        >
                          {!msg.isOwn && (
                            <div className="text-xs font-semibold text-primary mb-1">{msg.sender}</div>
                          )}
                          <div className="text-sm mb-1">{msg.content}</div>
                          <div className="text-xs text-text-secondary text-right">{msg.timestamp}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="p-5 border-t border-white/10 flex gap-3">
                <input
                  type="text"
                  placeholder="Введите сообщение..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-text-secondary focus:border-primary focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    messageInput.trim()
                      ? 'bg-primary/20 border border-primary/40 text-white hover:bg-primary/30'
                      : 'bg-white/5 border border-white/10 text-text-secondary cursor-not-allowed opacity-50'
                  }`}
                >
                  <Send size={18} />
                  Отправить
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Chat Modal */}
      {showCreateChatModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateChatModal(false)}
        >
          <div
            className="cyber-card p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Создать личный чат</h2>
              <button
                type="button"
                onClick={() => setShowCreateChatModal(false)}
                className="text-text-secondary hover:text-white transition-colors"
                aria-label="Закрыть модальное окно"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-text-secondary mb-3">Выберите пользователя:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      selectedUserId === u.id
                        ? 'bg-primary/20 border border-primary/40'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium">{u.first_name} {u.last_name}</div>
                    <div className="text-sm text-text-secondary">{u.email}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowCreateChatModal(false); setSelectedUserId(null); }}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreateDirectChat}
                disabled={!selectedUserId}
                className={`flex-1 px-4 py-2.5 rounded-xl transition-all ${
                  selectedUserId
                    ? 'bg-primary/20 border border-primary/40 hover:bg-primary/30'
                    : 'bg-white/5 border border-white/10 opacity-50 cursor-not-allowed'
                }`}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateGroupModal(false)}
        >
          <div
            className="cyber-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Создать группу</h2>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="text-text-secondary hover:text-white transition-colors"
                aria-label="Закрыть модальное окно"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-text-secondary mb-2">Название группы:</p>
              <input
                type="text"
                placeholder="Введите название..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-text-secondary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <p className="text-sm text-text-secondary mb-2">Выберите аватар:</p>
              <div className="flex flex-wrap gap-2">
                {emojiAvatars.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setGroupAvatar(emoji)}
                    className={`p-2 text-2xl rounded-xl transition-all ${
                      groupAvatar === emoji
                        ? 'bg-primary/30 border-2 border-primary'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-text-secondary mb-3">
                Участники (опционально, {selectedMembers.length} выбрано):
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      selectedMembers.includes(u.id)
                        ? 'bg-primary/20 border border-primary/40'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{u.first_name} {u.last_name}</div>
                        <div className="text-sm text-text-secondary">{u.email}</div>
                      </div>
                      {selectedMembers.includes(u.id) && (
                        <div className="text-primary">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateGroupModal(false);
                  setGroupName('');
                  setGroupAvatar('👥');
                  setSelectedMembers([]);
                }}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={!groupName.trim()}
                className={`flex-1 px-4 py-2.5 rounded-xl transition-all ${
                  groupName.trim()
                    ? 'bg-primary/20 border border-primary/40 hover:bg-primary/30'
                    : 'bg-white/5 border border-white/10 opacity-50 cursor-not-allowed'
                }`}
              >
                Создать группу
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
