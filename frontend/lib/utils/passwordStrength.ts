/**
 * Calculate password strength
 * Returns: { score: 0-4, label, color, feedback }
 */

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
  feedback: string[];
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Введите пароль',
      color: 'text-text-muted',
      bgColor: 'bg-text-muted/20',
      feedback: [],
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Минимум 8 символов');
  }

  // Uppercase check
  if (/[A-ZА-Я]/.test(password)) {
    score++;
  } else {
    feedback.push('Добавьте заглавные буквы');
  }

  // Lowercase check
  if (/[a-zа-я]/.test(password)) {
    score++;
  } else {
    feedback.push('Добавьте строчные буквы');
  }

  // Number check
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Добавьте цифры');
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  } else {
    feedback.push('Добавьте спецсимволы (!@#$...)');
  }

  // Determine label and color based on score
  let label = '';
  let color = '';
  let bgColor = '';

  if (score === 0 || score === 1) {
    label = 'Слабый';
    color = 'text-red-400';
    bgColor = 'bg-red-500/20';
  } else if (score === 2) {
    label = 'Средний';
    color = 'text-yellow-400';
    bgColor = 'bg-yellow-500/20';
  } else if (score === 3) {
    label = 'Хороший';
    color = 'text-blue-400';
    bgColor = 'bg-blue-500/20';
  } else if (score === 4) {
    label = 'Отличный';
    color = 'text-green-400';
    bgColor = 'bg-green-500/20';
  } else if (score === 5) {
    label = 'Превосходный';
    color = 'text-neon-cyan';
    bgColor = 'bg-neon-cyan/20';
  }

  return { score, label, color, bgColor, feedback };
}
