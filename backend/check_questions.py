#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Check quiz questions encoding"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'onthego.settings')
django.setup()

from apps.courses.models import Question, Quiz

print(f'Total quizzes: {Quiz.objects.count()}')
print(f'Total questions: {Question.objects.count()}\n')

for q in Question.objects.all():
    print(f'Question {q.id} (Quiz: {q.quiz_id}):')
    print(f'  Text: {q.text[:100]}')
    print(f'  Options ({len(q.options)}):')
    for i, opt in enumerate(q.options, 1):
        print(f'    {i}. {opt.get("text", "N/A")[:60]}... (correct: {opt.get("is_correct", False)})')
    print(f'  Explanation: {q.explanation[:60]}...\n')
