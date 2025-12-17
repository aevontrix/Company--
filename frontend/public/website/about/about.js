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
    
    // SCROLL REVEAL ANIMATION
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

    // MODAL FUNCTIONALITY
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
        window.location.href = 'main.html#login';
    });

    document.getElementById('goToPlatformRegisterBtn').addEventListener('click', () => {
        window.location.href = 'main.html#register';
    });

    // HEADER BACKGROUND ON SCROLL
    const header = document.querySelector('.header-glass');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(10, 10, 12, 0.8)';
        } else {
            header.style.background = 'rgba(10, 10, 12, 0.6)';
        }
    });

    // ESC для закрытия модалок и меню
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

    // SMOOTH SCROLL FOR ANCHOR LINKS (для ссылок на index.html)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Если ссылка ведет на якорь в index.html
            if (href.includes('index.html#')) {
                e.preventDefault();
                const targetId = href.split('#')[1];
                
                // Переходим на index.html
                window.location.href = href;
            }
        });
    });
});