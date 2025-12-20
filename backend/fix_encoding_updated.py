#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Fix quiz encoding issues for JSONField-based options model.
This script repairs double-encoded Cyrillic text in Quiz and Question models.
"""

# This will be run via: python manage.py shell < fix_encoding_updated.py

from apps.courses.models import Quiz, Question

def fix_text_encoding(text):
    """Fix double-encoded UTF-8 text"""
    if not text:
        return text
    try:
        # Try to fix double-encoding: text was stored as latin-1 but should be UTF-8
        return text.encode('latin1').decode('utf-8')
    except (UnicodeDecodeError, UnicodeEncodeError):
        # Already correct or unfixable
        return text

# Quiz data to fix (курс "Введение в информационную безопасность")
quizzes_data = {
    2: {
        'title': 'Тест: Распространённые уязвимости ПО',
        'questions': {
            6: {
                'text': 'Что такое уязвимость нулевого дня (Zero-day)?',
                'options': [
                    {'text': 'Уязвимость, обнаруженная в первый день релиза', 'is_correct': False},
                    {'text': 'Уязвимость, для которой ещё нет патча', 'is_correct': True},
                    {'text': 'Уязвимость с нулевым риском', 'is_correct': False},
                    {'text': 'Уязвимость, найденная хакером', 'is_correct': False},
                ],
                'explanation': 'Zero-day уязвимость - это уязвимость, о которой разработчики ещё не знают и для которой нет патча.'
            },
            7: {
                'text': 'Что означает SQL-инъекция?',
                'options': [
                    {'text': 'Внедрение вредоносного кода в базу данных', 'is_correct': True},
                    {'text': 'Защита от SQL-запросов', 'is_correct': False},
                    {'text': 'Оптимизация SQL-запросов', 'is_correct': False},
                    {'text': 'Резервное копирование БД', 'is_correct': False},
                ],
                'explanation': 'SQL-инъекция позволяет злоумышленнику выполнить произвольные SQL-команды через недостаточную фильтрацию пользовательского ввода.'
            },
            8: {
                'text': 'Что такое XSS (Cross-Site Scripting)?',
                'options': [
                    {'text': 'Межсайтовый скриптинг - внедрение JavaScript кода', 'is_correct': True},
                    {'text': 'Кросс-платформенная система безопасности', 'is_correct': False},
                    {'text': 'Защита от SQL-инъекций', 'is_correct': False},
                    {'text': 'Метод шифрования данных', 'is_correct': False},
                ],
                'explanation': 'XSS позволяет злоумышленнику внедрить вредоносный JavaScript код на страницу, который будет выполнен в браузере жертвы.'
            },
            9: {
                'text': 'Какая из этих атак использует переполнение буфера?',
                'options': [
                    {'text': 'Buffer Overflow', 'is_correct': True},
                    {'text': 'SQL Injection', 'is_correct': False},
                    {'text': 'XSS', 'is_correct': False},
                    {'text': 'CSRF', 'is_correct': False},
                ],
                'explanation': 'Buffer Overflow (переполнение буфера) происходит когда программа записывает больше данных в буфер, чем он может вместить.'
            },
            10: {
                'text': 'Что такое CSRF?',
                'options': [
                    {'text': 'Межсайтовая подделка запроса', 'is_correct': True},
                    {'text': 'Система шифрования', 'is_correct': False},
                    {'text': 'Протокол безопасности', 'is_correct': False},
                    {'text': 'Антивирус', 'is_correct': False},
                ],
                'explanation': 'CSRF (Cross-Site Request Forgery) заставляет жертву выполнить нежелательные действия на сайте, где она аутентифицирована.'
            },
        }
    }
}

print('🔧 Fixing quiz encoding issues...\n')

for quiz_id, quiz_data in quizzes_data.items():
    try:
        quiz = Quiz.objects.get(id=quiz_id)
        quiz.title = quiz_data['title']
        quiz.save()
        print(f'✅ Fixed quiz {quiz_id}: {quiz.title}')

        for question_id, q_data in quiz_data['questions'].items():
            try:
                question = Question.objects.get(id=question_id)
                question.text = q_data['text']
                question.explanation = q_data['explanation']
                question.options = q_data['options']
                question.save()
                print(f'   ✅ Fixed question {question_id}: {q_data["text"][:50]}...')
                print(f'      Options: {len(q_data["options"])} items')
            except Question.DoesNotExist:
                print(f'   ❌ Question {question_id} not found')
            except Exception as e:
                print(f'   ❌ Error fixing question {question_id}: {e}')
    except Quiz.DoesNotExist:
        print(f'❌ Quiz {quiz_id} not found')
    except Exception as e:
        print(f'❌ Error fixing quiz {quiz_id}: {e}')

print('\n🎉 Done! Run the following to verify:')
print('python manage.py shell -c "from apps.courses.models import Question; q = Question.objects.get(id=6); print(q.text)"')
