// Функции для управления бургер-меню
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

// Основной код после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    
    // Анимация появления элементов при скролле
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

    // Управление бургер-меню
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

    // Управление модальными окнами
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    // Кнопки открытия модальных окон на десктопе
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
    
    // Кнопки открытия модальных окон в мобильном меню
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

    // Функция для закрытия всех модальных окон
    function closeAllModals() {
        loginModal.classList.remove('active');
        registerModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Назначение обработчиков для кнопок закрытия модальных окон
    document.getElementById('closeLoginModal').addEventListener('click', closeAllModals);
    document.getElementById('closeRegisterModal').addEventListener('click', closeAllModals);
    document.getElementById('cancelLoginBtn').addEventListener('click', closeAllModals);
    document.getElementById('cancelRegisterBtn').addEventListener('click', closeAllModals);

    // Закрытие модальных окон по клику на оверлей
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) closeAllModals();
    });
    registerModal.addEventListener('click', (e) => {
        if (e.target === registerModal) closeAllModals();
    });

    // Кнопки перехода на платформу
    document.getElementById('goToPlatformLoginBtn').addEventListener('click', () => {
        window.location.href = 'main.html#login';
    });

    document.getElementById('goToPlatformRegisterBtn').addEventListener('click', () => {
        window.location.href = 'main.html#register';
    });

    // Изменение фона шапки при скролле
    const header = document.querySelector('.header-glass');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(10, 10, 12, 0.8)';
        } else {
            header.style.background = 'rgba(10, 10, 12, 0.6)';
        }
    });

    // Плавная прокрутка для якорных ссылок
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

    // Закрытие меню и модальных окон клавишей ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            closeMobileMenu();
        }
    });

    // Закрытие мобильного меню при изменении размера окна
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            closeMobileMenu();
        }
    });

    // Инициализация карты (Almaty, Kazakhstan)
    function initMap() {
        const map = L.map('contactMap').setView([43.238, 76.882], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);
        
        const customIcon = L.divIcon({
            html: `<div style="width: 40px; height: 40px; background: var(--gradient-main); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 0 20px rgba(124, 58, 237, 0.5);">C</div>`,
            className: 'custom-div-icon',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        const marker = L.marker([43.238, 76.882], { icon: customIcon })
            .addTo(map)
            .bindPopup('<b>ONTHEGO Office</b><br>пр. Абылай хана 79<br>Бизнес-центр "Глобус"');
        
        marker.openPopup();
    }
    
    // Инициализация карты после загрузки страницы
    if (document.getElementById('contactMap')) {
        initMap();
    }

    // Обработка формы обратной связи
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const formError = document.getElementById('formError');
    const formFieldsContainer = document.getElementById('formFieldsContainer');
    const formTitle = document.getElementById('formTitle');
    const formDesc = document.getElementById('formDesc');
    
    // Кастомная валидация email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function(e) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(this.value) && this.value !== '') {
                this.setCustomValidity('Пожалуйста, введите корректный email адрес');
            } else {
                this.setCustomValidity('');
            }
        });
    }
    
    // Отправка формы обратной связи
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Проверка валидности формы перед отправкой
            if (!contactForm.checkValidity()) {
                // Показ ошибок валидации
                const invalidElements = contactForm.querySelectorAll(':invalid');
                invalidElements.forEach(el => {
                    el.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                });
                return;
            }
            
            // Скрытие предыдущих сообщений
            formSuccess.style.display = 'none';
            formError.style.display = 'none';
            
            // Показ состояния загрузки
            const submitBtn = contactForm.querySelector('.form-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Отправка...';
            submitBtn.disabled = true;
            
            // Сбор данных формы
            const formData = new FormData(this);
            
            try {
                // Отправка данных на Formspree
                const response = await fetch(this.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    // Успешная отправка
                    // Скрытие полей формы и показ сообщения об успехе
                    formFieldsContainer.style.display = 'none';
                    formTitle.style.display = 'none';
                    formDesc.style.display = 'none';
                    
                    formSuccess.style.display = 'block';
                    contactForm.reset();
                    
                    // Восстановление состояния кнопки
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    
                } else {
                    // Ошибка при отправке
                    formError.style.display = 'block';
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    
                    setTimeout(() => {
                        formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            } catch (error) {
                // Ошибка сети
                formError.style.display = 'block';
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                setTimeout(() => {
                    formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                console.error('Ошибка отправки формы:', error);
            }
        });
    }

    // Сброс стилей ошибок при фокусе на полях формы
    const formInputs = document.querySelectorAll('.form-input, .form-textarea, .form-select');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = '';
        });
        input.addEventListener('input', function() {
            this.style.borderColor = '';
        });
    });

});