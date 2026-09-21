/* =========================================================
   WEB3FORMS SUBMISSION HANDLER
   =========================================================
   To connect your forms to Web3Forms:
   1. Get your free Access Key from https://web3forms.com
   2. Replace "YOUR_ACCESS_KEY_HERE" below with your Access Key
   (Alternatively, you can set it directly in each HTML file inside:
    <input type="hidden" name="access_key" value="YOUR_ACCESS_KEY_HERE">)
========================================================= */
const WEB3FORMS_ACCESS_KEY = "f9e8e977-8a5c-4979-8cf0-e303edbcac00";

async function handleWeb3FormsSubmit(event, form, successElement) {
    event.preventDefault();

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const button = form.querySelector("button[type='submit']");
    const originalButtonHtml = button ? button.innerHTML : "Submit";

    if (button) {
        button.disabled = true;
        button.innerHTML = 'Sending... <span>⏳</span>';
    }

    const formData = new FormData(form);

    // If access_key in form is placeholder or missing, inject the JS constant
    const currentKey = formData.get("access_key");
    if (!currentKey || currentKey === "YOUR_ACCESS_KEY_HERE") {
        formData.set("access_key", WEB3FORMS_ACCESS_KEY);
    }

    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: json
        });

        const result = await response.json();

        if (result.success) {
            form.reset();
            if (successElement) {
                successElement.classList.add("show");
                setTimeout(() => {
                    successElement.classList.remove("show");
                }, 6000);
            } else {
                alert("Thank you! Your request has been submitted successfully.");
            }
        } else {
            console.error("Web3Forms error:", result);
            alert(result.message || "Failed to submit. Please check your Web3Forms Access Key.");
        }
    } catch (error) {
        console.error("Submission failed:", error);
        alert("Failed to submit form. Please check your internet connection.");
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalButtonHtml;
        }
    }
}


const dropdowns = document.querySelectorAll(".nav-dropdown");
const searchTrigger = document.querySelector(".search-trigger");
const searchPanel = document.querySelector(".search-panel");
const searchClose = document.querySelector(".search-close");
const searchInput = document.querySelector("#siteSearch");
const menuTrigger = document.querySelector(".menu-trigger");
const sideMenu = document.querySelector(".side-menu");
const menuOverlay = document.querySelector(".menu-overlay");
const sideMenuClose = document.querySelector(".side-menu-close");
const suggestionButtons = document.querySelectorAll(".search-suggestions button");
const siteHeader = document.querySelector(".site-header");
document.addEventListener("DOMContentLoaded", () => {

    const loader =
        document.getElementById("pageLoader");

    const loaderLogo =
        document.getElementById("loaderLogoWrapper");

    const navbarLogo =
        document.getElementById("navbarLogo");


    if (!loader || !loaderLogo || !navbarLogo) {
        console.log("Loader elements missing");
        return;
    }


    /* 
       Give the browser time to render
       the navbar and logo.
    */

    setTimeout(() => {

        const loaderRect =
            loaderLogo.getBoundingClientRect();

        const navbarRect =
            navbarLogo.getBoundingClientRect();


        /* Center of loading logo */

        const loaderX =
            loaderRect.left +
            loaderRect.width / 2;

        const loaderY =
            loaderRect.top +
            loaderRect.height / 2;


        /* Center of navbar logo */

        const navbarX =
            navbarRect.left +
            navbarRect.width / 2;

        const navbarY =
            navbarRect.top +
            navbarRect.height / 2;


        /* Distance */

        const moveX =
            navbarX - loaderX;

        const moveY =
            navbarY - loaderY;


        /* Scale */

        const scale =
            (navbarRect.width /
            loaderRect.width)*1.6;


        loader.style.setProperty(
            "--logo-x",
            `${moveX}px`
        );

        loader.style.setProperty(
            "--logo-y",
            `${moveY}px`
        );

        loader.style.setProperty(
            "--logo-scale",
            scale
        );


        /*
         * START LOGO SLIDE
         */

        loader.classList.add("logo-moving");


        /*
         * Wait for slide to finish
         */

        setTimeout(() => {

            loader.classList.add("hide");

        }, 900);


        /*
         * Completely remove loader
         */

        setTimeout(() => {

            loader.remove();

        }, 1400);


    }, 1000);

});

function handleHeaderScroll() {
    if (window.scrollY > 20) {
        siteHeader.classList.add("scrolled");
    } else {
        siteHeader.classList.remove("scrolled");
    }
}

window.addEventListener("scroll", handleHeaderScroll);

handleHeaderScroll();



/* =========================================================
   SCROLL REVEAL
========================================================= */

const revealElements = document.querySelectorAll(
    `
    .cr-section,
    .cr-hero-content,
    .cr-consult-card,
    .cr-type-card,
    .cr-benefit,
    .cr-service,
    .cr-document-card,
    .cr-document-item,
    .cr-process-step,
    .cr-cost-box,
    .cr-why-card,
    .cr-compliance-list div,
    .cr-faq details,
    .cr-cta-content
    `
);


const revealObserver = new IntersectionObserver(

    (entries, observer) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add(
                    "cr-visible"
                );

                /*
                 * Stop observing after animation.
                 * This means the animation happens
                 * only once.
                 */

                observer.unobserve(
                    entry.target
                );

            }

        });

    },

    {
        threshold: 0.12,

        rootMargin:
            "0px 0px -50px 0px"
    }

);


revealElements.forEach(element => {

    revealObserver.observe(element);

});

function closeDropdowns(except = null) {
  dropdowns.forEach(dropdown => {
    if (dropdown !== except) {
      dropdown.classList.remove("active");
      dropdown.querySelector(".service-btn").setAttribute("aria-expanded", "false");
    }
  });
}

dropdowns.forEach(dropdown => {
  const button = dropdown.querySelector(".service-btn");

  button.addEventListener("click", event => {
    event.stopPropagation();
    const isActive = dropdown.classList.contains("active");
    closeDropdowns();
    if (!isActive) {
      dropdown.classList.add("active");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

document.addEventListener("click", () => closeDropdowns());

const searchTriggerText =
    document.getElementById("searchTriggerText");

if (searchTriggerText) {

    const searchSuggestions = [
        "services",
        "blogs",
        "certifications",
        "Business Registration",
        "Trademark & IP",
        "Tax & Compliance"
    ];

    let textIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function animateSearchTrigger() {

        const currentText =
            searchSuggestions[textIndex];

        if (!deleting) {

            charIndex++;

            searchTriggerText.textContent =
                currentText.substring(0, charIndex);

            if (charIndex >= currentText.length) {

                deleting = true;

                setTimeout(
                    animateSearchTrigger,
                    1800
                );

                return;
            }

        } else {

            charIndex--;

            searchTriggerText.textContent =
                currentText.substring(0, charIndex);

            if (charIndex <= 0) {

                deleting = false;

                textIndex =
                    (textIndex + 1) %
                    searchSuggestions.length;
            }
        }

        setTimeout(
            animateSearchTrigger,
            deleting ? 35 : 75
        );
    }

    animateSearchTrigger();
}

function openSearch() {
  closeDropdowns();
  if (searchPanel) {
    searchPanel.classList.add("open");
    searchPanel.setAttribute("aria-hidden", "false");
  }
  document.body.classList.add("search-open");
  if (searchInput) requestAnimationFrame(() => searchInput.focus());
}

function closeSearch() {
  if (searchPanel) {
    searchPanel.classList.remove("open");
    searchPanel.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("search-open");
}

if (searchTrigger) searchTrigger.addEventListener("click", openSearch);
if (searchClose) searchClose.addEventListener("click", closeSearch);

suggestionButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (searchInput) {
      searchInput.value = button.textContent.trim();
      searchInput.focus();
    }
  });
});

function openMenu() {
  closeDropdowns();
  closeSearch();
  if (sideMenu) {
    sideMenu.classList.add("open");
    sideMenu.setAttribute("aria-hidden", "false");
  }
  if (menuOverlay) {
    menuOverlay.classList.add("open");
    menuOverlay.setAttribute("aria-hidden", "false");
  }
  if (menuTrigger) menuTrigger.setAttribute("aria-expanded", "true");
  document.body.classList.add("menu-open");
}

const mobileServices = document.querySelectorAll(".mobile-service");

mobileServices.forEach(service => {
    const button = service.querySelector("button");
    const submenu = service.querySelector(".mobile-submenu");
    if (!button || !submenu) return;

    button.addEventListener("click", () => {
        const isOpen = service.classList.contains("open");

        // Close all other top-level categories
        mobileServices.forEach(item => {
            if (item !== service) {
                item.classList.remove("open");
                const sub = item.querySelector(".mobile-submenu");
                if (sub) sub.classList.remove("open");
                // Also close any open sub-groups inside them
                item.querySelectorAll(".mobile-sub-title.open").forEach(st => {
                    st.classList.remove("open");
                    st.setAttribute("aria-expanded", "false");
                });
                item.querySelectorAll(".mobile-subgroup.open").forEach(sg => {
                    sg.classList.remove("open");
                });
            }
        });

        if (!isOpen) {
            service.classList.add("open");
            submenu.classList.add("open");
        } else {
            service.classList.remove("open");
            submenu.classList.remove("open");
        }
    });
});

// Level 2: Sub-title click to toggle sub-group
document.querySelectorAll(".mobile-sub-title").forEach(subTitle => {
    const subGroup = subTitle.nextElementSibling;
    if (!subGroup || !subGroup.classList.contains("mobile-subgroup")) return;

    const toggle = () => {
        const isOpen = subTitle.classList.contains("open");
        subTitle.classList.toggle("open", !isOpen);
        subTitle.setAttribute("aria-expanded", String(!isOpen));
        subGroup.classList.toggle("open", !isOpen);
    };

    subTitle.addEventListener("click", toggle);
    subTitle.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
});

function closeMenu() {
  if (sideMenu) {
    sideMenu.classList.remove("open");
    sideMenu.setAttribute("aria-hidden", "true");
  }
  if (menuOverlay) {
    menuOverlay.classList.remove("open");
    menuOverlay.setAttribute("aria-hidden", "true");
  }
  if (menuTrigger) menuTrigger.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

if (menuTrigger) menuTrigger.addEventListener("click", openMenu);
if (sideMenuClose) sideMenuClose.addEventListener("click", closeMenu);
if (menuOverlay) menuOverlay.addEventListener("click", closeMenu);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeDropdowns();
    closeSearch();
    closeMenu();
  }
});

const searchFormEl = document.querySelector("#searchForm");
if (searchFormEl) {
  searchFormEl.addEventListener("submit", event => {
    event.preventDefault();
    if (!searchInput) return;
    const query = searchInput.value.trim();

    if (!query) {
      searchInput.focus();
      return;
    }

    // Replace this with your actual search implementation/API.
    console.log("Search query:", query);
  });
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


// Language selection
const languageSelect=document.querySelector("#languageSelect");
const languageToast=document.querySelector("#languageToast");
const languageNames={en:"English",hi:"हिन्दी",gu:"ગુજરાતી"};
const savedLanguage=localStorage.getItem("siteLanguage")||"en";
if(languageSelect){languageSelect.value=savedLanguage;document.documentElement.lang=savedLanguage;languageSelect.addEventListener("change",()=>{const v=languageSelect.value;localStorage.setItem("siteLanguage",v);document.documentElement.lang=v;if(languageToast){languageToast.textContent=`Language selected: ${languageNames[v]}`;languageToast.classList.add("show");setTimeout(()=>languageToast.classList.remove("show"),1800)}})}

// Dark mode with persistence
const themeToggle=document.querySelector("#themeToggle");const themeIcon=themeToggle?.querySelector(".theme-icon");const themeLabel=themeToggle?.querySelector(".theme-label");
const themeOverlay=document.querySelector("#themeOverlay");
const prefersReducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Flat bg colors for each theme, matching :root --bg / body.dark-mode --bg.
// Hardcoded (not read from CSS vars) because the overlay needs to show the
// TARGET theme's color before that theme has actually been applied to <body>.
const THEME_BG={light:"#f8fafc",dark:"#101827"};
const logo_loader = document.querySelector('.loader-logo');
const navbar_logo = document.querySelector('.navbar-logo');


function applyTheme(dark){
    document.body.classList.toggle("dark-mode", dark);
    if(themeIcon) themeIcon.textContent = dark ? "☀" : "☾";
    if(themeLabel) themeLabel.textContent = dark ? "Light" : "Dark";
    const targetLogo = dark ? "Your_paragraph_text__9_-removebg-preview.png" : "Your_paragraph_text__8_-removebg-preview.png";
    const navLogo = document.querySelector('.navbar-logo') || document.getElementById('navbarLogo');
    if (navLogo && navLogo.src) {
        navLogo.src = navLogo.src.replace(/Your_paragraph_text__(8|9)_-removebg-preview\.png/, targetLogo);
    }
    const loaderImg = document.querySelector('.loader-logo');
    if (loaderImg && loaderImg.src) {
        loaderImg.src = loaderImg.src.replace(/Your_paragraph_text__(8|9)_-removebg-preview\.png/, targetLogo);
    }
    themeToggle?.setAttribute("aria-pressed", String(dark));
    themeToggle?.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    localStorage.setItem("theme", dark ? "dark" : "light");
}

function setTheme(dark){
  // Reduced motion, or overlay/button missing for some reason: apply
  // instantly with no animation.
  if(!themeToggle||!themeOverlay||prefersReducedMotion){applyTheme(dark);return}

  const rect=themeToggle.getBoundingClientRect();
  const originX=rect.left+rect.width/2;
  const originY=rect.top+rect.height/2;

  // Distance to the farthest viewport corner from the button, so the
  // circle is guaranteed to fully cover the screen once expanded (from
  // a top-right button this farthest point is the bottom-left corner).
  const corners=[[0,0],[window.innerWidth,0],[0,window.innerHeight],[window.innerWidth,window.innerHeight]];
  const maxRadius=Math.ceil(Math.max(...corners.map(([cx,cy])=>Math.hypot(cx-originX,cy-originY))));
  const EASE="cubic-bezier(.65,0,.35,1)";
  const DURATION=".6s";

  // Overlay is colored as the TARGET theme, so it visibly overlaps/covers
  // the still-unchanged page as it grows — the real content underneath is
  // NOT touched yet at this point.
  themeOverlay.style.background=dark?THEME_BG.dark:THEME_BG.light;
  themeOverlay.style.transition="none";
  themeOverlay.style.clipPath=`circle(0px at ${originX}px ${originY}px)`;

  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      themeOverlay.style.transition=`clip-path ${DURATION} ${EASE}`;
      themeOverlay.style.clipPath=`circle(${maxRadius}px at ${originX}px ${originY}px)`;
    });
  });

  function onCovered(){
    themeOverlay.removeEventListener("transitionend",onCovered);
    // Fully covered now — safe to swap the real theme underneath, since
    // it's completely hidden behind the overlay at this instant.
    applyTheme(dark);

    // Recede the circle back toward the button, revealing the newly
    // themed page underneath as it shrinks away.
    requestAnimationFrame(()=>{
      themeOverlay.style.transition=`clip-path ${DURATION} ${EASE}`;
      themeOverlay.style.clipPath=`circle(0px at ${originX}px ${originY}px)`;
    });
    themeOverlay.addEventListener("transitionend",function onReceded(){
      themeOverlay.removeEventListener("transitionend",onReceded);
      themeOverlay.style.transition="none";
    },{once:true});
  }
  themeOverlay.addEventListener("transitionend",onCovered,{once:true});
}

window.addEventListener("resize", () => {
    document.querySelectorAll(".nav-dropdown").forEach(dropdown => {
        const active = dropdown.querySelector(
            ":scope > .mega-dropdown > .dropdown-item.has-submenu.active"
        );
        if (active && typeof checkSubmenuDirection === "function") {
            checkSubmenuDirection(active);
        }
    });
});

// Initial load: restore the saved theme instantly, never animated.
applyTheme(localStorage.getItem("theme")==="dark");
themeToggle?.addEventListener("click",()=>setTheme(!document.body.classList.contains("dark-mode")));

// Auto-attach Web3Forms submit listener to all consultation/lead forms
document.addEventListener("DOMContentLoaded", () => {
    const leadForms = document.querySelectorAll("form:not(#searchForm)");
    leadForms.forEach(form => {
        form.addEventListener("submit", (e) => {
            const successEl = form.parentElement.querySelector(".cr-form-success, .si-form-success, .pvt-form-success, .prop-form-success, .llp-form-success, .opc-form-success, .fcra-form-success, .trust-form-success, #crFormSuccess, #siFormSuccess, #pvtFormSuccess, #propFormSuccess, #llpFormSuccess, #opcFormSuccess, #fcraFormSuccess, #trustFormSuccess, #success");
            handleWeb3FormsSubmit(e, form, successEl);
        });
    });
});

/* =========================================================
   CERTIFICATE FLIP CARD & LIGHTBOX CONTROLLER
========================================================= */
(function () {
  function initCertFlip() {
    var wrap = document.getElementById("consultation") || document.querySelector(".si-consult-flip, .cr-consult-flip, .pvt-consult-flip, .llp-consult-flip, .opc-consult-flip, .prop-consult-flip, .fcra-consult-flip, .trust-consult-flip");
    if (!wrap) return;

    var inner = wrap.querySelector(".si-flip-inner, .cr-flip-inner") || document.getElementById("siFlipInner");
    var toCert = wrap.querySelector("#showCertificateBtn, [data-flip-to='cert'], .si-flip-btn");
    var toForm = wrap.querySelector("#showFormBtn, [data-flip-to='form']");
    var openBtn = wrap.querySelector("#siCertOpen, .si-cert-frame, .cr-cert-frame");
    var lightbox = document.getElementById("siCertLightbox") || document.querySelector(".si-cert-lightbox, .cr-cert-lightbox");
    var lightImg = lightbox ? lightbox.querySelector(".si-cert-lightbox-img, #siCertLightboxImg, .cr-cert-lightbox-img") : null;
    var cardImg = wrap.querySelector(".si-cert-img, #siCertImg, .cr-cert-img");
    var flipping = false;

    function setHeight() {
      if (!inner) return;
      var front = inner.querySelector(".si-flip-face:first-child, .si-flip-front, .cr-flip-front");
      var back = inner.querySelector(".si-flip-face:last-child, .si-flip-back, .cr-flip-back");
      if (!front || !back) return;
      inner.style.height = "auto";
      var maxH = Math.max(front.offsetHeight, back.offsetHeight);
      if (maxH > 100) {
        inner.style.height = maxH + "px";
      }
    }

    function flip(showBack) {
      if (!wrap || flipping) return;
      flipping = true;
      wrap.classList.toggle("is-flipped", !!showBack);
      setTimeout(function () {
        setHeight();
        flipping = false;
      }, 700);
    }

    if (toCert && !toCert.dataset.flipBound) {
      toCert.dataset.flipBound = "1";
      toCert.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (flipping) return;
        setHeight();
        flip(true);
      });
    }

    if (toForm && !toForm.dataset.flipBound) {
      toForm.dataset.flipBound = "1";
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

    if (openBtn && !openBtn.dataset.certBound) {
      openBtn.dataset.certBound = "1";
      openBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openLightbox();
      });
    }

    if (lightbox && !lightbox.dataset.certBound) {
      lightbox.dataset.certBound = "1";
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
    setTimeout(setHeight, 300);
    setTimeout(setHeight, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCertFlip);
  } else {
    initCertFlip();
  }
})();

/* Mega panel: left category switches right pane */
(function () {
  document.querySelectorAll(".mega-panel-dropdown").forEach(function (drop) {
    var side = drop.querySelectorAll(".mega-side-item");
    var panes = drop.querySelectorAll(".mega-panel-pane");
    if (!side.length || !panes.length) return;

    function show(name) {
      side.forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-mega-panel") === name);
      });
      panes.forEach(function (pane) {
        var on = pane.getAttribute("data-mega-pane") === name;
        pane.classList.toggle("is-active", on);
        pane.hidden = !on;
      });
    }

    side.forEach(function (btn) {
      btn.addEventListener("mouseenter", function () {
        show(btn.getAttribute("data-mega-panel"));
      });
      btn.addEventListener("focus", function () {
        show(btn.getAttribute("data-mega-panel"));
      });
    });

    // Reset to first category when opening
    drop.addEventListener("mouseenter", function () {
      var first = side[0];
      if (first) show(first.getAttribute("data-mega-panel"));
    });
  });
})();

/* All mega panels open right-aligned with the 'Other' service button */
(function () {
  var nav = document.querySelector(".header-row-2 .service-nav") || document.querySelector(".service-nav");
  if (!nav) return;

  var openDrop = null;
  var closeTimer = null;

  function getOtherBtn() {
    var buttons = nav.querySelectorAll(".service-btn");
    for (var i = buttons.length - 1; i >= 0; i--) {
      if (/other/i.test((buttons[i].textContent || "").trim())) return buttons[i];
    }
    return buttons.length ? buttons[buttons.length - 1] : null;
  }

  function place(panel) {
    if (!panel) return;
    var otherBtn = getOtherBtn();
    var navRect = nav.getBoundingClientRect();
    var otherRect = otherBtn ? otherBtn.getBoundingClientRect() : navRect;

    var top = Math.round(navRect.bottom + 6);
    var targetRight = Math.round(otherRect.right);

    var maxAvailableWidth = targetRight - 16;
    var panelW = Math.min(920, Math.max(320, maxAvailableWidth));
    var rightOffset = Math.max(8, Math.round(window.innerWidth - targetRight));

    panel.style.setProperty("top", top + "px", "important");
    panel.style.setProperty("right", rightOffset + "px", "important");
    panel.style.setProperty("left", "auto", "important");
    panel.style.setProperty("width", panelW + "px", "important");
  }

  function open(drop) {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (openDrop && openDrop !== drop) {
      openDrop.classList.remove("is-open");
    }
    openDrop = drop;
    drop.classList.add("is-open");
    var panel = drop.querySelector(".mega-panel");
    if (panel) place(panel);
  }

  function scheduleClose(drop) {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(function () {
      if (openDrop === drop) {
        drop.classList.remove("is-open");
        openDrop = null;
      }
    }, 120);
  }

  nav.querySelectorAll(".mega-panel-dropdown").forEach(function (drop) {
    var panel = drop.querySelector(".mega-panel");
    if (!panel) return;

    drop.addEventListener("mouseenter", function () {
      open(drop);
    });
    drop.addEventListener("mouseleave", function () {
      scheduleClose(drop);
    });

    // Keep open while pointer is on the fixed panel
    panel.addEventListener("mouseenter", function () {
      open(drop);
    });
    panel.addEventListener("mouseleave", function () {
      scheduleClose(drop);
    });
  });

  window.addEventListener("scroll", function () {
    if (!openDrop) return;
    var panel = openDrop.querySelector(".mega-panel");
    if (panel) place(panel);
  }, { passive: true });

  window.addEventListener("resize", function () {
    if (!openDrop) return;
    var panel = openDrop.querySelector(".mega-panel");
    if (panel) place(panel);
  });
})();

/* Row 2 pins for full page: fixed + spacer when row1 leaves view */
(function () {
  var row1 = document.querySelector(".header-row-1");
  var row2 = document.querySelector(".header-row-2");
  if (!row1 || !row2) return;

  var spacer = document.querySelector(".header-row-2-spacer");
  if (!spacer) {
    spacer = document.createElement("div");
    spacer.className = "header-row-2-spacer";
    spacer.setAttribute("aria-hidden", "true");
    row2.parentNode.insertBefore(spacer, row2.nextSibling);
  }

  function setStuck(stuck) {
    if (stuck) {
      spacer.style.height = row2.offsetHeight + "px";
      spacer.classList.add("is-active");
      row2.classList.add("is-stuck");
    } else {
      row2.classList.remove("is-stuck");
      spacer.classList.remove("is-active");
      spacer.style.height = "0px";
    }
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        setStuck(!entries[0].isIntersecting);
      },
      { root: null, threshold: 0 }
    ).observe(row1);
  } else {
    var scheduled = false;
    function update() {
      scheduled = false;
      setStuck(row1.getBoundingClientRect().bottom <= 0);
    }
    window.addEventListener("scroll", function () {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  window.addEventListener("scroll", function () {
    setStuck(row1.getBoundingClientRect().bottom <= 0);
  }, { passive: true });
})();

/* Sync search bar width and position with service-nav */
(function () {
  var serviceNav = document.querySelector(".header-row-2 .service-nav");
  var searchWrap = document.querySelector(".header-search-wrap");
  var searchBar = document.querySelector(".header-search-inline");
  var searchSuggestions = document.querySelector(".header-row-3 .search-suggestions");

  if (!searchBar || !searchWrap) return;

  function syncSearchBar() {
    // Check if on desktop and serviceNav is present and visible
    var isDesktop = window.innerWidth > 900 && serviceNav && serviceNav.offsetParent !== null;

    if (isDesktop) {
      var navRect = serviceNav.getBoundingClientRect();
      var wrapRect = searchWrap.getBoundingClientRect();

      var targetWidth = Math.round(navRect.width);
      var baseMarginRight = Math.max(0, Math.round(wrapRect.right - navRect.right));
      var targetMarginRight = Math.max(0, baseMarginRight - 32);

      searchBar.style.setProperty("width", targetWidth + "px", "important");
      searchBar.style.setProperty("margin-right", targetMarginRight + "px", "important");
      searchBar.style.setProperty("margin-left", "auto", "important");

      if (searchSuggestions) {
        searchSuggestions.style.setProperty("width", targetWidth + "px", "important");
        searchSuggestions.style.setProperty("left", searchBar.offsetLeft + "px", "important");
        searchSuggestions.style.setProperty("right", "auto", "important");
        searchSuggestions.style.removeProperty("margin-right");
        searchSuggestions.style.removeProperty("margin-left");
      }
    } else {
      // Mobile / Tablet: full width, margins reset
      searchBar.style.removeProperty("width");
      searchBar.style.removeProperty("margin-right");
      searchBar.style.removeProperty("margin-left");

      if (searchSuggestions) {
        searchSuggestions.style.removeProperty("width");
        searchSuggestions.style.removeProperty("left");
        searchSuggestions.style.removeProperty("right");
        searchSuggestions.style.removeProperty("margin-right");
        searchSuggestions.style.removeProperty("margin-left");
      }
    }
  }

  window.syncSearchBar = syncSearchBar;

  if (window.ResizeObserver && serviceNav) {
    var ro = new ResizeObserver(function () {
      syncSearchBar();
    });
    ro.observe(serviceNav);
    ro.observe(searchWrap);
  }

  window.addEventListener("resize", syncSearchBar);
  window.addEventListener("scroll", syncSearchBar, { passive: true });
  window.addEventListener("load", syncSearchBar);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncSearchBar);
  }
  syncSearchBar();
})();

/* Need Help dropdown */
(function () {
  var root = document.querySelector(".help-control");
  var btn = document.getElementById("helpToggle");
  var menu = document.getElementById("helpMenu");
  if (!root || !btn || !menu) return;

  function open() {
    root.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    menu.hidden = false;
  }
  function close() {
    root.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    menu.hidden = true;
  }
  function toggle(e) {
    if (e) e.stopPropagation();
    if (root.classList.contains("is-open")) close();
    else open();
  }

  btn.addEventListener("click", toggle);
  document.addEventListener("click", function (e) {
    if (!root.contains(e.target)) close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });
})();

/* Global Site Search */
(function () {
  function getSiteRootPrefix() {
    var brandLink = document.querySelector(".header-row-2 .brand, a.brand");
    if (brandLink && brandLink.getAttribute("href")) {
      var href = brandLink.getAttribute("href");
      var idx = href.lastIndexOf("index.html");
      if (idx !== -1) return href.substring(0, idx);
    }
    return "";
  }

  var SERVICES = [
    { title: "Private Limited Company", cat: "Business Registration", keywords: "pvt ltd company incorporation register", url: "company_registration.html" },
    { title: "LLP Registration", cat: "Business Registration", keywords: "limited liability partnership", url: "Business_registration/Company_registration/llp_registration.html" },
    { title: "One Person Company (OPC)", cat: "Business Registration", keywords: "opc", url: "Business_registration/Company_registration/opc_registration.html" },
    { title: "Sole Proprietorship", cat: "Business Registration", keywords: "sole prop proprietor", url: "Business_registration/Company_registration/sole_proprietorship.html" },
    { title: "Partnership Firm", cat: "Business Registration", keywords: "partnership", url: "Business_registration/Partnership_firm/partnership_firm_registration.html" },
    { title: "Startup India Registration", cat: "Business Registration", keywords: "dpiit startup", url: "Business_registration/Company_registration/startup_india.html" },
    { title: "Section 8 Company", cat: "Business Registration", keywords: "section 8 ngo", url: "Business_registration/NGOs/Section_8.html" },
    { title: "Trust Registration", cat: "Business Registration", keywords: "trust", url: "Business_registration/NGOs/trust_registration.html" },

    { title: "GST Registration", cat: "Tax & Compliance", keywords: "gst gstin", url: "Tax & Compliance/Goods & Services Tax/gst_registration.html" },
    { title: "GST Return Filing", cat: "Tax & Compliance", keywords: "gstr return", url: "Tax & Compliance/Goods & Services Tax/gst_return_filing.html" },
    { title: "Income Tax E-Filing", cat: "Tax & Compliance", keywords: "itr income tax", url: "Tax & Compliance/Income_Tax/tax_efiling.html" },
    { title: "ROC Annual Filing", cat: "Tax & Compliance", keywords: "roc annual aoc mgt", url: "Tax & Compliance/corporate_compliance/roc_annual_filing.html" },
    { title: "DIR-3 KYC Filing", cat: "Tax & Compliance", keywords: "director kyc din", url: "Tax & Compliance/corporate_compliance/dir3_kyc_filing.html" },
    { title: "Accounting Services", cat: "Tax & Compliance", keywords: "bookkeeping accounts", url: "Tax & Compliance/accounting & finance/accounting_services.html" },

    { title: "Trademark Registration", cat: "Trademark & IP", keywords: "trademark brand logo tm", url: "Trademark & Ip/trademark_services/trademark_registration.html" },
    { title: "Trademark Objection", cat: "Trademark & IP", keywords: "tm objection", url: "Trademark & Ip/trademark_services/trademark_objection.html" },
    { title: "Copyright Registration", cat: "Trademark & IP", keywords: "copyright", url: "Trademark & Ip/copyright_services/copyright_registration.html" },
    { title: "Patent Registration", cat: "Trademark & IP", keywords: "patent", url: "Trademark & Ip/patent_services/patent_registration.html" },

    { title: "MSME / Udyam Registration", cat: "Licenses", keywords: "msme udyam", url: "Licenses/business & municipal/msme_registration.html" },
    { title: "FSSAI Registration", cat: "Licenses", keywords: "fssai food", url: "Licenses/food & health/fssai_registration.html" },
    { title: "Shop & Establishment", cat: "Licenses", keywords: "shop establishment", url: "Licenses/business & municipal/shop_establishment_license.html" },
    { title: "IEC Registration", cat: "Licenses", keywords: "import export iec", url: "Licenses/import export registration/iec_registration.html" },
    { title: "ISO Certification", cat: "Licenses", keywords: "iso", url: "Licenses/workforce, operations and labour/iso_certification.html" },
    { title: "Digital Signature (DSC)", cat: "Licenses", keywords: "dsc digital signature", url: "Licenses/workforce, operations and labour/digital_signature_certificate.html" },

    { title: "Close Private Limited Company", cat: "Business Closure", keywords: "closure strike off pvt", url: "others/business_closuer/pvt_ltd_closuer.html" },
    { title: "Close LLP", cat: "Business Closure", keywords: "llp closure", url: "others/business_closuer/llp_closuer.html" },
    { title: "LLP to Private Limited", cat: "Conversion", keywords: "convert llp", url: "others/business_conversion/llp_to_pvt.html" },
    { title: "OPC to Private Limited", cat: "Conversion", keywords: "convert opc", url: "others/business_conversion/opc_to_pvt.html" },
    { title: "Company Registration", cat: "Business Registration", keywords: "company registration incorporate", url: "company_registration.html" }
  ];

  var input = document.getElementById("siteSearch");
  var form = document.getElementById("searchForm");
  var popular = document.getElementById("searchPopular");
  var results = document.getElementById("searchResults");
  var suggestions = document.getElementById("searchSuggestions");
  if (!input || !results) return;

  var activeIndex = -1;
  var currentList = [];

  function norm(s) {
    return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function search(q) {
    q = norm(q);
    if (!q) return [];
    var tokens = q.split(" ").filter(Boolean);
    return SERVICES.filter(function (s) {
      var hay = norm(s.title + " " + s.cat + " " + (s.keywords || ""));
      return tokens.every(function (t) { return hay.indexOf(t) !== -1; });
    }).slice(0, 8);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showPopular() {
    if (popular) popular.hidden = false;
    results.hidden = true;
    results.innerHTML = "";
    currentList = [];
    activeIndex = -1;
  }

  function render(list) {
    currentList = list;
    activeIndex = -1;

    if (!input.value.trim()) {
      showPopular();
      return;
    }

    if (popular) popular.hidden = false; /* stay under search, above results */
    results.hidden = false;

    if (!list.length) {
      results.innerHTML = '<div class="search-empty">No matching services</div>';
      return;
    }

    var prefix = getSiteRootPrefix();
    results.innerHTML = list.map(function (s, i) {
      var fullUrl = prefix + s.url;
      return (
        '<a class="search-result-item" href="' + fullUrl + '" data-index="' + i + '">' +
          '<span class="search-result-title">' + escapeHtml(s.title) + '</span>' +
          '<span class="search-result-cat">' + escapeHtml(s.cat) + '</span>' +
        '</a>'
      );
    }).join("");
  }

  function setActive(i) {
    var items = results.querySelectorAll(".search-result-item");
    items.forEach(function (el) { el.classList.remove("is-active"); });
    if (i >= 0 && i < items.length) {
      activeIndex = i;
      items[i].classList.add("is-active");
      items[i].scrollIntoView({ block: "nearest" });
    } else {
      activeIndex = -1;
    }
  }

  function goTo(url) {
    if (url) window.location.href = url;
  }

  input.addEventListener("input", function () {
    render(search(input.value));
  });

  input.addEventListener("keydown", function (e) {
    var items = results.querySelectorAll(".search-result-item");
    if (results.hidden || !items.length) {
      if (e.key === "Enter" && input.value.trim()) {
        var list = search(input.value);
        if (list[0]) {
          e.preventDefault();
          goTo(getSiteRootPrefix() + list[0].url);
        }
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(activeIndex < items.length - 1 ? activeIndex + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(activeIndex > 0 ? activeIndex - 1 : items.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        goTo(items[activeIndex].getAttribute("href"));
      } else if (currentList[0]) {
        goTo(getSiteRootPrefix() + currentList[0].url);
      }
    }
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var list = search(input.value);
      if (list[0]) goTo(getSiteRootPrefix() + list[0].url);
    });
  }

  // Popular chips → fill input + search
  document.querySelectorAll("#searchPopular [data-q]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      input.value = btn.getAttribute("data-q") || btn.textContent;
      input.focus();
      render(search(input.value));
    });
  });

  // Inline search: show suggestions under the bar on focus
  function openSug() {
    if (typeof window.syncSearchBar === "function") window.syncSearchBar();
    if (suggestions) suggestions.classList.add("is-open");
  }

  input.addEventListener("focus", function () {
    openSug();
    if (!input.value.trim()) showPopular();
  });
  input.addEventListener("input", function () {
    openSug();
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".header-row-3")) {
      if (suggestions) suggestions.classList.remove("is-open");
    }
  });
})();

// Set current year in footer
(function () {
  var y = document.getElementById("footerYear");
  if (y) y.textContent = new Date().getFullYear();
})();

// Support .reveal on pages using company_registration.js
(function () {
  if (typeof IntersectionObserver === "undefined") return;
  var reveals = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger");
  if (!reveals.length) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(function (el) { observer.observe(el); });
})();

// ==========================================
// UNIQUE VISITOR COUNTER CLIENT ENGINE
// ==========================================
(function () {
  if (window.__cmVisitorCounterInitialized) return;
  window.__cmVisitorCounterInitialized = true;

  function initVisitorCounter() {
    var container = document.querySelector('.visitor-counter-display') || document.getElementById('visitorCounterDisplay');
    if (!container) return;

    function renderDigits(count) {
      var num = Math.max(0, parseInt(count, 10) || 0);
      var str = String(num).padStart(6, '0');
      var html = '<div class="visitor-digit-grid" aria-label="Unique Visitors: ' + num + '">';
      for (var i = 0; i < str.length; i++) {
        html += '<span class="visitor-digit">' + str[i] + '</span>';
      }
      html += '</div>';
      container.innerHTML = html;
    }

    var STORAGE_KEY = 'cm_visitor_id';
    var CACHE_KEY = 'cm_cached_visitor_count';
    var visitorId = '';
    try {
      visitorId = localStorage.getItem(STORAGE_KEY);
      if (!visitorId) {
        visitorId = 'cm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem(STORAGE_KEY, visitorId);
      }
    } catch (e) {
      visitorId = 'cm_' + Date.now().toString(36);
    }

    var cached = 29;
    try {
      var stored = localStorage.getItem(CACHE_KEY);
      if (stored) cached = parseInt(stored, 10) || 29;
    } catch (e) {}
    renderDigits(cached);

    var apiUrl = '/api/visitors/hit';
    if (window.location.protocol === 'file:') {
      apiUrl = 'http://localhost:3000/api/visitors/hit';
    }

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: visitorId })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Status ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && typeof data.count === 'number') {
          renderDigits(data.count);
          try {
            localStorage.setItem(CACHE_KEY, data.count);
          } catch (e) {}
        }
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisitorCounter);
  } else {
    initVisitorCounter();
  }
})();

/* =====================================================
   GLOBAL LEAD MODAL, FLOATING BUTTON & 5-SECOND POPUP ENGINE
   (Automatically serves all 152 service pages)
===================================================== */
(function () {
  'use strict';

  function getRootPrefix() {
    var brandLink = document.querySelector(".header-row-2 .brand, a.brand");
    if (brandLink && brandLink.getAttribute("href")) {
      var href = brandLink.getAttribute("href");
      var idx = href.lastIndexOf("index.html");
      if (idx !== -1) return href.substring(0, idx);
    }
    var script = document.querySelector('script[src*="company_registration.js"]');
    if (script) {
      var src = script.getAttribute("src") || "";
      var idx = src.indexOf("company_registration.js");
      if (idx !== -1) return src.substring(0, idx);
    }
    return "";
  }

  function ensureFloatingLeadButton() {
    if (document.getElementById("floatingLeadBtn")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "floating-lead-btn";
    btn.id = "floatingLeadBtn";
    btn.setAttribute("aria-label", "Get Free Consultation");
    btn.setAttribute("title", "Get Free Consultation");
    btn.innerHTML =
      '<span class="floating-lead-pulse"></span>' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>' +
      '</svg>' +
      '<span class="floating-lead-tooltip">Get Consultation</span>';

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openLeadModal();
    });

    document.body.appendChild(btn);
  }

  function ensureLeadModal() {
    var modal = document.getElementById("leadModal");
    if (modal) return modal;

    var modalHtml =
      '<div class="lead-modal-backdrop" data-close-lead></div>' +
      '<div class="lead-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="leadModalTitle">' +
      '  <button type="button" class="lead-modal-close" data-close-lead aria-label="Close">&times;</button>' +
      '  <div class="lead-modal-header">' +
      '    <span class="lead-eyebrow">FREE CONSULTATION</span>' +
      '    <h2 id="leadModalTitle">Tell us what you need</h2>' +
      '    <p>Share your details and our expert will contact you shortly.</p>' +
      '  </div>' +
      '  <form id="leadModalForm" class="lead-modal-form" novalidate method="POST" action="https://api.web3forms.com/submit">' +
      '    <input type="hidden" name="access_key" value="f9e8e977-8a5c-4979-8cf0-e303edbcac00">' +
      '    <input type="hidden" name="subject" value="New Consultation Lead: Service Page">' +
      '    <input type="hidden" name="from_name" value="Corporate Mart Website">' +
      '    <input type="checkbox" name="botcheck" class="hidden" style="display:none">' +
      '    <div class="lead-field">' +
      '      <label for="leadName">Full name</label>' +
      '      <input id="leadName" name="name" type="text" placeholder="Your name" required autocomplete="name">' +
      '    </div>' +
      '    <div class="lead-field">' +
      '      <label for="leadPhone">Mobile number</label>' +
      '      <input id="leadPhone" name="phone" type="tel" placeholder="10-digit mobile" pattern="[0-9]{10}" maxlength="10" required autocomplete="tel">' +
      '    </div>' +
      '    <div class="lead-field">' +
      '      <label for="leadEmail">Email</label>' +
      '      <input id="leadEmail" name="email" type="email" placeholder="you@example.com" required autocomplete="email">' +
      '    </div>' +
      '    <div class="lead-field">' +
      '      <label for="leadService">Service you want</label>' +
      '      <select id="leadService" name="service" required>' +
      '        <option value="" disabled>Select a service</option>' +
      '        <option value="Private Limited Company">Private Limited Company</option>' +
      '        <option value="LLP Registration">Limited Liability Partnership (LLP)</option>' +
      '        <option value="One Person Company (OPC)">One Person Company (OPC)</option>' +
      '        <option value="Sole Proprietorship">Sole Proprietorship</option>' +
      '        <option value="Partnership Firm">Partnership Firm</option>' +
      '        <option value="Startup India Registration">Startup India Registration</option>' +
      '        <option value="GST Registration">GST Registration</option>' +
      '        <option value="GST Return Filing">GST Return Filing</option>' +
      '        <option value="Income Tax Filing">Income Tax Filing</option>' +
      '        <option value="Corporate Compliance & ROC">Corporate Compliance & ROC</option>' +
      '        <option value="Trademark Registration">Trademark Registration</option>' +
      '        <option value="FSSAI License">FSSAI Food License</option>' +
      '        <option value="MSME / Udyam Registration">MSME / Udyam Registration</option>' +
      '        <option value="IEC Registration">Import Export Code (IEC)</option>' +
      '        <option value="ISO Certification">ISO Certification</option>' +
      '        <option value="Environmental & Pollution NOC">Environmental & Pollution NOC</option>' +
      '        <option value="Business Closure / Strike Off">Business Closure / Strike Off</option>' +
      '        <option value="Web Solutions & Digital Marketing">Web Solutions & Digital Marketing</option>' +
      '        <option value="Fundraising & Government Grants">Fundraising & Government Grants</option>' +
      '        <option value="Other">Other Services</option>' +
      '      </select>' +
      '    </div>' +
      '    <button type="submit" class="lead-submit">Submit request <span>&rsaquo;</span></button>' +
      '    <p class="lead-note">100% confidential &middot; Mon to Sat, 9:30 AM to 6:30 PM</p>' +
      '    <div class="cr-form-success" id="leadFormSuccess" style="display:none;">Thanks! Your consultation request has been received. Our expert will contact you shortly.</div>' +
      '  </form>' +
      '</div>';

    var container = document.createElement("div");
    container.className = "lead-modal";
    container.id = "leadModal";
    container.setAttribute("aria-hidden", "true");
    container.innerHTML = modalHtml;
    document.body.appendChild(container);

    // Bind close events
    container.querySelectorAll("[data-close-lead]").forEach(function (el) {
      el.addEventListener("click", closeLeadModal);
    });

    // Bind form submission
    var form = container.querySelector("#leadModalForm");
    if (form) {
      form.addEventListener("submit", async function (e) {
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        var successEl = form.querySelector(".cr-form-success") || document.getElementById("leadFormSuccess");
        if (typeof handleWeb3FormsSubmit === "function") {
          var res = await handleWeb3FormsSubmit(e, form, successEl);
          if (res && res.success) {
            setTimeout(function () {
              closeLeadModal();
            }, 3500);
          }
        }
      });
    }

    return container;
  }

  function detectCurrentService() {
    var select = document.getElementById("leadService");
    if (!select) return;

    var h1 = document.querySelector("h1");
    var titleText = (h1 ? h1.textContent : document.title) || "";
    var tLower = titleText.toLowerCase();

    if (tLower.indexOf("gst") !== -1) select.value = "GST Registration";
    else if (tLower.indexOf("trademark") !== -1 || tLower.indexOf("tm") !== -1) select.value = "Trademark Registration";
    else if (tLower.indexOf("llp") !== -1) select.value = "LLP Registration";
    else if (tLower.indexOf("private limited") !== -1 || tLower.indexOf("pvt ltd") !== -1) select.value = "Private Limited Company";
    else if (tLower.indexOf("opc") !== -1) select.value = "One Person Company (OPC)";
    else if (tLower.indexOf("proprietorship") !== -1) select.value = "Sole Proprietorship";
    else if (tLower.indexOf("partnership") !== -1) select.value = "Partnership Firm";
    else if (tLower.indexOf("startup india") !== -1) select.value = "Startup India Registration";
    else if (tLower.indexOf("fssai") !== -1 || tLower.indexOf("food") !== -1) select.value = "FSSAI License";
    else if (tLower.indexOf("msme") !== -1 || tLower.indexOf("udyam") !== -1) select.value = "MSME / Udyam Registration";
    else if (tLower.indexOf("iso") !== -1) select.value = "ISO Certification";
    else if (tLower.indexOf("iec") !== -1 || tLower.indexOf("export") !== -1) select.value = "IEC Registration";
    else if (tLower.indexOf("tax") !== -1 || tLower.indexOf("itr") !== -1) select.value = "Income Tax Filing";
    else if (tLower.indexOf("roc") !== -1 || tLower.indexOf("compliance") !== -1) select.value = "Corporate Compliance & ROC";
    else if (tLower.indexOf("fund") !== -1 || tLower.indexOf("scheme") !== -1) select.value = "Fundraising & Government Grants";
    else if (tLower.indexOf("closure") !== -1 || tLower.indexOf("dissolution") !== -1) select.value = "Business Closure / Strike Off";
    else if (tLower.indexOf("website") !== -1 || tLower.indexOf("digital") !== -1 || tLower.indexOf("marketing") !== -1) select.value = "Web Solutions & Digital Marketing";
    else select.selectedIndex = 1;
  }

  function openLeadModal() {
    var modal = ensureLeadModal();
    detectCurrentService();

    var successMsg = modal.querySelector(".cr-form-success");
    if (successMsg) {
      successMsg.classList.remove("show");
      successMsg.style.display = "none";
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    var nameField = modal.querySelector("#leadName");
    if (nameField) {
      setTimeout(function () { nameField.focus(); }, 200);
    }
  }

  function closeLeadModal() {
    var modal = document.getElementById("leadModal");
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    var successMsg = modal.querySelector(".cr-form-success");
    if (successMsg) {
      successMsg.classList.remove("show");
      successMsg.style.display = "none";
    }
  }

  window.openLeadModal = openLeadModal;
  window.closeLeadModal = closeLeadModal;

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var modal = document.getElementById("leadModal");
      if (modal && modal.classList.contains("is-open")) {
        closeLeadModal();
      }
    }
  });

  function initLeadSystem() {
    ensureLeadModal();
    ensureFloatingLeadButton();

    // 5-Second Automatic Popup Timer on Service Pages
    setTimeout(function () {
      var anyOpen = document.querySelector(".lead-modal.is-open, .plan-modal.is-open, .si-cert-lightbox.is-open");
      if (!anyOpen) {
        openLeadModal();
      }
    }, 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLeadSystem);
  } else {
    initLeadSystem();
  }
})();




