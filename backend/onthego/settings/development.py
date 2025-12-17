from .base import *

DEBUG = True

# ALLOWED_HOSTS для разработки и мобильного доступа
# '*' разрешает все хосты - ТОЛЬКО для разработки!
ALLOWED_HOSTS = ['*']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'onthego_db',
        'USER': 'postgres',
        'PASSWORD': '123456787654321',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# CORS настройки для разработки
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Логирование для разработки
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Email настройки для разработки (в консоль)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'