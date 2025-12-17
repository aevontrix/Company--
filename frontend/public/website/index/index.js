// Функции для бургер-меню
function openMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const burgerMenu = document.getElementById('burgerMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    mobileNav.classList.add('active');
    burgerMenu.classList.add('active');
    mobileOverlay.classList.add('active');
    
    mobileNav.setAttribute('aria-hidden', 'false');
    burgerMenu.setAttribute('aria-label', 'Закрыть меню');
    burgerMenu.setAttribute('aria-expanded', 'true');
    
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const burgerMenu = document.getElementById('burgerMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    mobileNav.classList.remove('active');
    burgerMenu.classList.remove('active');
    mobileOverlay.classList.remove('active');
    
    mobileNav.setAttribute('aria-hidden', 'true');
    burgerMenu.setAttribute('aria-label', 'Открыть меню');
    burgerMenu.setAttribute('aria-expanded', 'false');
    
    document.body.style.overflow = 'auto';
}

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SCROLL REVEAL ANIMATION
    const revealElements = document.querySelectorAll('.reveal-up');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        root: null,
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // 2. FAQ ACCORDION
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            const answer = item.querySelector('.faq-answer');

            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                }
            });

            if (isActive) {
                item.classList.remove('active');
                answer.style.maxHeight = null;
            } else {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // 3. SMOOTH SCROLL FOR ANCHOR LINKS
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 100;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // 4. HEADER BACKGROUND ON SCROLL
    const header = document.querySelector('.header-glass');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(10, 10, 12, 0.8)';
        } else {
            header.style.background = 'rgba(10, 10, 12, 0.6)';
        }
    });

    // 5. TESTIMONIALS CAROUSEL SCRIPT
    const track = document.getElementById('reviewsTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (track && prevBtn && nextBtn) {
        nextBtn.addEventListener('click', () => {
            const cardWidth = track.querySelector('.testimonial-card').offsetWidth;
            track.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            const cardWidth = track.querySelector('.testimonial-card').offsetWidth;
            track.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
        });
    }

    // 6. МОДАЛЬНЫЕ ОКНА
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    // Бургер-меню
    const burgerMenu = document.getElementById('burgerMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    
    burgerMenu.addEventListener('click', () => {
        if (burgerMenu.classList.contains('active')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });
    
    mobileOverlay.addEventListener('click', closeMobileMenu);
    mobileCloseBtn.addEventListener('click', closeMobileMenu);
    
    // Кнопки открытия модальных окон (десктоп)
    document.getElementById('loginBtnHeader').addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
        loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    document.getElementById('registerBtnHeader').addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
        registerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Кнопки открытия модальных окон (мобильные)
    document.getElementById('loginBtnMobile').addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
        loginModal.classList.add('active');
    });

    document.getElementById('registerBtnMobile').addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
        registerModal.classList.add('active');
    });

    // Закрытие модальных окон
    function closeAllModals() {
        loginModal.classList.remove('active');
        registerModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    document.getElementById('closeLoginModal').addEventListener('click', closeAllModals);
    document.getElementById('closeRegisterModal').addEventListener('click', closeAllModals);
    document.getElementById('cancelLoginBtn').addEventListener('click', closeAllModals);
    document.getElementById('cancelRegisterBtn').addEventListener('click', closeAllModals);

    // Клик по оверлею для закрытия модалок
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) closeAllModals();
    });
    registerModal.addEventListener('click', (e) => {
        if (e.target === registerModal) closeAllModals();
    });

    // Переход на платформу
    document.getElementById('goToPlatformLoginBtn').addEventListener('click', () => {
        window.parent.location.href = '/login';
    });

    document.getElementById('goToPlatformRegisterBtn').addEventListener('click', () => {
        window.parent.location.href = '/register';
    });

    // 7. КНОПКИ ПЕРЕХОДА С ПРОВЕРКОЙ СЕССИИ
    function handleStartLearning() {
        const hasSession = localStorage.getItem('onthego_session') ||
                           document.cookie.includes('onthego_token');

        if (hasSession) {
            window.parent.location.href = '/dashboard';
        } else {
            closeMobileMenu();
            registerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Кнопка "Начать обучение" в герое
    document.getElementById('heroStartBtn').addEventListener('click', (e) => {
        e.preventDefault();
        handleStartLearning();
    });

    // Кнопка "Смотреть программу"
    document.getElementById('viewProgramBtn').addEventListener('click', (e) => {
        e.preventDefault();
        handleStartLearning();
    });

    // Финальная кнопка "Начать обучение"
    document.getElementById('finalStartBtn').addEventListener('click', (e) => {
        e.preventDefault();
        handleStartLearning();
    });

    // ESC для закрытия меню и модалок
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            closeMobileMenu();
        }
    });

    // Закрытие мобильного меню при ресайзе (если перешли на десктоп)
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            closeMobileMenu();
        }
    });

    // Функция проверки сессии
    function checkSession() {
        const hasSession = localStorage.getItem('onthego_session') || 
                           document.cookie.includes('onthego_token');
        
        if (hasSession) {
            console.log('Пользователь авторизован');
        }
    }

    // Проверяем сессию при загрузке
    checkSession();
});

// 8. CYBER LOADER
(function() {
    const loader = document.getElementById('cyber-loader');
    const countDisplay = document.getElementById('countDisplay');
    const textScramble = document.getElementById('textScramble');
    const terminalLogs = document.getElementById('terminalLogs');
    const phrases = ["CONNECTING NODE", "BYPASSING FIREWALL", "DECRYPTING ASSETS", "LOADING 3D CORE", "ACCESS GRANTED"];
    const logs = [
        "root@onthego:~$ init_sequence --force",
        "Loading module: three.js... [OK]",
        "Loading module: spline-viewer... [OK]",
        "Optimizing assets... 42ms",
        "Establishing secure connection...",
        "Handshake verified. Token: 0x4F3A...",
        "Rendering environment...",
        "System ready."
    ];

    document.body.classList.add('is-loading');

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
    
    function scrambleText(element, targetText) {
        let iterations = 0;
        const interval = setInterval(() => {
            element.innerText = targetText
                .split('')
                .map((letter, index) => {
                    if(index < iterations) return targetText[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('');
            
            if(iterations >= targetText.length) clearInterval(interval);
            iterations += 1 / 2;
        }, 30);
    }

    let loadProgress = 0;
    let logIndex = 0;
    let phraseIndex = 0;
    
    scrambleText(textScramble, phrases[0]);

    const loadingInterval = setInterval(() => {
        const increment = Math.random() * 2 + 0.5; 
        loadProgress += increment;

        if (loadProgress >= 100) {
            loadProgress = 100;
            clearInterval(loadingInterval);
        }
        countDisplay.innerText = Math.floor(loadProgress);

        if (loadProgress > (phraseIndex + 1) * 20 && phraseIndex < phrases.length - 1) {
            phraseIndex++;
            scrambleText(textScramble, phrases[phraseIndex]);
        }

        if (Math.random() > 0.8 && logIndex < logs.length) {
            const p = document.createElement('div');
            p.classList.add('terminal-line');
            const time = new Date().toISOString().split('T')[1].slice(0,8);
            p.innerHTML = `<span style="opacity:0.5">[${time}]</span> ${logs[logIndex]}`;
            terminalLogs.appendChild(p);
            logIndex++;
            if(terminalLogs.children.length > 5) terminalLogs.firstElementChild.remove();
        }

    }, 50);

    window.addEventListener('load', () => {
        setTimeout(() => {
            clearInterval(loadingInterval);
            countDisplay.innerText = "100";
            scrambleText(textScramble, "SYSTEM READY");

            setTimeout(() => {
                loader.classList.add('loaded');
                document.body.classList.remove('is-loading');

                setTimeout(() => loader.remove(), 800);
                
                const heroTitle = document.querySelector('.display-text');
                if(heroTitle) heroTitle.classList.add('active');

            }, 600);
        }, 800);
    });
})();