/* =========================================================
   PUBLIC LIMITED COMPANY REGISTRATION PAGE
   Interactive Behaviors
   CorporateMart Design System
========================================================= */

(function () {
    'use strict';

    /* ---------------------------------------------------------
       PAGE LOADER
    --------------------------------------------------------- */
    function initLoader() {
        var loader = document.getElementById('pageLoader');
        if (!loader) return;

        var logo = loader.querySelector('.loader-logo');
        var savedLogo = null;
        try {
            savedLogo = localStorage.getItem('siteLogo');
        } catch (e) {}

        if (savedLogo && logo) {
            logo.src = savedLogo;
        }

        window.addEventListener('load', function () {
            setTimeout(function () {
                loader.style.opacity = '0';
                loader.style.transition = 'opacity 0.4s ease';
                setTimeout(function () {
                    loader.style.display = 'none';
                }, 400);
            }, 300);
        });
    }

    /* ---------------------------------------------------------
       NAVBAR LOGO
    --------------------------------------------------------- */
    function initNavbarLogo() {
        var navLogo = document.getElementById('navbarLogo');
        if (!navLogo) return;

        var savedLogo = null;
        try {
            savedLogo = localStorage.getItem('siteLogo');
        } catch (e) {}

        if (savedLogo) {
            navLogo.src = savedLogo;
        }
    }

    /* ---------------------------------------------------------
       STICKY SIDEBAR ACTIVE SECTION
    --------------------------------------------------------- */
    function initSidebarScrollSpy() {
        var sideNav = document.getElementById('siSideNav');
        if (!sideNav) return;

        var navLinks = sideNav.querySelectorAll('nav a');
        var sections = [];

        navLinks.forEach(function (link) {
            var targetId = link.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                var section = document.getElementById(targetId.substring(1));
                if (section) {
                    sections.push({ link: link, section: section });
                }
            }
        });

        if (sections.length === 0) return;

        function updateActive() {
            var scrollY = window.scrollY + 140;
            var current = sections[0];

            sections.forEach(function (item) {
                if (item.section.offsetTop <= scrollY) {
                    current = item;
                }
            });

            navLinks.forEach(function (link) {
                link.classList.remove('active');
            });

            if (current) {
                current.link.classList.add('active');
            }
        }

        window.addEventListener('scroll', updateActive, { passive: true });
        updateActive();
    }

    /* ---------------------------------------------------------
       SCROLL REVEAL ANIMATIONS
    --------------------------------------------------------- */
    function initScrollReveal() {
        var reveals = document.querySelectorAll('.si-reveal');
        if (reveals.length === 0) return;

        if (!('IntersectionObserver' in window)) {
            reveals.forEach(function (el) {
                el.classList.add('si-visible');
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('si-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        reveals.forEach(function (el) {
            observer.observe(el);
        });
    }

    /* ---------------------------------------------------------
       LEAD FORM SUBMISSION
    --------------------------------------------------------- */
    function initLeadForm() {
        var form = document.getElementById('siLeadForm');
        if (!form) return;

        var successMsg = document.getElementById('siFormSuccess');

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = document.getElementById('siName');
            var phone = document.getElementById('siPhone');
            var email = document.getElementById('siEmail');
            var city = document.getElementById('siCity');

            if (!name || !name.value.trim()) return;
            if (!phone || !phone.value.trim()) return;
            if (!email || !email.value.trim()) return;
            if (!city || !city.value.trim()) return;

            var submitBtn = form.querySelector('.cr-submit');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Submitting...';
            }

            setTimeout(function () {
                form.reset();
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Get Free Consultation <span>→</span>';
                }
                if (successMsg) {
                    successMsg.classList.add('show');
                    setTimeout(function () {
                        successMsg.classList.remove('show');
                    }, 5000);
                }
            }, 800);
        });
    }

    /* ---------------------------------------------------------
       FAQ ACCORDION
    --------------------------------------------------------- */
    function initFAQ() {
        var faqItems = document.querySelectorAll('.si-faq-item');
        if (faqItems.length === 0) return;

        faqItems.forEach(function (item) {
            var question = item.querySelector('.si-faq-question');
            if (!question) return;

            question.addEventListener('click', function () {
                var isActive = item.classList.contains('active');

                faqItems.forEach(function (otherItem) {
                    otherItem.classList.remove('active');
                });

                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    }

    /* ---------------------------------------------------------
       SMOOTH SCROLL FOR ANCHOR LINKS
    --------------------------------------------------------- */
    function initSmoothScroll() {
        var links = document.querySelectorAll('a[href^="#"]');
        if (links.length === 0) return;

        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                var href = this.getAttribute('href');
                if (href === '#' || href === '#!') return;

                var target = document.getElementById(href.substring(1));
                if (!target) return;

                e.preventDefault();
                var offset = 100;
                var top = target.getBoundingClientRect().top + window.scrollY - offset;

                window.scrollTo({
                    top: top,
                    behavior: 'smooth'
                });
            });
        });
    }

    /* ---------------------------------------------------------
       INITIALIZE ALL
    --------------------------------------------------------- */
    function init() {
        initLoader();
        initNavbarLogo();
        initSidebarScrollSpy();
        initScrollReveal();
        initLeadForm();
        initFAQ();
        initSmoothScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
