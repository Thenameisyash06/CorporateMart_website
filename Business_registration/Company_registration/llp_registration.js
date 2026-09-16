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

    function closeDropdowns(except = null) {
  dropdowns.forEach(dropdown => {
    if (dropdown !== except) {
      dropdown.classList.remove("active");
      dropdown.querySelector(".service-btn").setAttribute("aria-expanded", "false");
    }
  });
}

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

    const submenu =
        item.querySelector(":scope > .sub-dropdown");

    if (!submenu) return;


    submenu.classList.remove("open-left");


    /*
     * Temporarily make the submenu visible
     * so we can calculate its dimensions.
     */

    const previousVisibility =
        submenu.style.visibility;

    const previousOpacity =
        submenu.style.opacity;

    const previousPointer =
        submenu.style.pointerEvents;


    submenu.style.visibility = "hidden";
    submenu.style.opacity = "1";
    submenu.style.pointerEvents = "none";


    const rect =
        submenu.getBoundingClientRect();


    const itemRect =
        item.getBoundingClientRect();


    const rightSpace =
        window.innerWidth - itemRect.right;


    const leftSpace =
        itemRect.left;


    /*
     * Open LEFT when right side
     * doesn't have enough space.
     */

    if (
        rightSpace < rect.width + 20 &&
        leftSpace >= rect.width + 20
    ) {

        submenu.classList.add("open-left");

    }


    submenu.style.visibility =
        previousVisibility;

    submenu.style.opacity =
        previousOpacity;

    submenu.style.pointerEvents =
        previousPointer;

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
    const sideNav = document.getElementById("siSideNav") || document.getElementById("llpSideNav");
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
