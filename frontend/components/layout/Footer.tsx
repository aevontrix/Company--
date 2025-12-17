import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-dark-secondary border-t border-neon-purple/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold gradient-text mb-4">ONTHEGO</h3>
            <p className="text-text-muted">
              AI-powered образовательная платформа для обучения в любом месте
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-text-secondary mb-4">Платформа</h4>
            <ul className="space-y-2">
              {['Курсы', 'Категории', 'Преподаватели'].map((item) => (
                <li key={item}>
                  <Link href={`/${item.toLowerCase()}`} className="text-text-muted hover:text-neon-cyan transition">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-secondary mb-4">Поддержка</h4>
            <ul className="space-y-2">
              {['Помощь', 'FAQ', 'Контакты'].map((item) => (
                <li key={item}>
                  <Link href={`/${item.toLowerCase()}`} className="text-text-muted hover:text-neon-cyan transition">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-secondary mb-4">Юридическое</h4>
            <ul className="space-y-2">
              {['Условия использования', 'Политика конфиденциальности'].map((item) => (
                <li key={item}>
                  <Link href="/terms" className="text-text-muted hover:text-neon-cyan transition">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-neon-purple/10 mt-8 pt-8 text-center">
          <p className="text-text-muted">© 2025 ONTHEGO. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
