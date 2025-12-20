#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Fix quiz encoding issues"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'onthego.settings')
django.setup()

from apps.courses.models import Quiz, Question

# Fix Quiz 2 (lesson 13)
quiz = Quiz.objects.get(id=2)
quiz.title = "Тест: Распространённые уязвимости ПО"
quiz.save()
print(f"✅ Fixed quiz title: {quiz.title}")


# Fix questions
questions_data = [
    {
        'id': 6,
        'text': 'Что такое уязвимость нулевого дня (Zero-day)?',
        'options': [
            ('Уязвимость, обнаруженная в первый день релиза', False),
            ('Уязвимость, для которой ещё нет патча', True),
            ('Уязвимость с нулевым риском', False),
            ('Уязвимость, найденная хакером', False),
        ],
        'explanation': 'Zero-day уязвимость - это уязвимость, о которой разработчики ещё не знают и для которой нет патча.'
    },
    {
        'id': 7,
        'text': 'Что означает SQL-инъекция?',
        'options': [
            ('Внедрение вредоносного кода в базу данных', True),
            ('Защита от SQL-запросов', False),
            ('Оптимизация SQL-запросов', False),
            ('Резервное копирование БД', False),
        ],
        'explanation': 'SQL-инъекция позволяет злоумышленнику выполнить произвольные SQL-команды через недостаточную фильтрацию пользовательского ввода.'
    },
    {
        'id': 8,
        'text': 'Что такое XSS (Cross-Site Scripting)?',
        'options': [
            ('Межсайтовый скриптинг - внедрение JavaScript кода', True),
            ('Кросс-платформенная система безопасности', False),
            ('Защита от SQL-инъекций', False),
            ('Метод шифрования данных', False),
        ],
        'explanation': 'XSS позволяет злоумышленнику внедрить вредоносный JavaScript код на страницу, который будет выполнен в браузере жертвы.'
    },
    {
        'id': 9,
        'text': 'Какая из этих атак использует переполнение буфера?',
        'options': [
            ('Buffer Overflow', True),
            ('SQL Injection', False),
            ('XSS', False),
            ('CSRF', False),
        ],
        'explanation': 'Buffer Overflow (переполнение буфера) происходит когда программа записывает больше данных в буфер, чем он может вместить.'
    },
    {
        'id': 10,
        'text': 'Что такое CSRF?',
        'options': [
            ('Межсайтовая подделка запроса', True),
            ('Система шифрования', False),
            ('Протокол безопасности', False),
            ('Антивирус', False),
        ],
        'explanation': 'CSRF (Cross-Site Request Forgery) заставляет жертву выполнить нежелательные действия на сайте, где она аутентифицирована.'
    },
]

for q_data in questions_data:
    try:
        question = Question.objects.get(id=q_data['id'])
        question.text = q_data['text']
        question.explanation = q_data['explanation']
        question.save()
        print(f"✅ Fixed question {q_data['id']}: {q_data['text'][:50]}...")

        # Fix options
        options = question.options.all().order_by('id')
        for i, (opt_text, is_correct) in enumerate(q_data['options']):
            if i < options.count():
                opt = options[i]
                opt.text = opt_text
                opt.is_correct = is_correct
                opt.save()
                print(f"   - {opt_text[:40]}... {'✓' if is_correct else ''}")
    except Exception as e:
        print(f"❌ Error fixing question {q_data['id']}: {e}")

print("\n🎉 Done! Quiz encoding fixed!")
