/* Startup India Registration page functionality */

(function () {
    "use strict";

    /* =========================================================
       SCROLL REVEAL ANIMATIONS
    ========================================================= */
    const items = document.querySelectorAll(".si-reveal");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
        items.forEach(item => item.classList.add("si-visible"));
    } else {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("si-visible");
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
    const form = document.getElementById("siLeadForm");
    const success = document.getElementById("siFormSuccess");

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

            if (id === "#siLeadForm" || id === "#consultation") {
                event.preventDefault();
                document.getElementById("siName")?.focus();
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

    /* =========================================================
       FAQ ACCORDION
    ========================================================= */
    const faqs = document.querySelectorAll('.si-faq-question');
    faqs.forEach(faq => {
        faq.addEventListener('click', () => {
            const item = faq.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close all other faqs
            document.querySelectorAll('.si-faq-item').forEach(el => {
                el.classList.remove('active');
            });

            if (!isActive) {
                item.classList.add('active');
            }
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

    dropdown.addEventListener("mouseenter", () => {
        items.forEach(item => {
            item.classList.remove("active");
        });

        items[0].classList.add("active");
        checkSubmenuDirection(items[0]);
    });

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

(function () {
  var wrap = document.getElementById("consultation");
  var inner = document.getElementById("siFlipInner");
  var toCert = document.getElementById("showCertificateBtn");
  var toForm = document.getElementById("showFormBtn");
  var openBtn = document.getElementById("siCertOpen");
  var lightbox = document.getElementById("siCertLightbox");
  var lightImg = document.getElementById("siCertLightboxImg");
  var cardImg = document.getElementById("siCertImg");
  var flipping = false;

  function setHeight() {
    if (!inner) return;
    var front = inner.querySelector(".si-flip-front");
    var back = inner.querySelector(".si-flip-back");
    if (!front || !back) return;
    inner.style.height = "auto";
    inner.style.height = Math.max(front.offsetHeight, back.offsetHeight) + "px";
  }

  function flip(showBack) {
    if (!wrap || flipping) return;
    flipping = true;
    wrap.classList.toggle("is-flipped", !!showBack);
    setTimeout(function () {
      setHeight();
      flipping = false;
    }, 700); // match CSS transition 0.7s
  }

  if (toCert) {
    toCert.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (flipping) return;
      setHeight();
      flip(true);
    });
  }

  if (toForm) {
    toForm.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (flipping) return;
      flip(false);
    });
  }

  function openLightbox() {
    if (!lightbox) return;
    if (lightImg && cardImg) {
      lightImg.src = cardImg.currentSrc || cardImg.src;
      lightImg.style.transform = "none";
    }
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (openBtn) {
    openBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openLightbox();
    });
  }

  if (lightbox) {
    lightbox.querySelectorAll("[data-close-cert]").forEach(function (el) {
      el.addEventListener("click", closeLightbox);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });

  window.addEventListener("load", setHeight);
  window.addEventListener("resize", setHeight);
})();