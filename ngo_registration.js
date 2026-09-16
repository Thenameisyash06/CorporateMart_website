/* LLP Registration page functionality */

(function () {
    "use strict";

    const items = document.querySelectorAll(".llp-reveal");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
        items.forEach(item => item.classList.add("llp-visible"));
    } else {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("llp-visible");
                obs.unobserve(entry.target);
            });
        }, {
            threshold: 0.12,
            rootMargin: "0px 0px -45px 0px"
        });

        items.forEach(item => observer.observe(item));
    }

    /* Consultation form demo.
       Replace this handler with your Formspree/API/WordPress endpoint
       when the backend is connected. */
    const form = document.getElementById("llpLeadForm");
    const success = document.getElementById("llpFormSuccess");

    if (form) {
        form.addEventListener("submit", event => {
            handleWeb3FormsSubmit(event, form, success);
        });
    }

    /* Smooth page anchors */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", function (event) {
            const id = this.getAttribute("href");

            if (!id || id === "#") return;

            if (id === "#llpLeadForm") {
                event.preventDefault();
                document.getElementById("llpName")?.focus();
                return;
            }

            const target = document.querySelector(id);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({
                behavior: reduced ? "auto" : "smooth",
                block: "start"
            });
        });
    });
})();

/* Side navigation: highlight the section currently visible. */
(function () {
    const sideNav = document.getElementById("llpSideNav");
    if (!sideNav) return;

    const links = [...sideNav.querySelectorAll("nav a[href^='#']")];
    const sections = links
        .map(link => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    const setActive = id => {
        links.forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
    };

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
            const visible = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (visible) setActive(visible.target.id);
        }, {
            root: null,
            rootMargin: "-18% 0px -62% 0px",
            threshold: [0.05, 0.15, 0.3, 0.5]
        });

        sections.forEach(section => observer.observe(section));
    }

    links.forEach(link => {
        link.addEventListener("click", () => {
            setActive(link.getAttribute("href").slice(1));
        });
    });
})();