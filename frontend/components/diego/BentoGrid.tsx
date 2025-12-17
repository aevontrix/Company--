'use client';

/**
 * BentoGrid - Features секция в стиле Diego
 *
 * Структура:
 * - 4x2 grid (4 колонки, 2 ряда)
 * - Высота: 350px
 * - Glass-panel стиль
 * - Hover: translateY(-5px) + border glow
 * - Span-2 для больших карточек
 */

interface BentoItemProps {
  icon: string;
  title: string;
  description: string;
  span?: 2;
  row?: 2;
  gradient?: string;
}

const BentoItem = ({ icon, title, description, span, row, gradient }: BentoItemProps) => {
  return (
    <div
      className={`glass-panel relative p-10 overflow-hidden transition-all duration-400 flex flex-col justify-end hover:-translate-y-1 hover:border-[#B13CFF] ${
        span === 2 ? 'col-span-2' : ''
      } ${row === 2 ? 'row-span-2' : ''}`}
      style={{
        minHeight: '350px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* Background gradient */}
      {gradient && (
        <div
          className="absolute inset-0 -z-10 transition-transform duration-500 group-hover:scale-110"
          style={{ background: gradient }}
        />
      )}

      {/* Icon */}
      <div
        className="mb-auto w-20 h-20 flex items-center justify-center text-5xl rounded-[20px]"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-3xl font-bold mb-3">{title}</h3>
      <p className="text-white/60 leading-relaxed">{description}</p>
    </div>
  );
};

export default function BentoGrid() {
  return (
    <section id="features" className="py-32">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-32">
          <h2 className="font-['Syne'] text-5xl md:text-6xl font-bold mb-6">
            Почему выбирают <span className="text-gradient">ONTHEGO?</span>
          </h2>
          <p className="text-white/60 text-xl">
            Мы объединили технологии гейминга и педагогики.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* AI-Персонализация - большая карточка */}
          <BentoItem
            icon="🤖"
            title="AI-Персонализация"
            description="Нейросеть перестраивает программу курса на лету, если видит, что вы застряли или вам слишком скучно. Индивидуальный трек обучения."
            span={2}
            row={2}
            gradient="radial-gradient(circle at top right, rgba(177,60,255,0.2), transparent)"
          />

          {/* Топ контент */}
          <BentoItem
            icon="🎓"
            title="Топ контент"
            description="Материалы от Senior разработчиков FAANG."
          />

          {/* Mobile First */}
          <BentoItem
            icon="📱"
            title="Mobile First"
            description="Учись в метро, в парке, везде."
          />

          {/* Карьерный центр - широкая карточка */}
          <BentoItem
            icon="💼"
            title="Карьерный центр"
            description="AI-анализ резюме и мок-интервью с виртуальным HR."
            span={2}
            gradient="radial-gradient(circle at bottom left, rgba(77,189,255,0.2), transparent)"
          />
        </div>
      </div>
    </section>
  );
}
