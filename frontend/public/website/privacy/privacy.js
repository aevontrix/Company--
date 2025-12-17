document.addEventListener('DOMContentLoaded', () => {
    
    // Установка текущей даты
    const currentDate = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = currentDate.toLocaleDateString('ru-RU', options);

    // Table of Contents навигация
    const tocItems = document.querySelectorAll('.toc-item');
    const sections = document.querySelectorAll('.privacy-section');

    function updateActiveToc() {
        let currentSection = '';
        let maxVisible = 0;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
            
            if (visibleHeight > maxVisible && rect.top <= window.innerHeight * 0.3) {
                maxVisible = visibleHeight;
                currentSection = section.id;
            }
        });

        tocItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.target === currentSection) {
                item.classList.add('active');
            }
        });
    }

    // Плавная навигация по TOC
    tocItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.dataset.target;
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 100,
                    behavior: 'smooth'
                });
                
                tocItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            }
        });
    });

    window.addEventListener('scroll', updateActiveToc);
    updateActiveToc();

    // Бургер-меню
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

    // MODAL FUNCTIONALITY
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    document.querySelectorAll('#loginBtnHeader, #loginBtnMobile').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            closeMobileMenu();
        });
    });

    document.querySelectorAll('#registerBtnHeader, #registerBtnMobile').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            closeMobileMenu();
        });
    });

    function closeAllModals() {
        loginModal.classList.remove('active');
        registerModal.classList.remove('active');
        if (typeof cookieModal !== 'undefined') {
            cookieModal.classList.remove('active');
        }
        document.body.style.overflow = 'auto';
    }

    document.getElementById('closeLoginModal').addEventListener('click', closeAllModals);
    document.getElementById('closeRegisterModal').addEventListener('click', closeAllModals);
    document.getElementById('cancelLoginBtn').addEventListener('click', closeAllModals);
    document.getElementById('cancelRegisterBtn').addEventListener('click', closeAllModals);

    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) closeAllModals();
    });
    registerModal.addEventListener('click', (e) => {
        if (e.target === registerModal) closeAllModals();
    });

    // Переход на платформу для входа
    document.getElementById('goToPlatformLoginBtn').addEventListener('click', () => {
        window.location.href = 'main.html#login';
    });

    // Переход на платформу для регистрации
    document.getElementById('goToPlatformRegisterBtn').addEventListener('click', () => {
        window.location.href = 'main.html#register';
    });

    // HEADER BACKGROUND ON SCROLL
    const header = document.querySelector('.header-glass');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.style.background = 'rgba(10, 10, 12, 0.8)';
            } else {
                header.style.background = 'rgba(10, 10, 12, 0.6)';
            }
        });
    }

    // ESC для закрытия модалок и меню
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            closeMobileMenu();
        }
    });

    // Анимация появления контента
    const contentElements = document.querySelectorAll('.privacy-content, .privacy-toc');
    contentElements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });

    // Закрытие мобильного меню при ресайзе
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            closeMobileMenu();
        }
    });

    // COOKIE CONSENT FUNCTIONALITY
    const cookieModal = document.getElementById('cookieModal');
    if (cookieModal) {
        const closeCookieModal = document.getElementById('closeCookieModal');
        const cookieAcceptBtn = document.getElementById('cookieAcceptBtn');
        const cookieRejectBtn = document.getElementById('cookieRejectBtn');
        const cookieCustomBtn = document.getElementById('cookieCustomBtn');
        const functionalCookies = document.getElementById('functionalCookies');
        const analyticalCookies = document.getElementById('analyticalCookies');
        const advertisingCookies = document.getElementById('advertisingCookies');
        const cookieConsentLink = document.getElementById('cookieConsentLink');
        const cookieBanner = document.getElementById('cookieBanner');
        const bannerAcceptBtn = document.getElementById('bannerAcceptBtn');
        const bannerRejectBtn = document.getElementById('bannerRejectBtn');
        const bannerSettingsBtn = document.getElementById('bannerSettingsBtn');

        const COOKIE_CONSENT_KEY = 'onthego_cookie_consent';
        const COOKIE_BANNER_SHOWN = 'onthego_banner_shown';

        // Проверка согласия на cookies
        function hasCookieConsent() {
            return localStorage.getItem(COOKIE_CONSENT_KEY) !== null;
        }

        // Получение текущих настроек cookies
        function getCookieSettings() {
            const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
            return null;
        }

        // Сохранение настроек cookies
        function saveCookieSettings(settings) {
            const consent = {
                ...settings,
                timestamp: new Date().toISOString(),
                version: '2.0'
            };
            localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
            
            applyCookieSettings(consent);
            showToast('Настройки cookies сохранены');
            cookieModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            hideCookieBanner();
        }

        // Применение настроек cookies
        function applyCookieSettings(settings) {
            // Обязательные cookies всегда включены
            
            // Функциональные cookies
            if (!settings.functional) {
                console.log('Функциональные cookies отключены');
            }
            
            // Аналитические cookies
            if (!settings.analytical) {
                window['ga-disable-UA-XXXXX-Y'] = true;
                console.log('Аналитические cookies отключены');
            }
            
            // Рекламные cookies
            if (!settings.advertising) {
                console.log('Рекламные cookies отключены');
            }
        }

        // Показать Cookie Modal
        function showCookieModal() {
            const settings = getCookieSettings();
            
            if (settings) {
                if (functionalCookies) functionalCookies.checked = settings.functional || true;
                if (analyticalCookies) analyticalCookies.checked = settings.analytical || false;
                if (advertisingCookies) advertisingCookies.checked = settings.advertising || false;
            }
            
            cookieModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Показать Cookie Banner
        function showCookieBanner() {
            const bannerShown = localStorage.getItem(COOKIE_BANNER_SHOWN);
            
            if (!hasCookieConsent() && !bannerShown && cookieBanner) {
                setTimeout(() => {
                    cookieBanner.classList.add('active');
                    localStorage.setItem(COOKIE_BANNER_SHOWN, 'true');
                }, 2000);
            }
        }

        // Скрыть Cookie Banner
        function hideCookieBanner() {
            if (cookieBanner) {
                cookieBanner.classList.remove('active');
            }
        }

        // Показать Toast уведомление
        function showToast(message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = 'cookie-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: ${type === 'success' ? 'var(--gradient-main)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
                color: white;
                padding: 16px 24px;
                border-radius: var(--radius-lg);
                z-index: 10001;
                font-weight: 600;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
                display: flex;
                align-items: center;
                gap: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            `;
            
            const icon = type === 'success' ? 
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' :
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
            
            toast.innerHTML = `
                <div class="toast-icon">${icon}</div>
                <span>${message}</span>
            `;
            
            const toastContainer = document.getElementById('toastContainer');
            if (toastContainer) {
                toastContainer.appendChild(toast);
                
                setTimeout(() => {
                    toast.style.transform = 'translateX(0)';
                    toast.style.opacity = '1';
                }, 10);
                
                setTimeout(() => {
                    toast.style.transform = 'translateX(100%)';
                    toast.style.opacity = '0';
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 400);
                }, 4000);
            }
        }

        // Обработчики событий для Cookie Modal
        if (closeCookieModal) {
            closeCookieModal.addEventListener('click', () => {
                cookieModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        }

        cookieModal.addEventListener('click', (e) => {
            if (e.target === cookieModal) {
                cookieModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });

        // Принять все cookies
        if (cookieAcceptBtn) {
            cookieAcceptBtn.addEventListener('click', () => {
                const settings = {
                    essential: true,
                    functional: true,
                    analytical: true,
                    advertising: true
                };
                saveCookieSettings(settings);
            });
        }

        // Отклонить все необязательные cookies
        if (cookieRejectBtn) {
            cookieRejectBtn.addEventListener('click', () => {
                const settings = {
                    essential: true,
                    functional: false,
                    analytical: false,
                    advertising: false
                };
                saveCookieSettings(settings);
            });
        }

        // Сохранить выборочные настройки
        if (cookieCustomBtn) {
            cookieCustomBtn.addEventListener('click', () => {
                const settings = {
                    essential: true,
                    functional: functionalCookies ? functionalCookies.checked : true,
                    analytical: analyticalCookies ? analyticalCookies.checked : false,
                    advertising: advertisingCookies ? advertisingCookies.checked : false
                };
                saveCookieSettings(settings);
            });
        }

        // Обработчики для Cookie Banner
        if (bannerAcceptBtn) {
            bannerAcceptBtn.addEventListener('click', () => {
                const settings = {
                    essential: true,
                    functional: true,
                    analytical: true,
                    advertising: true
                };
                saveCookieSettings(settings);
            });
        }

        if (bannerRejectBtn) {
            bannerRejectBtn.addEventListener('click', () => {
                const settings = {
                    essential: true,
                    functional: false,
                    analytical: false,
                    advertising: false
                };
                saveCookieSettings(settings);
            });
        }

        if (bannerSettingsBtn) {
            bannerSettingsBtn.addEventListener('click', () => {
                hideCookieBanner();
                showCookieModal();
            });
        }

        // Обработчик для ссылки Cookie Consent Tool
        if (cookieConsentLink) {
            cookieConsentLink.addEventListener('click', (e) => {
                e.preventDefault();
                showCookieModal();
            });
        }

        // Инициализация при загрузке страницы
        function initCookieConsent() {
            const settings = getCookieSettings();
            
            if (settings) {
                applyCookieSettings(settings);
            } else {
                showCookieBanner();
            }
        }

        initCookieConsent();
    }

    // Автоматическое закрытие модалок при клике вне контента
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });

    // Плавная анимация для всех ссылок
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerOffset = 100;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Исправление сеток на мобильных
    function fixMobileGrids() {
        if (window.innerWidth <= 992) {
            document.querySelectorAll('.privacy-content [style*="grid-template-columns"]').forEach(el => {
                if (!el.style.gridTemplateColumns.includes('1fr')) {
                    el.style.gridTemplateColumns = '1fr';
                }
            });
        }
    }

    fixMobileGrids();
    window.addEventListener('resize', fixMobileGrids);

    console.log('ONTHEGO Privacy Page loaded successfully');
});