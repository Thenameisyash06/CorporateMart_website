/* One Person Company (OPC) Registration page functionality */

(function () {
    "use strict";

    /* =========================================================
       SCROLL REVEAL ANIMATIONS
    ========================================================= */
    const items = document.querySelectorAll(".opc-reveal");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
        items.forEach(item => item.classList.add("opc-visible"));
    } else {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("opc-visible");
                obs.unobserve(entry.target);
            });
        }, {
            threshold: 0.12,
            rootMargin: "0px 0px -45px 0px"
        });

        items.forEach(item => observer.observe(item));
    }

    /* =========================================================
       CONSULTATION LEAD FORM SUBMISSION
    ========================================================= */
    const form = document.getElementById("opcLeadForm");
    const success = document.getElementById("opcFormSuccess");

    if (form) {
        form.addEventListener("submit", event => {
            handleWeb3FormsSubmit(event, form, success);
        });
    }

    /* =========================================================
       SMOOTH PAGE ANCHOR SCROLLING
    ========================================================= */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", function (event) {
            const id = this.getAttribute("href");

            if (!id || id === "#") return;

            if (id === "#opcLeadForm") {
                event.preventDefault();
                document.getElementById("opcName")?.focus();
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

/* =========================================================
   STICKY SIDE NAVIGATION ACTIVE HIGHLIGHT
========================================================= */
(function () {
    const sideNav = document.getElementById("siSideNav");
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

/* =========================================================
   MULTI-LEVEL SERVICE DROPDOWNS
========================================================= */
document.querySelectorAll(".nav-dropdown").forEach(dropdown => {
    const items = dropdown.querySelectorAll(
        ":scope > .mega-dropdown > .dropdown-item.has-submenu"
    );

    if (!items.length) return;

    /*
     * First item is selected automatically
     * whenever the main dropdown is entered.
     */
    dropdown.addEventListener("mouseenter", () => {
        items.forEach(item => {
            item.classList.remove("active");
        });

        items[0].classList.add("active");
        checkSubmenuDirection(items[0]);
    });

    /*
     * When another item is hovered,
     * close the previous submenu and
     * open only the current one.
     */
    items.forEach(item => {
        item.addEventListener("mouseenter", () => {
            items.forEach(other => {
                if (other !== item) {
                    other.classList.remove("active");
                }
            });

            item.classList.add("active");
            checkSubmenuDirection(item);
        });
    });

    /*
     * When leaving the entire dropdown,
     * remove active states.
     */
    dropdown.addEventListener("mouseleave", () => {
        items.forEach(item => {
            item.classList.remove("active");
        });
    });
});

/* =========================================================
   AUTOMATIC LEFT / RIGHT POSITIONING
========================================================= */
function checkSubmenuDirection(item) {
    const submenu = item.querySelector(":scope > .sub-dropdown");
    if (!submenu) return;

    submenu.classList.remove("open-left");

    const previousVisibility = submenu.style.visibility;
    const previousOpacity = submenu.style.opacity;
    const previousPointer = submenu.style.pointerEvents;

    submenu.style.visibility = "hidden";
    submenu.style.opacity = "1";
    submenu.style.pointerEvents = "none";

    const rect = submenu.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    const rightSpace = window.innerWidth - itemRect.right;
    const leftSpace = itemRect.left;

    if (rightSpace < rect.width + 20 && leftSpace >= rect.width + 20) {
        submenu.classList.add("open-left");
    }

    submenu.style.visibility = previousVisibility;
    submenu.style.opacity = previousOpacity;
    submenu.style.pointerEvents = previousPointer;
}
