# 🔌 WebSocket Real-Time Setup

## ⚠️ ВАЖНО: Для работы WebSocket нужен ASGI сервер!

Обычный `python manage.py runserver` **НЕ ПОДДЕРЖИВАЕТ WebSocket**.
Нужно использовать **Daphne** (ASGI сервер).

---

## 🚀 Быстрый запуск

### 1. Запустите Redis (в отдельном терминале)
```bash
cd ..\Redis
redis-server.exe
```

### 2. Запустите backend через Daphne
```bash
cd backend
start_server.bat
```

Или вручную:
```bash
cd backend
venv\Scripts\activate
daphne -b 127.0.0.1 -p 8000 onthego.asgi:application
```

---

## ✅ Проверка работы

### 1. Проверьте Redis
```bash
redis-cli ping
# Должно вернуть: PONG
```

### 2. Проверьте WebSocket подключение
Откройте консоль браузера (F12) и проверьте:
```
✅ WebSocket connected: progress
✅ WebSocket connected: leaderboard
✅ WebSocket connected: achievements
```

### 3. Проверьте логи Django
В консоли сервера должны появляться сообщения:
```
🎯 SIGNAL: Lesson completed by user@email.com
💎 XP Awarded: 50 XP
📡 Sending WebSocket to group: progress_9
✅ WebSocket sent: lesson_completed
```

---

## 🐛 Отладка

### WebSocket не подключается
1. Убедитесь, что используете Daphne, а не runserver
2. Проверьте, что Redis запущен
3. Проверьте URL WebSocket в `.env`:
   ```
   NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000
   ```

### Сигналы не срабатывают
1. Проверьте, что урок отмечается как completed
2. Проверьте логи в консоли Django
3. Убедитесь, что в `apps.py` импортированы signals:
   ```python
   def ready(self):
       import apps.gamification.signals
   ```

### Обновления не приходят мгновенно
1. Проверьте console.log в браузере - приходят ли сообщения
2. Проверьте, что компонент подписан на WebSocket
3. Проверьте имена групп в signals.py и consumers.py (должны совпадать)

---

## 📦 Требуемые пакеты

Убедитесь, что установлены:
```bash
pip install channels==4.1.0
pip install channels-redis==4.2.1
pip install daphne==4.1.2
```

---

## 🔧 Конфигурация

### settings.py
```python
INSTALLED_APPS = [
    'daphne',  # Должен быть первым!
    'channels',
    # ...
]

ASGI_APPLICATION = 'onthego.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": ['redis://localhost:6379/2'],
        },
    },
}

```

### asgi.py
```python
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from onthego.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
```

---

## 🎯 WebSocket Endpoints

- `ws://127.0.0.1:8000/ws/progress/` - Progress updates
- `ws://127.0.0.1:8000/ws/leaderboard/` - Leaderboard updates
- `ws://127.0.0.1:8000/ws/achievements/` - Achievement unlocks
- `ws://127.0.0.1:8000/ws/streak/` - Streak notifications
- `ws://127.0.0.1:8000/ws/dashboard/` - Dashboard updates

---

## 📊 Мониторинг WebSocket

### В консоли браузера (F12):
```javascript
// Проверить подключения
wsService.connections

// Отправить ping
wsService.send('progress', { type: 'ping' })
```

### В Django:
```python
# Проверить активные подключения
from channels.layers import get_channel_layer
channel_layer = get_channel_layer()
```

---

## 🔥 Production

Для production используйте:
```bash
daphne -b 0.0.0.0 -p 8000 onthego.asgi:application
```

С супервизором (supervisor/systemd):
```ini
[program:onthego-daphne]
command=/path/to/venv/bin/daphne -b 0.0.0.0 -p 8000 onthego.asgi:application
directory=/path/to/backend
autostart=true
autorestart=true
```
