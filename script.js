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
                successElement.style.display = "block";
                successElement.classList.add("show");
                setTimeout(() => {
                    successElement.classList.remove("show");
                    successElement.style.display = "none";
                }, 6000);
            } else {
                alert("Thank you! Your request has been submitted successfully.");
            }
        } else {
            console.error("Web3Forms error:", result);
            alert(result.message || "Failed to submit. Please check your Web3Forms Access Key.");
        }
        return result;
    } catch (error) {
        console.error("Submission failed:", error);
        alert("Failed to submit form. Please check your internet connection.");
        return { success: false, error: error };
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
    if (!siteHeader) return;
    if (window.scrollY > 20) {
        siteHeader.classList.add("scrolled");
    } else {
        siteHeader.classList.remove("scrolled");
    }
}
window.addEventListener("scroll", handleHeaderScroll, { passive: true });
handleHeaderScroll();

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

    /* End-aligned nav (Digital): always open submenu to the left */
    var parentDrop = item.closest(".nav-dropdown");
    if (parentDrop && parentDrop.classList.contains("align-end")) {
        submenu.classList.add("open-left");
        return;
    }

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
  /* legacy no-op: search is always visible in header row 3 */
  if (searchInput) searchInput.focus();
  var sug = document.getElementById("searchSuggestions");
  if (sug) sug.classList.add("is-open");
}

function closeSearch() {
  document.body.classList.remove("search-open");
  var sug = document.getElementById("searchSuggestions");
  if (sug && searchInput && !searchInput.value.trim()) {
    sug.classList.remove("is-open");
  }
}

if (searchTrigger) searchTrigger.addEventListener("click", openSearch);
if (searchClose) searchClose.addEventListener("click", closeSearch);

suggestionButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (!searchInput) return;
    searchInput.value = (button.getAttribute("data-q") || button.textContent).trim();
    searchInput.focus();
    var sug = document.getElementById("searchSuggestions");
    if (sug) sug.classList.add("is-open");
  });
});

function openMenu() {
  closeDropdowns();
  closeSearch();
  sideMenu.classList.add("open");
  menuOverlay.classList.add("open");
  sideMenu.setAttribute("aria-hidden", "false");
  menuOverlay.setAttribute("aria-hidden", "false");
  menuTrigger.setAttribute("aria-expanded", "true");
  document.body.classList.add("menu-open");
}

const mobileServices = document.querySelectorAll(".mobile-service");

mobileServices.forEach(service => {
    const button = service.querySelector("button");
    const submenu = service.querySelector(".mobile-submenu");
    if (!button || !submenu) return;

    button.addEventListener("click", () => {
        const isOpen = service.classList.contains("open");

        mobileServices.forEach(item => {
            item.classList.remove("open");
            const sub = item.querySelector(".mobile-submenu");
            if (sub) sub.classList.remove("open");
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
  sideMenu.classList.remove("open");
  menuOverlay.classList.remove("open");
  sideMenu.setAttribute("aria-hidden", "true");
  menuOverlay.setAttribute("aria-hidden", "true");
  menuTrigger.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

menuTrigger.addEventListener("click", openMenu);
sideMenuClose.addEventListener("click", closeMenu);
menuOverlay.addEventListener("click", closeMenu);

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
    const query = (searchInput && searchInput.value || "").trim();
    if (!query) {
      if (searchInput) searchInput.focus();
      return;
    }
    console.log("Search query:", query);
  });
}

const typingElement =
    document.getElementById("bizheroTypingText");

if (typingElement) {

    const words = [
        "Business Registration",
        "Tax & Compliance",
        "Trademark & IP",
        "Business Licenses",
        "Business Conversion",
        "Business Closure"
    ];

    let wordIndex = 0;
    let characterIndex = 0;
    let deleting = false;

    function typeText() {

        const currentWord = words[wordIndex];

        if (!deleting) {

            characterIndex++;

            typingElement.textContent =
                currentWord.substring(
                    0,
                    characterIndex
                );

            if (characterIndex === currentWord.length) {

                deleting = true;

                setTimeout(typeText, 1800);

                return;
            }

        } else {

            characterIndex--;

            typingElement.textContent =
                currentWord.substring(
                    0,
                    characterIndex
                );

            if (characterIndex === 0) {

                deleting = false;

                wordIndex =
                    (wordIndex + 1) % words.length;
            }
        }

        setTimeout(
            typeText,
            deleting ? 40 : 75
        );
    }

    typeText();
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

// Initial load: restore the saved theme instantly, never animated.
applyTheme(localStorage.getItem("theme")==="dark");
themeToggle?.addEventListener("click",()=>setTheme(!document.body.classList.contains("dark-mode")));

/* Recalculate active nested submenu direction on viewport resize */
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

(function () {
  const host = document.getElementById('indiaMapHost');
  const tooltip = document.getElementById('indiaMapTooltip');
  const wrap = document.getElementById('indiaMapWrap');

  if (!host || !tooltip || !wrap) return;

  /*
   * IMPORTANT:
   * The four cards keep their existing/default content until a state/UT
   * is hovered. On mouseleave, their ORIGINAL HTML is restored exactly.
   *
   * Incubator figures below are the previously selected all-incubator
   * state/UT dataset (Startup India data reproduced by Centre for Civil
   * Society, 21 Dec 2022).
   *
   * DPIIT startup figures are the official 2026 top-10 state figures;
   * where a current state/UT figure was not available in that dataset,
   * the card displays "No data available".
   */
  const stateData = {
    INAP: { name: "Andhra Pradesh", incubators: "26", msmes: "4,633,145", startups: "No data available" },
    INAR: { name: "Arunachal Pradesh", incubators: "1", msmes: "60,579", startups: "No data available" },
    INAS: { name: "Assam", incubators: "9", msmes: "1,964,403", startups: "No data available" },
    INBR: { name: "Bihar", incubators: "14", msmes: "5,172,708", startups: "No data available" },
    INCT: { name: "Chhattisgarh", incubators: "10", msmes: "1,585,695", startups: "No data available" },
    INGA: { name: "Goa", incubators: "5", msmes: "150,404", startups: "No data available" },
    INGJ: { name: "Gujarat", incubators: "62", msmes: "5,049,847", startups: "19,270+" },
    INHR: { name: "Haryana", incubators: "20", msmes: "2,487,227", startups: "11,620+" },
    INHP: { name: "Himachal Pradesh", incubators: "5", msmes: "391,029", startups: "No data available" },
    INJK: { name: "Jammu & Kashmir", incubators: "7", msmes: "944,191", startups: "No data available" },
    INJH: { name: "Jharkhand", incubators: "7", msmes: "1,779,546", startups: "No data available" },
    INKA: { name: "Karnataka", incubators: "98", msmes: "5,594,292", startups: "22,600+" },
    INKL: { name: "Kerala", incubators: "37", msmes: "2,120,548", startups: "8,620+" },
    INMP: { name: "Madhya Pradesh", incubators: "32", msmes: "5,444,956", startups: "No data available" },
    INMH: { name: "Maharashtra", incubators: "90", msmes: "11,317,899", startups: "38,660+" },
    INMN: { name: "Manipur", incubators: "1", msmes: "198,188", startups: "No data available" },
    INML: { name: "Meghalaya", incubators: "1", msmes: "92,374", startups: "No data available" },
    INMZ: { name: "Mizoram", incubators: "2", msmes: "61,019", startups: "No data available" },
    INNL: { name: "Nagaland", incubators: "1", msmes: "83,783", startups: "No data available" },
    INOR: { name: "Odisha", incubators: "28", msmes: "2,822,284", startups: "No data available" },
    INPB: { name: "Punjab", incubators: "12", msmes: "2,374,168", startups: "No data available" },
    INRJ: { name: "Rajasthan", incubators: "33", msmes: "5,149,382", startups: "8,100+" },
    INSK: { name: "Sikkim", incubators: "1", msmes: "40,650", startups: "No data available" },
    INTN: { name: "Tamil Nadu", incubators: "97", msmes: "6,877,704", startups: "14,830+" },
    INTG: { name: "Telangana", incubators: "68", msmes: "4,459,359", startups: "12,520+" },
    INTR: { name: "Tripura", incubators: "3", msmes: "341,829", startups: "No data available" },
    INUP: { name: "Uttar Pradesh", incubators: "42", msmes: "10,113,808", startups: "21,960+" },
    INUT: { name: "Uttarakhand", incubators: "10", msmes: "759,195", startups: "No data available" },
    INWB: { name: "West Bengal", incubators: "15", msmes: "5,984,638", startups: "No data available" },
    INDL: { name: "Delhi", incubators: "62", msmes: "1,756,798", startups: "21,120+" },
    INCH: { name: "Chandigarh", incubators: "3", msmes: "96,378", startups: "No data available" },
    INAN: { name: "Andaman & Nicobar Islands", incubators: "1", msmes: "23,929", startups: "No data available" },
    INLA: { name: "Ladakh", incubators: "No data available", msmes: "21,835", startups: "No data available" },
    INLD: { name: "Lakshadweep", incubators: "0", msmes: "2,573", startups: "No data available" },
    INPY: { name: "Puducherry", incubators: "1", msmes: "119,531", startups: "No data available" },
    INDN: { name: "Dadra & Nagar Haveli and Daman & Diu", incubators: "No data available", msmes: "39,947", startups: "No data available" }
  };

  // Capture the existing card contents BEFORE any hover changes.
  const stateNameEl = document.getElementById('indiaStateName');
  const stateLabelEl = document.getElementById('indiaStateLabel');
  const incubatorsEl = document.getElementById('indiaIncubators');
  const incubatorsLabelEl = document.getElementById('indiaIncubatorsLabel');
  const msmesEl = document.getElementById('indiaMsmes');
  const msmesLabelEl = document.getElementById('indiaMsmesLabel');
  const startupsEl = document.getElementById('indiaStartups');
  const startupsLabelEl = document.getElementById('indiaStartupsLabel');

  if (
    !stateNameEl || !stateLabelEl ||
    !incubatorsEl || !incubatorsLabelEl ||
    !msmesEl || !msmesLabelEl ||
    !startupsEl || !startupsLabelEl
  ) return;

  const original = {
    stateName: stateNameEl.innerHTML,
    stateLabel: stateLabelEl.innerHTML,
    incubators: incubatorsEl.innerHTML,
    incubatorsLabel: incubatorsLabelEl.innerHTML,
    msmes: msmesEl.innerHTML,
    msmesLabel: msmesLabelEl.innerHTML,
    startups: startupsEl.innerHTML,
    startupsLabel: startupsLabelEl.innerHTML
  };

  function restoreDefaultCards() {
    stateNameEl.innerHTML = original.stateName;
    stateLabelEl.innerHTML = original.stateLabel;
    incubatorsEl.innerHTML = original.incubators;
    incubatorsLabelEl.innerHTML = original.incubatorsLabel;
    msmesEl.innerHTML = original.msmes;
    msmesLabelEl.innerHTML = original.msmesLabel;
    startupsEl.innerHTML = original.startups;
    startupsLabelEl.innerHTML = original.startupsLabel;
  }

  function showStateCards(data) {
    stateNameEl.textContent = data.name;
    stateLabelEl.textContent = "State / UT";

    incubatorsEl.textContent = data.incubators;
    incubatorsLabelEl.textContent = "Incubation centers";

    msmesEl.textContent = data.msmes;
    msmesLabelEl.textContent = "MSMEs (Udyam + UAP)";

    startupsEl.textContent = data.startups;
    startupsLabelEl.textContent = "DPIIT-recognized startups";
  }

  function getStateData(path) {
    const id = path.getAttribute('id');
    if (id && stateData[id]) return stateData[id];

    const name = (path.getAttribute('name') || '').trim().toLowerCase();
    if (!name) return null;

    return Object.values(stateData).find(function (item) {
      return item.name.toLowerCase() === name;
    }) || null;
  }

  function initSvgPaths(svg) {
    svg.classList.add('india-map-svg');
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', 'auto');

    const paths = svg.querySelectorAll('path[name], path[id]');

    paths.forEach(function (path) {
      const data = getStateData(path);
      const name = data
        ? data.name
        : (path.getAttribute('name') || path.getAttribute('id') || '');

      if (!name || name.length < 2) return;

      path.addEventListener('mouseenter', function () {
        path.classList.add('is-active');

        // Hover temporarily replaces the four default cards.
        if (data) {
          showStateCards(data);
        } else {
          showStateCards({
            name: name,
            incubators: "No data available",
            msmes: "No data available",
            startups: "No data available"
          });
        }

        tooltip.textContent = name;
        // tooltip.classList.add('is-visible');
      });

      path.addEventListener('mousemove', function (e) {
        const rect = wrap.getBoundingClientRect();
        tooltip.style.left = (e.clientX - rect.left) + 'px';
        tooltip.style.top = (e.clientY - rect.top) + 'px';
      });

      path.addEventListener('mouseleave', function () {
        path.classList.remove('is-active');

        // Restore the EXACT original/default card content.
        restoreDefaultCards();

        // tooltip.classList.remove('is-visible');
      });
    });
  }

  // Check if SVG is already present inside host
  const existingSvg = host.querySelector('svg');
  if (existingSvg) {
    initSvgPaths(existingSvg);
    return;
  }

  fetch('icons/india-map.svg')
    .then(function (r) {
      if (!r.ok) return fetch('/icons/india-map.svg');
      return r;
    })
    .then(function (r) {
      if (!r.ok) throw new Error('India map could not be loaded');
      return r.text();
    })
    .then(function (svgText) {
      host.innerHTML = svgText;

      const svg = host.querySelector('svg');
      if (!svg) return;

      initSvgPaths(svg);
    })
    .catch(function () {
      host.innerHTML =
        '<img src="icons/india-map.svg" alt="India map" class="india-map-img" width="1000" height="1000">';
    });
})();

(function () {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  const sequence = [
    {
      rowId: "chatRow1",
      textId: "chatText1",
      cursorId: "chatCursor1",
      text: "How can I register my business?",
      speed: 38,
      pauseAfter: 700
    },
    {
      rowId: "chatRow2",
      textId: "chatText2",
      cursorId: "chatCursor2",
      text: "We can help you incorporate your Private Limited Company or LLP in 7-10 days. Ready to start?",
      speed: 30,
      pauseAfter: 900
    },
    {
      rowId: "chatRow3",
      textId: "chatText3",
      cursorId: "chatCursor3",
      text: "Yes",
      speed: 55,
      pauseAfter: 700
    },
    {
      rowId: "chatRow4",
      textId: "chatText4",
      cursorId: "chatCursor4",
      text: "Click below to talk to our expert consultant right now!",
      speed: 30,
      pauseAfter: 5000
    }
  ];

  function typeMessage(el, text, speed, cursor) {
    return new Promise(function (resolve) {
      let i = 0;
      el.textContent = "";
      if (cursor) cursor.classList.remove("is-done");

      function tick() {
        if (i < text.length) {
          el.textContent += text.charAt(i);
          i += 1;
          setTimeout(tick, speed);
        } else {
          if (cursor) cursor.classList.add("is-done");
          resolve();
        }
      }
      tick();
    });
  }

  function resetChat() {
    sequence.forEach(function (step) {
      const row = document.getElementById(step.rowId);
      const textEl = document.getElementById(step.textId);
      const cursor = document.getElementById(step.cursorId);
      if (row) row.classList.add("is-hidden");
      if (textEl) textEl.textContent = "";
      if (cursor) cursor.classList.remove("is-done");
    });
    const btn = document.getElementById("chatBtn");
    if (btn) btn.classList.add("is-hidden");
  }

  async function runSequence() {
    resetChat();

    for (let s = 0; s < sequence.length; s++) {
      const step = sequence[s];
      const row = document.getElementById(step.rowId);
      const textEl = document.getElementById(step.textId);
      const cursor = document.getElementById(step.cursorId);
      if (!row || !textEl) continue;

      row.classList.remove("is-hidden");
      await typeMessage(textEl, step.text, step.speed || 38, cursor);
      if (step.pauseAfter) {
        await new Promise(r => setTimeout(r, step.pauseAfter));
      }
    }

    const btn = document.getElementById("chatBtn");
    if (btn) btn.classList.remove("is-hidden");

    setTimeout(runSequence, 6000);
  }

  setTimeout(runSequence, 600);
})();

(function () {
  function Carousel(railId, viewportId, dotsId, interval) {
    this.rail = document.getElementById(railId);
    this.viewport = document.getElementById(viewportId);
    this.dotsHost = document.getElementById(dotsId);
    this.interval = interval || 4500;
    this.index = 0;
    this.timer = null;
    this.gap = 20;
    this.active = false;
    if (!this.rail || !this.viewport) return;

    var self = this;
    this.viewport.addEventListener("mouseenter", function () { self.stop(); });
    this.viewport.addEventListener("mouseleave", function () {
      if (self.active && !self.isVideoPlaying()) self.start();
    });
    window.addEventListener("resize", function () {
      if (!self.active) return;
      self.buildDots();
      self.go(Math.min(self.index, self.totalSlides() - 1));
    });
  }

  Carousel.prototype.isVideoPlaying = function () {
    if (!this.viewport) return false;
    var container = this.viewport.closest(".tm-mode") || this.viewport;
    var vids = container.querySelectorAll("video");
    for (var i = 0; i < vids.length; i++) {
      var v = vids[i];
      if (!v.paused && !v.ended) return true;
      if (v.seeking) return true;
      if (v.dataset.userActive === "true" && !v.ended) return true;
    }
    if (container.querySelector("iframe")) return true;
    return false;
  };

  Carousel.prototype.pauseAllVideos = function () {
    if (!this.viewport) return;
    var container = this.viewport.closest(".tm-mode") || this.viewport;
    var vids = container.querySelectorAll("video");
    for (var i = 0; i < vids.length; i++) {
      if (!vids[i].paused) vids[i].pause();
      vids[i].dataset.userActive = "false";
    }
  };

  Carousel.prototype.cards = function () {
    if (!this.rail) return [];
    return Array.prototype.slice.call(this.rail.children);
  };

  Carousel.prototype.cardStep = function () {
    var c = this.cards()[0];
    return c ? c.offsetWidth + this.gap : 300;
  };

  Carousel.prototype.visibleCards = function () {
    var c = this.cards()[0];
    if (!c) return 1;
    return Math.max(1, Math.round((this.viewport.offsetWidth + this.gap) / (c.offsetWidth + this.gap)));
  };

  Carousel.prototype.totalSlides = function () {
    return Math.max(1, Math.ceil(this.cards().length / this.visibleCards()));
  };

  Carousel.prototype.maxOffset = function () {
    var c = this.cards()[0];
    if (!c) return 0;
    var totalWidth = this.cards().length * (c.offsetWidth + this.gap) - this.gap;
    return Math.max(0, totalWidth - this.viewport.offsetWidth);
  };

  Carousel.prototype.go = function (slideIdx) {
    var total = this.totalSlides();
    var targetIdx = ((slideIdx % total) + total) % total;
    if (targetIdx !== this.index) {
      this.pauseAllVideos();
    }
    this.index = targetIdx;
    var c = this.cards()[0];
    if (!c) return;
    var slideStep = this.visibleCards() * (c.offsetWidth + this.gap);
    var offset = Math.min(this.index * slideStep, this.maxOffset());
    this.rail.style.transform = "translateX(" + (-offset) + "px)";
    this.syncDots();
  };

  Carousel.prototype.buildDots = function () {
    if (!this.dotsHost) return;
    this.dotsHost.innerHTML = "";
    var total = this.totalSlides();
    var self = this;
    if (total <= 1) return;
    for (var d = 0; d < total; d++) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Go to slide " + (d + 1));
      if (d === this.index) b.className = "is-on";
      (function (di) {
        b.addEventListener("click", function () {
          self.go(di);
          self.restart();
        });
      })(d);
      this.dotsHost.appendChild(b);
    }
  };

  Carousel.prototype.syncDots = function () {
    if (!this.dotsHost) return;
    var dots = this.dotsHost.querySelectorAll("button");
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle("is-on", i === this.index);
    }
  };

  Carousel.prototype.next = function () { this.go(this.index + 1); };
  Carousel.prototype.prev = function () { this.go(this.index - 1); };

  Carousel.prototype.start = function () {
    this.stop();
    if (!this.active) return;
    if (this.isVideoPlaying()) return;
    var self = this;
    this.timer = setInterval(function () {
      if (self.isVideoPlaying()) {
        self.stop();
        return;
      }
      self.next();
    }, this.interval);
  };

  Carousel.prototype.stop = function () {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  };

  Carousel.prototype.restart = function () {
    this.stop();
    if (!this.isVideoPlaying()) {
      this.start();
    }
  };

  Carousel.prototype.setActive = function (on) {
    if (!this.rail || !this.viewport) return;
    this.active = on;
    if (on) {
      this.buildDots();
      this.go(0);
      this.start();
    } else {
      this.stop();
    }
  };

  var video = new Carousel("tmRailVideo", "tmViewportVideo", "tmDotsVideo", 5000);
  var reviews = new Carousel("tmRailReviews", "tmViewportReviews", "tmDotsReviews", 4000);
  var mode = "video";
  video.setActive(true);

  function setMode(name) {
    mode = name;
    var isVideo = name === "video";
    var panelV = document.getElementById("tmModeVideo");
    var panelR = document.getElementById("tmModeReviews");
    if (panelV) {
      panelV.hidden = !isVideo;
      panelV.classList.toggle("is-on", isVideo);
    }
    if (panelR) {
      panelR.hidden = isVideo;
      panelR.classList.toggle("is-on", !isVideo);
    }
    document.querySelectorAll(".tm-tab").forEach(function (t) {
      var on = t.getAttribute("data-mode") === name;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (!isVideo) {
      video.pauseAllVideos();
    }
    video.setActive(isVideo);
    reviews.setActive(!isVideo);
  }

  document.querySelectorAll(".tm-tab").forEach(function (t) {
    t.addEventListener("click", function () {
      setMode(t.getAttribute("data-mode"));
    });
  });

  var prev = document.getElementById("tmPrev");
  var next = document.getElementById("tmNext");
  if (prev) {
    prev.addEventListener("click", function () {
      var c = mode === "video" ? video : reviews;
      c.prev();
      c.restart();
    });
  }
  if (next) {
    next.addEventListener("click", function () {
      var c = mode === "video" ? video : reviews;
      c.next();
      c.restart();
    });
  }

  document.querySelectorAll(".tm-play").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var url = btn.getAttribute("data-video");
      var thumb = btn.closest(".tm-thumb");
      if (!url || !thumb) return;

      // Stop auto sliding immediately and pause any other playing video
      video.stop();
      video.pauseAllVideos();

      if (url.toLowerCase().indexOf(".mp4") !== -1) {
        thumb.innerHTML = '<video src="' + url + '" controls autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;background:#000;"></video>';
        var vid = thumb.querySelector("video");
        if (vid) {
          vid.dataset.userActive = "true";

          // Explicitly invoke .play() to ensure playback starts within user gesture
          var playPromise = vid.play();
          if (playPromise !== undefined) {
            playPromise.catch(function () {
              // Video controls remain available for user interaction
            });
          }

          vid.addEventListener("play", function () {
            vid.dataset.userActive = "true";
            video.stop();
          });
          vid.addEventListener("playing", function () {
            vid.dataset.userActive = "true";
            video.stop();
          });
          vid.addEventListener("waiting", function () {
            video.stop();
          });
          vid.addEventListener("seeking", function () {
            video.stop();
          });
          vid.addEventListener("timeupdate", function () {
            if (video.timer) {
              video.stop();
            }
          });
          vid.addEventListener("pause", function () {
            // Keep slider stopped while the user is watching/interacting with the video
            video.stop();
          });
          vid.addEventListener("ended", function () {
            vid.dataset.userActive = "false";
            // Resume auto-sliding after the video finishes
            if (video.active && !video.isVideoPlaying()) {
              setTimeout(function () {
                if (video.active && !video.isVideoPlaying()) {
                  video.start();
                }
              }, 2000);
            }
          });
        }
      } else {
        thumb.innerHTML = '<iframe src="' + url + '" allow="autoplay; encrypted-media" allowfullscreen title="Testimonial" style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe>';
        video.stop();
      }
    });
  });

  window.Carousel = Carousel;
})();

(function () {
  var modal = document.getElementById("planModal");
  var planInput = document.getElementById("planSelected");
  var form = document.getElementById("planLeadForm");
  if (!modal || !planInput) return;

  function openModal(planName, price) {
    var label = planName + (price ? " - " + price : "");
    planInput.value = label;

    var successMsg = modal.querySelector(".cr-form-success");
    if (successMsg) {
      successMsg.classList.remove("show");
      successMsg.style.display = "none";
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var nameField = document.getElementById("planName");
    if (nameField) setTimeout(function () { nameField.focus(); }, 200);
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    var successMsg = modal.querySelector(".cr-form-success");
    if (successMsg) {
      successMsg.classList.remove("show");
      successMsg.style.display = "none";
    }
  }

  // Delegated click handler for plan cards, CTAs, and toggle-more dropdowns
  document.addEventListener("click", function (e) {
    // 1. Toggle extra features dropdown
    var toggleBtn = e.target.closest(".plan-toggle-more");
    if (toggleBtn) {
      e.preventDefault();
      e.stopPropagation();
      var card = toggleBtn.closest(".plan-card");
      if (!card) return;
      var isExpanded = card.classList.toggle("is-expanded");
      toggleBtn.setAttribute("aria-expanded", isExpanded ? "true" : "false");
      var count = toggleBtn.getAttribute("data-more-count") || "";
      var textEl = toggleBtn.querySelector(".plan-toggle-text");
      var iconEl = toggleBtn.querySelector(".plan-toggle-icon");
      if (textEl) {
        textEl.textContent = isExpanded ? "Show less" : ("+ " + count + " more features");
      }
      if (iconEl) {
        iconEl.textContent = isExpanded ? "▲" : "▼";
      }
      return;
    }

    // 2. Click on Select Plan CTA
    var cta = e.target.closest("[data-open-plan]");
    if (cta) {
      e.preventDefault();
      e.stopPropagation();
      var card = cta.closest(".plan-card");
      var plan = cta.getAttribute("data-open-plan") || (card ? card.getAttribute("data-plan") : "");
      var price = card ? card.getAttribute("data-price") : "";
      openModal(plan, price);
      return;
    }

    // 3. Click anywhere on card (excluding toggle button handled above)
    var card = e.target.closest(".plan-card");
    if (card && card.closest("#plans")) {
      var plan = card.getAttribute("data-plan") || "";
      var price = card.getAttribute("data-price") || "";
      openModal(plan, price);
    }
  });

  modal.querySelectorAll("[data-close-plan]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  if (form) {
    form.addEventListener("submit", async function (e) {
      var successEl = form.querySelector(".cr-form-success") || document.getElementById("planFormSuccess");
      if (typeof handleWeb3FormsSubmit === "function") {
        var res = await handleWeb3FormsSubmit(e, form, successEl);
        if (res && res.success) {
          setTimeout(function () {
            closeModal();
          }, 3500);
        }
      }
    });
  }
})();

/* =====================================================
   CUSTOMIZED PLAN MODAL & SERVICE BUILDER
===================================================== */
(function () {
  var modal = document.getElementById("customPlanModal");
  var openBtn = document.getElementById("openCustomPlanBtn");
  var form = document.getElementById("customPlanLeadForm");
  var searchInput = document.getElementById("customServiceSearch");
  var searchClearBtn = document.getElementById("customSearchClearBtn");
  var searchResults = document.getElementById("customSearchResults");
  var selectedChipsContainer = document.getElementById("customSelectedChips");
  var emptyHint = document.getElementById("customEmptyHint");
  var countBadge = document.getElementById("customServicesCount");
  var servicesError = document.getElementById("customServicesError");
  var hiddenServicesInput = document.getElementById("customSelectedServicesInput");
  var quickTags = document.getElementById("customQuickTags");

  if (!modal || !form) return;

  var selectedServices = [];

  var SERVICES_DATA = [
    // Company Registration
    { name: "Private Limited Company Registration", cat: "Company Registration", keywords: "pvt ltd corporate incorporate company startup mca spice" },
    { name: "Limited Liability Partnership (LLP) Registration", cat: "Company Registration", keywords: "llp partnership incorporation agreement mca" },
    { name: "One Person Company (OPC) Registration", cat: "Company Registration", keywords: "opc single founder sole director incorporation" },
    { name: "Sole Proprietorship Registration", cat: "Company Registration", keywords: "proprietor proprietorship sole business udyam" },
    { name: "Partnership Firm Registration", cat: "Company Registration", keywords: "partnership deed registrar of firms rof" },
    { name: "Startup India (DPIIT) Registration", cat: "Company Registration", keywords: "dpiit startup tax holiday 80iac angel tax seed fund" },
    { name: "Public Limited Company Registration", cat: "Company Registration", keywords: "public ltd listed ipo share capital" },
    { name: "Section 8 Company (NGO) Registration", cat: "NGO Registration", keywords: "section 8 non profit ngo social charity" },
    { name: "Trust Registration", cat: "NGO Registration", keywords: "trust deed public charitable trust sub registrar" },
    { name: "Society Registration", cat: "NGO Registration", keywords: "society registration act ngo association" },
    { name: "FCRA Registration", cat: "NGO Registration", keywords: "foreign contribution regulation act ngo fcra" },

    // Goods & Services Tax (GST)
    { name: "GST Registration", cat: "Goods & Services Tax", keywords: "gst gstin tax registration new application" },
    { name: "GST Return Filing (Monthly / Quarterly)", cat: "Goods & Services Tax", keywords: "gstr 1 3b return filing reconciliation input tax credit itc" },
    { name: "GST Amendment & Modification", cat: "Goods & Services Tax", keywords: "gst core non-core amendment address change" },
    { name: "GSTR-9 Annual Return Filing", cat: "Goods & Services Tax", keywords: "gstr9 annual return 9c reconciliation audit" },
    { name: "GSTR-10 Final Return Filing", cat: "Goods & Services Tax", keywords: "gstr10 surrender cancellation final return" },
    { name: "GST LUT (Letter of Undertaking) Filing", cat: "Goods & Services Tax", keywords: "lut export without tax bond" },
    { name: "GST Notice Resolution & Assessment", cat: "Goods & Services Tax", keywords: "gst notice scrutiny asmt drc01 demand" },
    { name: "GST Revocation of Cancellation", cat: "Goods & Services Tax", keywords: "gst revocation restore cancelled gstin" },

    // Income Tax & TDS
    { name: "Income Tax E-Filing (Individual / Salaried)", cat: "Income Tax", keywords: "itr itr1 itr2 tax filing income tax return refund" },
    { name: "Business Tax Filing (ITR-3, ITR-4, ITR-5, ITR-6)", cat: "Income Tax", keywords: "corporate tax business itr balance sheet presumptive 44ad" },
    { name: "TAN Registration", cat: "Income Tax", keywords: "tan tax deduction account number tds" },
    { name: "TDS Return Filing (24Q, 26Q, 27Q)", cat: "Income Tax", keywords: "tds return quarterly trace 16a certificate" },
    { name: "Income Tax Notice Assessment & Appeal", cat: "Income Tax", keywords: "tax notice 143 148 139 defect scrutiny" },
    { name: "Section 80-IAC Startup Tax Exemption Advisory", cat: "Income Tax", keywords: "80iac 3 year tax holiday startup india imb" },
    { name: "12A & 80G Registration for NGOs", cat: "Income Tax", keywords: "12a 80g tax exemption donation receipt donor" },
    { name: "Advance Tax Calculation & Advisory", cat: "Income Tax", keywords: "advance tax installment 234b 234c planning" },

    // Corporate Compliances & ROC
    { name: "Private Limited Annual ROC Compliance", cat: "Corporate Compliance", keywords: "aoc4 mgt7 annual filing balance sheet pvt ltd" },
    { name: "LLP Annual Compliance (Form 8 & Form 11)", cat: "Corporate Compliance", keywords: "form 8 form 11 llp annual statement of accounts" },
    { name: "OPC Annual ROC Compliance", cat: "Corporate Compliance", keywords: "opc filing mgt7a aoc4 one person company" },
    { name: "Section 8 Annual Compliance", cat: "Corporate Compliance", keywords: "section 8 annual return ngo filing" },
    { name: "DIR-3 KYC / Web KYC Filing", cat: "Corporate Compliance", keywords: "dir3 kyc director din reactivation kyc web" },
    { name: "ADT-1 Statutory Auditor Appointment", cat: "Corporate Compliance", keywords: "adt1 auditor appointment 30 days" },
    { name: "DPT-3 Return of Deposits Filing", cat: "Corporate Compliance", keywords: "dpt3 loans advances deposits annual" },
    { name: "Statutory Financial Audit Coordination", cat: "Corporate Compliance", keywords: "ca audit balance sheet profit loss report" },

    // Event-Based ROC Filing
    { name: "Add / Appoint Director in Company", cat: "Event-Based ROC", keywords: "dir12 add director board resolution" },
    { name: "Remove / Resign Director from Company", cat: "Event-Based ROC", keywords: "resignation director dir11 dir12" },
    { name: "Add / Remove Partner in LLP", cat: "Event-Based ROC", keywords: "form 4 llp partner change admission retirement" },
    { name: "Change / Amend LLP Agreement", cat: "Event-Based ROC", keywords: "form 3 llp agreement amendment supplementary deed" },
    { name: "Increase Authorized Share Capital", cat: "Event-Based ROC", keywords: "sh7 authorized capital stamp duty rooc" },
    { name: "Change Registered Office Address", cat: "Event-Based ROC", keywords: "inc22 registered office change local state rd" },
    { name: "Change Company Name", cat: "Event-Based ROC", keywords: "inc24 name change run reservation" },
    { name: "Change Business Activity / MOA Object Clause", cat: "Event-Based ROC", keywords: "moa amendment object clause alteration" },
    { name: "Issue / Allotment of New Shares (PAS-3)", cat: "Event-Based ROC", keywords: "pas3 share allotment rights issue private placement" },
    { name: "Change Statutory Auditor", cat: "Event-Based ROC", keywords: "adt2 adt3 casual vacancy auditor resignation" },
    { name: "Creation / Satisfaction of Charge (CHG-1 / CHG-4)", cat: "Event-Based ROC", keywords: "charge mortgage bank loan chg1 chg4 noc" },

    // Accounting & Financial Services
    { name: "Bookkeeping & Monthly Accounting", cat: "Accounting & Finance", keywords: "tally quickbooks ledger vouchers journal entries" },
    { name: "Financial Statements & Balance Sheet Preparation", cat: "Accounting & Finance", keywords: "p&l balance sheet cash flow statement schedule iii" },
    { name: "Financial Audit Support", cat: "Accounting & Finance", keywords: "internal audit statutory audit support ca" },
    { name: "Tax Audit Assistance (Section 44AB)", cat: "Accounting & Finance", keywords: "tax audit 3ca 3cb 3cd 1 crore 10 crore" },
    { name: "Business Due Diligence", cat: "Accounting & Finance", keywords: "financial due diligence legal merger acquisition investment" },
    { name: "Payroll & Compensation Processing", cat: "Accounting & Finance", keywords: "payslip salary pf esi tds calculation" },

    // Trademark & IP
    { name: "Trademark Registration & Filing", cat: "Trademark & IP", keywords: "trademark tm brand name logo mark class search" },
    { name: "Trademark Objection Reply & Legal Drafting", cat: "Trademark & IP", keywords: "tm objection examination report section 9 section 11" },
    { name: "Trademark Hearing Representation", cat: "Trademark & IP", keywords: "show cause hearing attorney trademark registry" },
    { name: "Trademark Opposition Notice & Defense", cat: "Trademark & IP", keywords: "tm5 notice counter statement opposition" },
    { name: "Trademark Renewal (10-Year)", cat: "Trademark & IP", keywords: "tm-r renewal 10 years maintain brand" },
    { name: "Trademark Transfer / Assignment", cat: "Trademark & IP", keywords: "assignment transfer sale ownership licensing" },
    { name: "Copyright Registration", cat: "Trademark & IP", keywords: "copyright software literary artistic music video code" },
    { name: "Patent Search & Registration", cat: "Trademark & IP", keywords: "patent provisional complete specification invention" },
    { name: "Trademark Infringement Legal Notice", cat: "Trademark & IP", keywords: "cease desist infringement passing off legal notice" },

    // Business & Municipal Licenses
    { name: "MSME / Udyam Registration Certificate", cat: "Licenses", keywords: "udyam msme small business priority lending subsidy" },
    { name: "Shop & Establishment Act License", cat: "Licenses", keywords: "gumasta shop act municipal commercial license" },
    { name: "Trade License Registration", cat: "Licenses", keywords: "trade license municipal corporation nagar nigam" },
    { name: "Professional Tax Registration (PTEC / PTRC)", cat: "Licenses", keywords: "pt pt registration employer employee state" },
    { name: "Factory License Registration", cat: "Licenses", keywords: "factories act boiler machinery inspector" },
    { name: "Labour Welfare Fund Registration", cat: "Licenses", keywords: "lwf labour welfare compliance" },

    // Food & Healthcare
    { name: "FSSAI Basic Registration", cat: "Food & Health", keywords: "fssai petty food business foostats turnover under 12 lakh" },
    { name: "FSSAI State / Central Food License", cat: "Food & Health", keywords: "fssai state license central manufacturer restaurant kitchen" },
    { name: "Drug & Cosmetic License", cat: "Food & Health", keywords: "pharmacy wholesale retail drug cosmetic license" },
    { name: "Food Import Clearance (FSSAI)", cat: "Food & Health", keywords: "fics food import customs consignment" },
    { name: "BIS / ISI Certification", cat: "Food & Health", keywords: "bis mark isi quality certification testing" },
    { name: "Ayush License Registration", cat: "Food & Health", keywords: "ayurvedic unani siddha homeopathy manufacturing" },

    // Import & Export
    { name: "Import Export Code (IEC) Registration", cat: "Import & Export", keywords: "iec code dgft foreign trade import export" },
    { name: "ICEGATE Registration", cat: "Import & Export", keywords: "icegate customs edl port clearance" },
    { name: "RCMC (Export Promotion Council) Registration", cat: "Import & Export", keywords: "rcmc epc fieo export council apeda eepc" },
    { name: "APEDA Registration", cat: "Import & Export", keywords: "apeda agri food export certification" },
    { name: "Customs Clearance & Freight Advisory", cat: "Import & Export", keywords: "cha customs clearance shipping port forwarding" },
    { name: "DGFT Digital Signature (Class 3)", cat: "Import & Export", keywords: "dgft dsc foreign trade signing token" },

    // Workforce & Labour
    { name: "PF (Provident Fund) Employer Registration", cat: "Workforce & Labour", keywords: "epfo provident fund employer code uan" },
    { name: "ESI (Employee State Insurance) Registration", cat: "Workforce & Labour", keywords: "esic employee state insurance medical coverage" },
    { name: "Contract Labour License (CLRA)", cat: "Workforce & Labour", keywords: "contract labour registration staffing agency 50+ workers" },
    { name: "PSARA License (Security Agency)", cat: "Workforce & Labour", keywords: "private security agency regulation act guard" },
    { name: "Digital Signature Certificate (Class 3 DSC)", cat: "Workforce & Labour", keywords: "class 3 dsc usb token e-mudhra signing" },
    { name: "NGO DARPAN NITI Aayog Registration", cat: "Workforce & Labour", keywords: "darpan portal niti aayog government grants" },
    { name: "ISO 9001:2015 Certification", cat: "Workforce & Labour", keywords: "iso 9001 quality management system qms audit" },
    { name: "ISO 27001 Information Security Certification", cat: "Workforce & Labour", keywords: "iso 27001 isms data security cyber audit" },

    // Environmental & Pollution
    { name: "EPR Registration (Plastic / E-Waste / Battery)", cat: "Environmental & Pollution", keywords: "epr cpcb extended producer responsibility recycling" },
    { name: "Plastic Waste Management Authorization", cat: "Environmental & Pollution", keywords: "spcb cpcb plastic packaging brand owner" },
    { name: "Consent to Establish (CTE) - SPCB", cat: "Environmental & Pollution", keywords: "cte pollution consent state pollution board factory" },
    { name: "Consent to Operate (CTO) - SPCB", cat: "Environmental & Pollution", keywords: "cto pollution operation consent renewal" },
    { name: "Environmental Audit & EIA Clearance", cat: "Environmental & Pollution", keywords: "environmental impact assessment eia green clearance" },

    // Business Closure & Conversion
    { name: "Private Limited Company Closure (STK-2)", cat: "Business Closure", keywords: "strike off pvt ltd fast track closure dissolution stk2" },
    { name: "LLP Closure / Strike Off (Form 24)", cat: "Business Closure", keywords: "form 24 llp closure winding up" },
    { name: "Sole Proprietorship / Partnership Dissolution", cat: "Business Closure", keywords: "firm dissolution partnership winding up closure" },
    { name: "Sole Proprietorship to Private Limited Conversion", cat: "Business Conversion", keywords: "convert proprietorship to pvt ltd slumpsale spice" },
    { name: "Partnership Firm to LLP Conversion", cat: "Business Conversion", keywords: "convert partnership to llp form 17 asset takeover" },
    { name: "LLP to Private Limited Company Conversion", cat: "Business Conversion", keywords: "convert llp to pvt ltd part i companies act" },
    { name: "One Person Company (OPC) to Private Limited Conversion", cat: "Business Conversion", keywords: "convert opc to pvt ltd voluntary mandatory" },

    // Web Solutions & Digital
    { name: "Dynamic Corporate Website Development", cat: "Web Solutions", keywords: "website design wordpress custom web development responsive" },
    { name: "E-Commerce Web Portal & Payment Gateway", cat: "Web Solutions", keywords: "ecommerce shopify woocommerce custom payment store" },
    { name: "Custom Web Application & SaaS Development", cat: "Web Solutions", keywords: "saas web app portal database cloud react node" },
    { name: "Search Engine Optimization (SEO) Package", cat: "Digital Marketing", keywords: "seo ranking google search organic traffic backlinks" },
    { name: "Social Media Marketing (SMM)", cat: "Digital Marketing", keywords: "social media instagram linkedin facebook campaigns" },
    { name: "Google Ads & B2B Lead Generation", cat: "Digital Marketing", keywords: "ppc google ads lead gen performance marketing" },
    { name: "Corporate Logo & Brand Identity Design", cat: "Branding & Design", keywords: "logo design brand guidelines typography identity" },
    { name: "Company Profile & Pitch Deck Designing", cat: "Branding & Design", keywords: "corporate brochure profile pdf investor deck" },

    // Fundraising & Startup Capital
    { name: "Fundraising & Government Scheme Application", cat: "Fundraising", keywords: "fundraising funding scheme grant sisfs investor pitch capital loans seed" },
    // { name: "Startup India Seed Fund Scheme (SISFS)", cat: "Fundraising", keywords: "sisfs seed fund grant dpiit startup capital incubator funding" },
    // { name: "Investor Pitch Deck & Financial Modeling", cat: "Fundraising", keywords: "pitch deck presentation investor valuation model projection fundraising" },
    // { name: "MUDRA & MSME Credit Loan Facilitation", cat: "Fundraising", keywords: "mudra loan cgtmse credit collateral free bank debt funding" },
    // { name: "Angel & VC Funding Advisory", cat: "Fundraising", keywords: "angel investment vc venture capital due diligence term sheet equity fundraising" },
    // { name: "Stand-Up India & CGTMSE Scheme Application", cat: "Fundraising", keywords: "stand up india cgtmse credit guarantee collateral free funding grant" }
  ];

  window.SERVICES_CATALOG = SERVICES_DATA;

  function openModal() {
    var successMsg = modal.querySelector(".cr-form-success") || document.getElementById("customPlanFormSuccess");
    if (successMsg) {
      successMsg.classList.remove("show");
      successMsg.style.display = "none";
    }
    if (servicesError) servicesError.style.display = "none";

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    var nameField = document.getElementById("customPlanName");
    if (nameField) {
      setTimeout(function () { nameField.focus(); }, 200);
    }
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (searchResults) searchResults.style.display = "none";
    if (searchClearBtn) searchClearBtn.style.display = "none";
    if (searchInput) searchInput.value = "";
  }

  function renderChips() {
    if (!selectedChipsContainer) return;
    selectedChipsContainer.innerHTML = "";

    if (selectedServices.length === 0) {
      if (emptyHint) emptyHint.style.display = "block";
      if (countBadge) countBadge.textContent = "(0 selected)";
      if (hiddenServicesInput) hiddenServicesInput.value = "";
    } else {
      if (emptyHint) emptyHint.style.display = "none";
      if (countBadge) countBadge.textContent = "(" + selectedServices.length + " selected)";
      if (hiddenServicesInput) hiddenServicesInput.value = selectedServices.join("; ");

      selectedServices.forEach(function (serviceName) {
        var chip = document.createElement("div");
        chip.className = "custom-service-chip";
        chip.setAttribute("data-name", serviceName);

        var span = document.createElement("span");
        span.textContent = serviceName;

        var removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "custom-chip-remove";
        removeBtn.setAttribute("aria-label", "Remove " + serviceName);
        removeBtn.innerHTML = "&times;";
        removeBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          removeService(serviceName);
        });

        chip.appendChild(span);
        chip.appendChild(removeBtn);
        selectedChipsContainer.appendChild(chip);
      });
    }

    // Update quick tags visual state
    if (quickTags) {
      var buttons = quickTags.querySelectorAll(".custom-quick-btn");
      buttons.forEach(function (btn) {
        var sName = btn.getAttribute("data-add-service");
        var isAdded = selectedServices.indexOf(sName) !== -1;
        btn.classList.toggle("is-added", isAdded);
      });
    }
  }

  function addService(name) {
    if (!name) return;
    var trimmed = name.trim();
    if (selectedServices.indexOf(trimmed) !== -1) {
      // Already selected
      return;
    }
    selectedServices.push(trimmed);
    renderChips();

    if (servicesError) servicesError.style.display = "none";

    if (searchInput) searchInput.value = "";
    if (searchClearBtn) searchClearBtn.style.display = "none";
    if (searchResults) searchResults.style.display = "none";
  }

  function removeService(name) {
    selectedServices = selectedServices.filter(function (s) {
      return s !== name;
    });
    renderChips();
  }

  function filterServices(query) {
    if (!query) return [];
    var q = query.toLowerCase().trim();
    var terms = q.split(/\s+/).filter(Boolean);

    return SERVICES_DATA.filter(function (item) {
      var hay = (item.name + " " + item.cat + " " + (item.keywords || "")).toLowerCase();
      return terms.every(function (t) {
        return hay.indexOf(t) !== -1;
      });
    });
  }

  function renderSearchResults(results, query) {
    if (!searchResults) return;

    if (results.length === 0) {
      searchResults.innerHTML = '<div style="padding: 12px 14px; text-align: center; color: var(--muted, #64748b); font-size: 12.5px;">No matching services found. You can note special requirements in the message box below!</div>';
      searchResults.style.display = "block";
      return;
    }

    var html = "";
    var displayList = results.slice(0, 10);

    displayList.forEach(function (item) {
      var isAlreadySelected = selectedServices.indexOf(item.name) !== -1;
      html += '<div class="custom-search-result-item ' + (isAlreadySelected ? 'is-selected' : '') + '" data-service-name="' + item.name.replace(/"/g, '&quot;') + '">';
      html += '  <span class="custom-result-title">' + item.name + '</span>';
      html += '  <span class="custom-result-cat">' + item.cat + '</span>';
      html += '</div>';
    });

    searchResults.innerHTML = html;
    searchResults.style.display = "block";
  }

  // Event Listeners
  if (openBtn) {
    openBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-open-custom-plan]");
    if (trigger && trigger !== openBtn) {
      e.preventDefault();
      openModal();
    }
  });

  modal.querySelectorAll("[data-close-custom-plan]").forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      var val = searchInput.value.trim();
      if (searchClearBtn) {
        searchClearBtn.style.display = val ? "block" : "none";
      }

      if (!val) {
        if (searchResults) searchResults.style.display = "none";
        return;
      }

      var matches = filterServices(val);
      renderSearchResults(matches, val);
    });

    searchInput.addEventListener("focus", function () {
      var val = searchInput.value.trim();
      if (val) {
        var matches = filterServices(val);
        renderSearchResults(matches, val);
      }
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener("click", function () {
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      searchClearBtn.style.display = "none";
      if (searchResults) searchResults.style.display = "none";
    });
  }

  // Delegated click on search results
  if (searchResults) {
    searchResults.addEventListener("click", function (e) {
      var item = e.target.closest(".custom-search-result-item");
      if (!item) return;
      var serviceName = item.getAttribute("data-service-name");
      if (serviceName) {
        addService(serviceName);
      }
    });
  }

  // Click outside search container to close results
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".custom-search-container") && searchResults) {
      searchResults.style.display = "none";
    }
  });

  // Quick Tags
  if (quickTags) {
    quickTags.addEventListener("click", function (e) {
      var btn = e.target.closest(".custom-quick-btn");
      if (!btn) return;
      e.preventDefault();
      var sName = btn.getAttribute("data-add-service");
      if (sName) {
        addService(sName);
      }
    });
  }

  // Form Submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (selectedServices.length === 0) {
      if (servicesError) {
        servicesError.style.display = "block";
        servicesError.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      if (searchInput) searchInput.focus();
      return;
    }

    if (servicesError) servicesError.style.display = "none";

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Ensure hidden services input is populated
    if (hiddenServicesInput) {
      hiddenServicesInput.value = selectedServices.join("; ");
    }

    var successEl = form.querySelector(".cr-form-success") || document.getElementById("customPlanFormSuccess");
    if (typeof handleWeb3FormsSubmit === "function") {
      var res = await handleWeb3FormsSubmit(e, form, successEl);
      if (res && res.success) {
        selectedServices = [];
        renderChips();
        setTimeout(function () {
          closeModal();
        }, 3500);
      }
    }
  });

  // Initial render
  renderChips();
})();

/* =====================================================
   PLAN CATEGORY TABS SWITCHER
===================================================== */
(function () {
  var planCats = document.querySelectorAll(".plans-cat, [data-plan-cat]");
  var planPanels = document.querySelectorAll(".plans-panel, [data-plan-panel]");
  if (!planCats.length || !planPanels.length) return;

  function showPlanCat(catName) {
    planCats.forEach(function (btn) {
      var on = btn.getAttribute("data-plan-cat") === catName;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    planPanels.forEach(function (panel) {
      var on = panel.getAttribute("data-plan-panel") === catName;
      panel.classList.toggle("is-on", on);
      panel.hidden = !on;
    });
  }

  planCats.forEach(function (btn) {
    btn.addEventListener("click", function () {
      showPlanCat(btn.getAttribute("data-plan-cat"));
    });
  });
})();

(function () {
  var cats = document.querySelectorAll(".approach-cat, [data-cat]");
  var panels = document.querySelectorAll(".approach-panel, [data-panel]");
  if (!cats.length || !panels.length) return;
  function showCat(name) {
    cats.forEach(function (btn) {
      var on = btn.getAttribute("data-cat") === name;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach(function (panel) {
      var on = panel.getAttribute("data-panel") === name;
      panel.classList.toggle("is-on", on);
      panel.hidden = !on;
    });
  }

  cats.forEach(function (btn) {
    btn.addEventListener("click", function () {
      showCat(btn.getAttribute("data-cat"));
    });
  });
})();

(function () {
  var y = document.getElementById("footerYear");
  if (y) y.textContent = new Date().getFullYear();
})();

(function () {
  var section = document.getElementById("stats");
  if (!section) return;

  var nums = section.querySelectorAll(".stats-num");
  var done = false;
  var duration = 1600; // ms

  function animate(el) {
    var target = parseFloat(el.getAttribute("data-target")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var start = 0;
    var startTime = null;

    function frame(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      // ease-out
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(start + (target - start) * eased);
      el.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = target + suffix;
      }
    }
    requestAnimationFrame(frame);
  }

  function run() {
    if (done) return;
    done = true;
    nums.forEach(animate);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run();
            io.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    io.observe(section);
  } else {
    run();
  }
})();

(function () {
  var selector = ".reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger";
  var els = document.querySelectorAll(selector);
  if (!els.length) return;

  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target); // animate once
        }
      });
    },
    {
      threshold: 0.12,           // % of element visible
      rootMargin: "0px 0px -40px 0px" // trigger slightly before fully in view
    }
  );

  els.forEach(function (el) { io.observe(el); });
})();

(function () {
  var modal = document.getElementById("leadModal");
  var form = document.getElementById("leadModalForm");
  if (!modal) return;

  var eyebrow = modal.querySelector(".lead-eyebrow");
  var desc = modal.querySelector(".lead-modal-header p");

  function openLeadModal(isForQuotation) {
    var forQuotation = (isForQuotation === true);
    window.pendingQuotationAfterLead = forQuotation;
    modal.setAttribute("data-for-quotation", forQuotation ? "true" : "false");

    if (forQuotation) {
      if (eyebrow) eyebrow.textContent = "GET QUOTATION";
      if (desc) desc.textContent = "Please share your details to proceed with generating your quotation.";
    } else {
      if (eyebrow) eyebrow.textContent = "FREE CONSULTATION";
      if (desc) desc.textContent = "Share your details and we will get back during business hours.";
    }

    // Ensure any previous success message is hidden on fresh open
    var successMsg = modal.querySelector(".cr-form-success");
    if (successMsg) {
      successMsg.classList.remove("show");
      successMsg.style.display = "none";
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var name = document.getElementById("leadName");
    if (name) setTimeout(function () { name.focus(); }, 200);
  }

  function closeLeadModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("data-for-quotation", "false");
    window.pendingQuotationAfterLead = false;
    var otherOpen = document.querySelector(".plan-modal.is-open, .funding-poster-modal.is-open, .quotation-modal.is-open, .custom-plan-modal.is-open");
    if (!otherOpen) {
      document.body.style.overflow = "";
    }
    if (eyebrow) eyebrow.textContent = "FREE CONSULTATION";
    if (desc) desc.textContent = "Share your details and we will get back during business hours.";

    var successMsg = modal.querySelector(".cr-form-success");
    if (successMsg) {
      successMsg.classList.remove("show");
      successMsg.style.display = "none";
    }
  }

  window.openLeadModal = openLeadModal;
  window.closeLeadModal = closeLeadModal;

  // Wire "Click here" in chat (id="chatBtn")
  function bindTrigger() {
    var btn = document.getElementById("chatBtn");
    if (btn && !btn.dataset.leadBound) {
      btn.dataset.leadBound = "1";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openLeadModal(false);
      });
    }
  }

  bindTrigger();
  var observer = new MutationObserver(bindTrigger);
  observer.observe(document.body, { childList: true, subtree: true });

  modal.querySelectorAll("[data-close-lead]").forEach(function (el) {
    el.addEventListener("click", function () {
      closeLeadModal();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      var posterOpen = document.getElementById("fundingPosterModal");
      if (posterOpen && posterOpen.classList.contains("is-open")) {
        return; // Let posterModal close first
      }
      closeLeadModal();
    }
  });

  if (form) {
    form.addEventListener("submit", async function (e) {
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var nameInput = document.getElementById("leadName");
      var phoneInput = document.getElementById("leadPhone");
      var emailInput = document.getElementById("leadEmail");
      var serviceInput = document.getElementById("leadService");

      var submittedName = nameInput ? nameInput.value.trim() : "";
      var submittedPhone = phoneInput ? phoneInput.value.trim() : "";
      var submittedEmail = emailInput ? emailInput.value.trim() : "";
      var submittedService = serviceInput ? serviceInput.value : "";

      try {
        localStorage.setItem("corporateMart_leadSubmitted", "true");
        if (submittedName) localStorage.setItem("corporateMart_leadName", submittedName);
        if (submittedPhone) localStorage.setItem("corporateMart_leadPhone", submittedPhone);
        if (submittedEmail) localStorage.setItem("corporateMart_leadEmail", submittedEmail);
        if (submittedService) localStorage.setItem("corporateMart_leadService", submittedService);
      } catch (err) {
        console.warn("Storage error:", err);
      }

      var successEl = form.querySelector(".cr-form-success") || document.getElementById("leadFormSuccess");
      var wasPending = (modal.getAttribute("data-for-quotation") === "true") && (window.pendingQuotationAfterLead === true);

      if (typeof handleWeb3FormsSubmit === "function") {
        var res = await handleWeb3FormsSubmit(e, form, successEl);
        if (wasPending && typeof window.openQuotationModal === "function") {
          closeLeadModal();
          setTimeout(function () {
            if (typeof window.openQuotationModal === "function") {
              window.openQuotationModal({
                customerName: submittedName,
                serviceName: submittedService
              });
            }
          }, 150);
        } else if (res && res.success) {
          setTimeout(function () {
            closeLeadModal();
          }, 3500);
        }
      }
    });
  }

  // Floating Lead Button Handler
  var floatBtn = document.getElementById("floatingLeadBtn");
  if (floatBtn) {
    floatBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openLeadModal(false);
    });
  }

  // Funding Poster Modal Controller
  var posterModal = document.getElementById("fundingPosterModal");
  function openFundingPosterModal() {
    if (!posterModal) return;
    posterModal.classList.add("is-open");
    posterModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeFundingPosterModal() {
    if (!posterModal) return;
    posterModal.classList.remove("is-open");
    posterModal.setAttribute("aria-hidden", "true");
    var otherOpen = document.querySelector(".lead-modal.is-open:not(#fundingPosterModal), .plan-modal.is-open, .quotation-modal.is-open, .custom-plan-modal.is-open");
    if (!otherOpen) {
      document.body.style.overflow = "";
    } else {
      var leadNameInput = document.getElementById("leadName");
      if (leadNameInput && document.getElementById("leadModal") && document.getElementById("leadModal").classList.contains("is-open")) {
        setTimeout(function () { leadNameInput.focus(); }, 100);
      }
    }
  }

  if (posterModal) {
    posterModal.querySelectorAll("[data-close-funding-poster]").forEach(function (el) {
      el.addEventListener("click", closeFundingPosterModal);
    });

    var switchBtn = document.getElementById("switchToLeadModalBtn");
    if (switchBtn) {
      switchBtn.addEventListener("click", function (e) {
        e.preventDefault();
        closeFundingPosterModal();
        openLeadModal(false);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && posterModal.classList.contains("is-open")) {
        closeFundingPosterModal();
      }
    });
  }

  window.openFundingPosterModal = openFundingPosterModal;
  window.closeFundingPosterModal = closeFundingPosterModal;

  // 5-Second Automatic Popup Timer on Index Page
  setTimeout(function () {
    var otherModalOpen = document.querySelector(".plan-modal.is-open, .quotation-modal.is-open, .custom-plan-modal.is-open");
    if (!otherModalOpen) {
      // Both lead modal and funding poster modal appear on index page
      openLeadModal(false);
      if (posterModal) {
        openFundingPosterModal();
      }
    }
  }, 5000);
})();

(function () {
  var SERVICES = [
    { title: "Private Limited Company", cat: "Business Registration", keywords: "pvt ltd company incorporation register", url: "/company_registration.html" },
    { title: "LLP Registration", cat: "Business Registration", keywords: "limited liability partnership", url: "./Business_registration/Company_registration/llp_registration.html" },
    { title: "One Person Company (OPC)", cat: "Business Registration", keywords: "opc", url: "./Business_registration/Company_registration/opc_registration.html" },
    { title: "Sole Proprietorship", cat: "Business Registration", keywords: "sole prop proprietor", url: "./Business_registration/Company_registration/sole_proprietorship.html" },
    { title: "Partnership Firm", cat: "Business Registration", keywords: "partnership", url: "./Business_registration/Company_registration/partnership.html" },
    { title: "Startup India Registration", cat: "Business Registration", keywords: "dpiit startup", url: "./Business_registration/Company_registration/startup_india.html" },
    { title: "Section 8 Company", cat: "Business Registration", keywords: "section 8 ngo", url: "./Business_registration/NGOs/Section_8.html" },
    { title: "Trust Registration", cat: "Business Registration", keywords: "trust", url: "./Business_registration/NGOs/trust_registration.html" },

    { title: "GST Registration", cat: "Tax & Compliance", keywords: "gst gstin", url: "/Tax & Compliance/Goods & Services Tax/gst_registration.html" },
    { title: "GST Return Filing", cat: "Tax & Compliance", keywords: "gstr return", url: "/Tax & Compliance/Goods & Services Tax/gst_return_filing.html" },
    { title: "Income Tax E-Filing", cat: "Tax & Compliance", keywords: "itr income tax", url: "./Tax & Compliance/Income_Tax/tax_efiling.html" },
    { title: "ROC Annual Filing", cat: "Tax & Compliance", keywords: "roc annual aoc mgt", url: "/Tax & Compliance/corporate_compliance/roc_annual_filing.html" },
    { title: "DIR-3 KYC Filing", cat: "Tax & Compliance", keywords: "director kyc din", url: "/Tax & Compliance/corporate_compliance/dir3_kyc_filing.html" },
    { title: "Accounting Services", cat: "Tax & Compliance", keywords: "bookkeeping accounts", url: "/Tax & Compliance/accounting & finance/accounting_services.html" },

    { title: "Trademark Registration", cat: "Trademark & IP", keywords: "trademark brand logo tm", url: "/Trademark & Ip/trademark_services/trademark_registration.html" },
    { title: "Trademark Objection", cat: "Trademark & IP", keywords: "tm objection", url: "/Trademark & Ip/trademark_services/trademark_objection.html" },
    { title: "Copyright Registration", cat: "Trademark & IP", keywords: "copyright", url: "/Trademark & Ip/copyright_services/copyright_registration.html" },
    { title: "Patent Registration", cat: "Trademark & IP", keywords: "patent", url: "/Trademark & Ip/patent_services/patent_registration.html" },

    { title: "MSME / Udyam Registration", cat: "Licenses", keywords: "msme udyam", url: "/Licenses/business & municipal/msme_registration.html" },
    { title: "FSSAI Registration", cat: "Licenses", keywords: "fssai food", url: "/Licenses/food & health/fssai_registration.html" },
    { title: "Shop & Establishment", cat: "Licenses", keywords: "shop establishment", url: "/Licenses/business & municipal/shop_establishment_license.html" },
    { title: "IEC Registration", cat: "Licenses", keywords: "import export iec", url: "/Licenses/import export registration/iec_registration.html" },
    { title: "ISO Certification", cat: "Licenses", keywords: "iso", url: "/Licenses/workforce, operations and labour/iso_certification.html" },
    { title: "Digital Signature (DSC)", cat: "Licenses", keywords: "dsc digital signature", url: "/Licenses/workforce, operations and labour/digital_signature_certificate.html" },

    { title: "Close Private Limited Company", cat: "Business Closure", keywords: "closure strike off pvt", url: "/others/business_closuer/pvt_ltd_closuer.html" },
    { title: "Close LLP", cat: "Business Closure", keywords: "llp closure", url: "/others/business_closuer/llp_closuer.html" },
    { title: "LLP to Private Limited", cat: "Conversion", keywords: "convert llp", url: "/others/business_conversion/llp_to_pvt.html" },
    { title: "OPC to Private Limited", cat: "Conversion", keywords: "convert opc", url: "/others/business_conversion/opc_to_pvt.html" },
    { title: "Company Registration", cat: "Business Registration", keywords: "company registration incorporate", url: "/company_registration.html" }
  ];

  var input = document.getElementById("siteSearch");
  var form = document.getElementById("searchForm");
  var popular = document.getElementById("searchPopular");
  var results = document.getElementById("searchResults");
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

    results.innerHTML = list.map(function (s, i) {
      return (
        '<a class="search-result-item" href="' + s.url + '" data-index="' + i + '">' +
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
          goTo(list[0].url);
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
        goTo(currentList[0].url);
      }
    }
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var list = search(input.value);
      if (list[0]) goTo(list[0].url);
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
  var suggestions = document.getElementById("searchSuggestions");
  function openSug() {
    if (typeof window.syncSearchBar === "function") window.syncSearchBar();
    if (suggestions) suggestions.classList.add("is-open");
  }
  function closeSugIfEmpty() {
    if (suggestions && !input.value.trim()) suggestions.classList.remove("is-open");
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

/* Mega panel: left category switches right pane */
(function () {
  document.querySelectorAll(".mega-panel-dropdown").forEach(function (drop) {
    var side = drop.querySelectorAll(".mega-side-item");
    var panes = drop.querySelectorAll(".mega-panel-pane");
    function show(name) {
      if (!name) return;
      side.forEach(function (btn) {
        if (btn.hasAttribute("data-mega-panel")) {
          btn.classList.toggle("is-active", btn.getAttribute("data-mega-panel") === name);
        }
      });
      panes.forEach(function (pane) {
        var on = pane.getAttribute("data-mega-pane") === name;
        pane.classList.toggle("is-active", on);
        pane.hidden = !on;
      });
    }
    side.forEach(function (btn) {
      var panelName = btn.getAttribute("data-mega-panel");
      if (!panelName) return;
      btn.addEventListener("mouseenter", function () {
        show(panelName);
      });
      btn.addEventListener("click", function () {
        show(panelName);
      });
    });
    var first = null;
    for (var i = 0; i < side.length; i++) {
      if (side[i].getAttribute("data-mega-panel")) {
        first = side[i];
        break;
      }
    }
    if (first) show(first.getAttribute("data-mega-panel"));
  });
})();
/* All mega panels open in one fixed slot under Trademarks */
(function () {
  var nav = document.querySelector(".header-row-2 .service-nav") || document.querySelector(".service-nav");
  if (!nav) return;

  var openDrop = null;
  var closeTimer = null;

  function getAnchor() {
    var buttons = nav.querySelectorAll(".service-btn");
    for (var i = 0; i < buttons.length; i++) {
      if (/trademark/i.test((buttons[i].textContent || "").trim())) return buttons[i];
    }
    if (buttons.length) return buttons[Math.min(2, buttons.length - 1)];
    return null;
  }

  function getOtherButton() {
    var buttons = nav.querySelectorAll(".service-btn");
    for (var i = 0; i < buttons.length; i++) {
      if (/other/i.test((buttons[i].textContent || "").trim())) return buttons[i];
    }
    if (buttons.length) return buttons[buttons.length - 1];
    return null;
  }

  function place(panel) {
    var anchor = getAnchor();
    if (!anchor || !panel) return;

    var navRect = nav.getBoundingClientRect();
    var otherBtn = getOtherButton();
    var otherRight = otherBtn ? Math.round(otherBtn.getBoundingClientRect().right) : Math.round(navRect.right);

    var top = Math.round(navRect.bottom + 6);
    var left = 490;

    panel.style.top = top + "px";

    var panelW = panel.offsetWidth || Math.min(920, window.innerWidth - 32);
    var maxRight = Math.min(otherRight, window.innerWidth - 16);

    if (left + panelW > maxRight) {
      left = maxRight - panelW;
    }
    if (left < 16) left = 16;

    panel.style.left = left + "px";
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
/* Sync search bar width and position with service-nav */
(function () {
  var serviceNav = document.querySelector(".header-row-2 .service-nav");
  var searchWrap = document.querySelector(".header-search-wrap");
  var searchBar = document.querySelector(".header-search-inline");
  var searchSuggestions = document.querySelector(".header-row-3 .search-suggestions");

  if (!searchBar || !searchWrap) return;

  function syncSearchBar() {
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
  if (!root) return;
  var btn = root.querySelector("#helpToggle") || root.querySelector("button");
  var menu = root.querySelector("#helpMenu") || root.querySelector(".help-menu");
  if (!btn || !menu) return;

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

/* Floating social links toggle */
(function () {
  var root = document.getElementById("socialFloat");
  var btn = document.getElementById("socialFloatToggle");
  if (!root || !btn) return;

  btn.addEventListener("click", function () {
    var closed = root.classList.toggle("is-closed");
    btn.setAttribute("aria-expanded", closed ? "false" : "true");
  });
})();

/* ISO certificate lightbox */
(function () {
  var trigger = document.getElementById("isoCertTrigger");
  var box = document.getElementById("isoCertLightbox");
  if (!trigger || !box) return;
  function open() {
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function close() {
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  trigger.addEventListener("click", function (e) {
    e.preventDefault();
    open();
  });
  box.querySelectorAll("[data-close-iso]").forEach(function (el) {
    el.addEventListener("click", close);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && box.classList.contains("is-open")) close();
  });
})();

/* Kavach checkmark flip animation */
(function () {
  var check = document.getElementById("kavachCheck");
  if (!check) return;

  var PODS = 7;
  var DURATION = 25000;
  var SLOT = DURATION / PODS;

  var green = false;

  function toggleTick() {
    green = !green;
    check.classList.toggle("is-green", green);
  }

  setInterval(toggleTick, SLOT);
})();

/* =========================================================
   GENERATE QUOTATION MODAL & SYSTEM
   - Full Excel Quotation format matching QUOTATION.xlsx
   - Exact Spreadsheet Twin In-App Modal Preview
   - Pixel-perfect PDF & Excel downloads
   - Pre-defined pricing catalog for all 119 website services
========================================================= */
(function () {
    const openBtn = document.getElementById("openQuotationModal") || document.getElementById("openQuotationModalBtn");
    const modal = document.getElementById("quotationModal");
    const previewModal = document.getElementById("quotationPreviewModal");
    const form = document.getElementById("quotationForm");

    if (!openBtn || !modal || !form) {
        return;
    }

    const dateInput = document.getElementById("quotationDate");
    const customerNameInput = document.getElementById("customerName") || document.getElementById("quotationCustomerName");
    const addressInput = document.getElementById("billingAddress") || document.getElementById("quotationAddress");
    const stateInput = document.getElementById("quotationState");
    const customerGSTInput = document.getElementById("customerGST") || document.getElementById("quotationCustomerGST");

    const servicesList = document.getElementById("quotationServicesList");
    const addServiceBtn = document.getElementById("addServiceItemBtn");

    const gstInput = document.getElementById("quotationGST");
    const roundOffInput = document.getElementById("quotationRoundOff");

    const subtotalEl = document.getElementById("quotationSubtotal");
    const gstAmountEl = document.getElementById("quotationGSTAmount");
    const grandTotalEl = document.getElementById("quotationGrandTotal");

    let generatedWorkbook = null;
    let quotationData = null;

    /* =====================================================
       DEFAULT DATE
    ===================================================== */
    if (dateInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        dateInput.value = `${year}-${month}-${day}`;
    }

    /* =====================================================
       CURRENCY FORMATTER
    ===================================================== */
    function currency(value) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }).format(Number(value) || 0);
    }

    /* =====================================================
       ESCAPE HTML HELPER
    ===================================================== */
    function escapeHtml(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    /* =====================================================
       SERVICES CATALOG WITH PRE-DEFINED PRICING
       Covers all services offered across the website.
    ===================================================== */
    const SERVICES_CATALOG = [
        {
            category: "Company Registration & Incorporation",
            services: [
                { name: "Private Limited Company Registration", price: 6999 },
                { name: "Limited Liability Partnership (LLP) Registration", price: 4999 },
                { name: "One Person Company (OPC) Registration", price: 5999 },
                { name: "Sole Proprietorship Registration", price: 1999 },
                { name: "Partnership Firm Registration", price: 2999 },
                { name: "Startup India Registration", price: 3499 },
                { name: "Public Limited Company Registration", price: 14999 },
                { name: "Partnership Firm Annual Compliance", price: 1999 }
            ]
        },
        {
            category: "NGO & Non-Profit Organization",
            services: [
                { name: "Section 8 Company Registration", price: 9999 },
                { name: "Trust Registration", price: 7499 },
                { name: "Society Registration", price: 7499 },
                { name: "Section 12A & 80G Registration", price: 4999 },
                { name: "FCRA Registration", price: 11999 },
                { name: "NGO Darpan Registration", price: 1499 },
                { name: "CSR-1 Filing", price: 2499 }
            ]
        },
        {
            category: "Goods & Services Tax (GST)",
            services: [
                { name: "GST Registration", price: 1499 },
                { name: "Monthly / Quarterly GST Return Filing", price: 999 },
                { name: "Annual Return Filing (GSTR-9)", price: 2999 },
                { name: "GST Final Return (GSTR-10)", price: 1999 },
                { name: "Letter of Undertaking (LUT) Filing", price: 999 },
                { name: "GST Amendment Service", price: 1199 },
                { name: "GST Cancellation & Surrender", price: 1999 },
                { name: "GST Notice Response & Consultation", price: 2499 }
            ]
        },
        {
            category: "Income Tax & TDS",
            services: [
                { name: "Income Tax Return (ITR) E-Filing", price: 999 },
                { name: "ITR-1 (Sahaj) Filing", price: 799 },
                { name: "ITR-2 Filing (Capital Gains / Foreign Assets)", price: 1999 },
                { name: "ITR-3 Filing (Business & Professional)", price: 2999 },
                { name: "ITR-4 (Sugam) Presumptive Taxation Filing", price: 1999 },
                { name: "ITR-5 Filing (LLP / Partnership / AOP)", price: 3999 },
                { name: "ITR-6 Filing (Companies)", price: 6999 },
                { name: "ITR-7 Filing (Trusts & Non-Profits)", price: 4999 },
                { name: "Business Tax Filing & Advisory", price: 2499 },
                { name: "TDS Quarterly Return Filing", price: 1499 },
                { name: "TAN Registration", price: 999 },
                { name: "Income Tax Notice Response & Assessment", price: 2499 }
            ]
        },
        {
            category: "Corporate Compliances & ROC",
            services: [
                { name: "Private Limited Company Annual ROC Compliance", price: 11999 },
                { name: "LLP Annual ROC Compliance (Form 11 & Form 8)", price: 5999 },
                { name: "One Person Company (OPC) Annual Compliance", price: 7999 },
                { name: "ROC Annual Filing (AOC-4 & MGT-7)", price: 4999 },
                { name: "DIR-3 KYC Web / e-Form Filing", price: 499 },
                { name: "Section-8 Company Annual Compliance", price: 8999 },
                { name: "Statutory Auditor Appointment (Form ADT-1)", price: 1499 },
                { name: "DPT-3 Return of Deposits Filing", price: 1999 }
            ]
        },
        {
            category: "Event-Based ROC Compliances",
            services: [
                { name: "Add or Remove Partner in LLP", price: 2499 },
                { name: "LLP Agreement Amendment (Form 3)", price: 2499 },
                { name: "Appointment / Resignation of Director (DIR-12)", price: 1999 },
                { name: "Increase in Authorized Share Capital (SH-7)", price: 3999 },
                { name: "Change in Registered Office Address (INC-22)", price: 2999 },
                { name: "Company Name Change (INC-24)", price: 4999 },
                { name: "Alteration of MOA / Object Clause (MGT-14)", price: 3499 },
                { name: "Allotment of Shares / Securities (PAS-3)", price: 3499 },
                { name: "Change / Removal of Statutory Auditor (ADT-2)", price: 2499 },
                { name: "Director KYC Verification & Restoration", price: 999 },
                { name: "Creation / Modification of Charge (CHG-1)", price: 2999 },
                { name: "Satisfaction of Charge (CHG-4)", price: 1999 },
                { name: "Change in Management / Shareholding Pattern", price: 2499 },
                { name: "Change in Corporate Business Address", price: 1499 }
            ]
        },
        {
            category: "Accounting & Financial Services",
            services: [
                { name: "Monthly Bookkeeping & Accounting Services", price: 4999 },
                { name: "Annual Financial Statement Preparation", price: 14999 },
                { name: "Tax Audit Assistance (Form 3CA/3CB-3CD)", price: 7499 },
                { name: "Statutory Audit Support & Coordination", price: 9999 },
                { name: "Financial Due Diligence & Valuation Report", price: 14999 },
                { name: "Accounts Payable & Receivable Management", price: 5999 }
            ]
        },
        {
            category: "Trademark & Intellectual Property",
            services: [
                { name: "Trademark Registration & Filing", price: 4499 },
                { name: "Trademark Registration Certificate Assistance", price: 1499 },
                { name: "Trademark Objection Reply Drafting", price: 2999 },
                { name: "Trademark Opposition Hearing & Notice", price: 7499 },
                { name: "Trademark Show Cause Hearing Representation", price: 4999 },
                { name: "Trademark Renewal Filing", price: 3499 },
                { name: "Trademark Assignment & Ownership Transfer", price: 3999 },
                { name: "Expedited Trademark Examination Filing", price: 9999 },
                { name: "Copyright Registration", price: 4999 },
                { name: "Provisional Patent Application Filing", price: 14999 },
                { name: "Complete Patent Application Filing", price: 24999 },
                { name: "Trademark Infringement Legal Notice", price: 2999 }
            ]
        },
        {
            category: "Business & Municipal Licenses",
            services: [
                { name: "MSME / Udyam Registration Certificate", price: 999 },
                { name: "Trade License Registration & Renewal", price: 2499 },
                { name: "Shop and Establishment Act Registration (Gumasta)", price: 1999 },
                { name: "Professional Tax Registration (PTEC & PTRC)", price: 1499 },
                { name: "Factory License Application & Compliance", price: 7499 },
                { name: "Contract Labor Regulation License (CLRA)", price: 4999 }
            ]
        },
        {
            category: "Food & Healthcare Licenses",
            services: [
                { name: "FSSAI Basic Registration", price: 1499 },
                { name: "FSSAI State License", price: 4999 },
                { name: "FSSAI Central License", price: 9999 },
                { name: "FSSAI Annual Return Filing", price: 1499 },
                { name: "Retail / Wholesale Drug License", price: 9999 },
                { name: "AYUSH Manufacturing / Marketing License", price: 11999 },
                { name: "Cosmetic Manufacturing License", price: 8999 },
                { name: "Medical Device Registration & Import License", price: 14999 }
            ]
        },
        {
            category: "Import & Export Licensing",
            services: [
                { name: "Import Export Code (IEC) Registration", price: 1499 },
                { name: "IEC Modification & Annual Profile Update", price: 799 },
                { name: "AD Code Registration with Custom Port", price: 1999 },
                { name: "Registration Cum Membership Certificate (RCMC)", price: 3499 },
                { name: "APEDA Registration for Agricultural Export", price: 4999 },
                { name: "Spices Board Registration (CRES)", price: 4999 }
            ]
        },
        {
            category: "Environmental & Pollution Compliances",
            services: [
                { name: "EPR Registration for Plastic Waste Management", price: 9999 },
                { name: "EPR Registration for E-Waste Management", price: 11999 },
                { name: "Consent to Establish (CTE) / Operate (CTO) Pollution NOC", price: 14999 },
                { name: "Environmental Impact Assessment (EIA) Support", price: 19999 },
                { name: "Environmental Audit & Compliance Reporting", price: 14999 }
            ]
        },
        {
            category: "Business Closure & Conversions",
            services: [
                { name: "Private Limited Company Strike Off (Form STK-2)", price: 9999 },
                { name: "LLP Closure & Strike Off (Form 24)", price: 6999 },
                { name: "OPC Closure & Strike Off", price: 7999 },
                { name: "Partnership Firm Dissolution", price: 3999 },
                { name: "Sole Proprietorship Closure", price: 1499 },
                { name: "Sole Proprietorship to Private Limited Conversion", price: 11999 },
                { name: "Partnership Firm to LLP Conversion", price: 9999 },
                { name: "LLP to Private Limited Company Conversion", price: 14999 },
                { name: "Private Limited to Public Limited Conversion", price: 19999 }
            ]
        },
        {
            category: "Fundraising & Advisory",
            services: [
                { name: "Investor Pitch Deck Preparation", price: 9999 },
                { name: "Financial Model & Valuation Projections", price: 14999 },
                { name: "Shareholders Agreement (SHA) & Term Sheet Drafting", price: 7999 },
                { name: "Investor Due Diligence Readiness Support", price: 19999 },
                { name: "Global impact fund", price:5000}
            ]
        }
    ];

    /* =====================================================
       POPULAR SERVICES (TOP 10) & COMPLETE SERVICE CATALOG
    ===================================================== */
    const POPULAR_SERVICES = [
        { name: "Private Limited Company Registration", price: 6999, category: "Company Registration & Incorporation" },
        { name: "Limited Liability Partnership (LLP) Registration", price: 4999, category: "Company Registration & Incorporation" },
        { name: "One Person Company (OPC) Registration", price: 5999, category: "Company Registration & Incorporation" },
        { name: "Startup India Registration", price: 3499, category: "Company Registration & Incorporation" },
        { name: "GST Registration", price: 1499, category: "Goods & Services Tax (GST)" },
        { name: "Monthly / Quarterly GST Return Filing", price: 999, category: "Goods & Services Tax (GST)" },
        { name: "Income Tax Return (ITR) E-Filing", price: 999, category: "Income Tax & Direct Tax" },
        { name: "Trademark Registration & Filing", price: 4499, category: "Trademark & Intellectual Property" },
        { name: "MSME / Udyam Registration Certificate", price: 999, category: "Business & Municipal Licenses" },
        { name: "FSSAI Basic Registration", price: 1499, category: "Food & Healthcare Licenses" }
    ];

    const ALL_SERVICES = [];
    SERVICES_CATALOG.forEach(cat => {
        cat.services.forEach(svc => {
            ALL_SERVICES.push({
                name: svc.name,
                price: svc.price,
                category: cat.category
            });
        });
    });

    /**
     * Generates HTML option items for the 10 popular services + Other option.
     */
    function getPopularServicesOptionsHtml(selectedServiceName) {
        let html = '<option value="" disabled>-- Select a Service --</option>';
        let found = false;
        POPULAR_SERVICES.forEach(svc => {
            const isSelected = svc.name === selectedServiceName;
            if (isSelected) found = true;
            html += `<option value="${escapeHtml(svc.name)}" data-price="${svc.price}"${isSelected ? " selected" : ""}>${escapeHtml(svc.name)}</option>`;
        });
        if (selectedServiceName && !found && selectedServiceName !== "__OTHER__") {
            const customSvc = ALL_SERVICES.find(s => s.name === selectedServiceName);
            const price = customSvc ? customSvc.price : 0;
            html += `<option value="${escapeHtml(selectedServiceName)}" data-price="${price}" selected>${escapeHtml(selectedServiceName)}</option>`;
        }
        html += `<option value="__OTHER__">Other &mdash; Search from 100+ services...</option>`;
        return html;
    }

    /**
     * Sets up interactive search and autocomplete suggestions for a service row.
     */
    function setupRowSearch(row) {
        const select = row.querySelector(".item-service-select");
        const searchWrap = row.querySelector(".quotation-other-search-wrap");
        const searchInput = row.querySelector(".quotation-other-search-input");
        const switchBackBtn = row.querySelector(".quotation-search-switch-back-btn");
        const suggestionsBox = row.querySelector(".quotation-suggestions-dropdown");
        const priceDisplay = row.querySelector(".item-price-display");

        if (!select || !searchWrap || !searchInput || !suggestionsBox) return;

        function renderSuggestions(query) {
            const q = (query || "").trim().toLowerCase();
            let matches = [];
            if (!q) {
                matches = ALL_SERVICES.filter(s => !POPULAR_SERVICES.some(p => p.name === s.name)).slice(0, 10);
            } else {
                matches = ALL_SERVICES.filter(s => 
                    s.name.toLowerCase().includes(q) || 
                    s.category.toLowerCase().includes(q)
                ).slice(0, 15);
            }

            if (matches.length === 0) {
                suggestionsBox.innerHTML = `<div class="quotation-suggestion-empty">No matching services found for "${escapeHtml(query)}"</div>`;
                suggestionsBox.style.display = "block";
                return;
            }

            let html = "";
            matches.forEach((s, idx) => {
                let displayName = escapeHtml(s.name);
                if (q) {
                    const regex = new RegExp(`(${escapeRegex(q)})`, "gi");
                    displayName = displayName.replace(regex, "<mark class='quotation-search-highlight'>$1</mark>");
                }
                html += `
                    <div class="quotation-suggestion-item" data-index="${idx}" data-name="${escapeHtml(s.name)}" data-price="${s.price}">
                        <div class="quotation-suggestion-info">
                            <div class="quotation-suggestion-name">${displayName}</div>
                            <div class="quotation-suggestion-cat">${escapeHtml(s.category)}</div>
                        </div>
                    </div>
                `;
            });
            suggestionsBox.innerHTML = html;
            suggestionsBox.style.display = "block";
        }

        select.addEventListener("change", function () {
            if (select.value === "__OTHER__") {
                searchWrap.style.display = "block";
                searchInput.value = "";
                renderSuggestions("");
                setTimeout(() => searchInput.focus(), 50);
            } else {
                searchWrap.style.display = "none";
                suggestionsBox.style.display = "none";
                calculate();
            }
        });

        searchInput.addEventListener("input", function () {
            renderSuggestions(searchInput.value);
        });

        searchInput.addEventListener("focus", function () {
            renderSuggestions(searchInput.value);
        });

        suggestionsBox.addEventListener("click", function (e) {
            const item = e.target.closest(".quotation-suggestion-item");
            if (item) {
                const name = item.dataset.name;
                const price = parseFloat(item.dataset.price) || 0;
                selectServiceFromSearch(name, price);
            }
        });

        function selectServiceFromSearch(name, price) {
            searchInput.value = name;
            suggestionsBox.style.display = "none";

            let opt = Array.from(select.options).find(o => o.value === name);
            if (!opt) {
                opt = document.createElement("option");
                opt.value = name;
                opt.dataset.price = price;
                opt.textContent = name;
                const otherOpt = Array.from(select.options).find(o => o.value === "__OTHER__");
                if (otherOpt) {
                    select.insertBefore(opt, otherOpt);
                } else {
                    select.appendChild(opt);
                }
            }
            select.value = name;
            if (priceDisplay) priceDisplay.value = currency(price);
            calculate();
        }

        row.selectServiceFromSearch = selectServiceFromSearch;

        if (switchBackBtn) {
            switchBackBtn.addEventListener("click", function () {
                searchWrap.style.display = "none";
                suggestionsBox.style.display = "none";
                select.value = POPULAR_SERVICES[0].name;
                calculate();
                select.focus();
            });
        }

        document.addEventListener("click", function (e) {
            if (!row.contains(e.target)) {
                suggestionsBox.style.display = "none";
            }
        });
    }

    /* =====================================================
       CALCULATE MULTI-SERVICE TOTALS (AUTOMATIC PRICING & VIEW-ONLY PRICE CELL)
    ===================================================== */
    function calculate() {
        const itemElements = servicesList
            ? servicesList.querySelectorAll(".quotation-service-item")
            : [];
        const items = [];
        let subtotal = 0;

        itemElements.forEach((row, idx) => {
            const selectEl = row.querySelector(".item-service-select");
            const priceInput = row.querySelector(".item-price-display");

            const selectedOption = selectEl?.selectedOptions?.[0];
            let serviceName = selectedOption && selectedOption.value && selectedOption.value !== "__OTHER__"
                ? selectedOption.value
                : "";

            if (!serviceName) {
                const searchVal = row.querySelector(".quotation-other-search-input")?.value.trim();
                if (searchVal) serviceName = searchVal;
            }

            const rate = selectedOption ? (parseFloat(selectedOption.dataset.price) || 0) : 0;
            const quantity = 1;
            const amount = rate * quantity;

            if (priceInput) {
                priceInput.value = currency(rate);
            }

            subtotal += amount;
            items.push({
                index: idx + 1,
                quantity,
                rate,
                description: serviceName,
                amount
            });
        });

        const gst = Number(gstInput?.value) || 0;
        const roundOff = Number(roundOffInput?.value) || 0;
        const gstAmount = (subtotal * gst) / 100;
        const grandTotal = subtotal + gstAmount + roundOff;

        if (subtotalEl) subtotalEl.textContent = currency(subtotal);
        if (gstAmountEl) gstAmountEl.textContent = currency(gstAmount);
        if (grandTotalEl) grandTotalEl.textContent = currency(grandTotal);

        return {
            items,
            subtotal,
            gst,
            gstAmount,
            roundOff,
            grandTotal
        };
    }

    /* =====================================================
       DYNAMIC SERVICE ROWS MANAGEMENT
    ===================================================== */
    function updateServiceIndices() {
        if (!servicesList) return;
        const items = servicesList.querySelectorAll(".quotation-service-item");
        items.forEach((item, idx) => {
            item.setAttribute("data-item-index", idx);
            const title = item.querySelector(".service-item-number");
            if (title) title.textContent = `Service #${idx + 1}`;

            let header = item.querySelector(".quotation-service-item-header");
            let removeBtn = item.querySelector(".quotation-remove-service-btn");

            if (items.length > 1) {
                if (!removeBtn && header) {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "quotation-remove-service-btn";
                    btn.title = "Remove Service";
                    btn.setAttribute("aria-label", "Remove Service");
                    btn.innerHTML = "&times;";
                    header.appendChild(btn);
                }
            } else {
                if (removeBtn) {
                    removeBtn.remove();
                }
            }
        });
    }

    if (addServiceBtn && servicesList) {
        addServiceBtn.addEventListener("click", function () {
            const currentCount = servicesList.querySelectorAll(".quotation-service-item").length;
            const newIndex = currentCount;
            const defaultService = POPULAR_SERVICES[0];
            const newItem = document.createElement("div");
            newItem.className = "quotation-service-item";
            newItem.setAttribute("data-item-index", newIndex);
            newItem.innerHTML = `
                <div class="quotation-service-item-header">
                    <span class="service-item-number">Service #${newIndex + 1}</span>
                    <button type="button" class="quotation-remove-service-btn" title="Remove Service" aria-label="Remove Service">&times;</button>
                </div>
                <div class="quotation-form-grid quotation-service-grid">
                    <div class="quotation-field quotation-service-select-field">
                        <label>Service Name</label>
                        <div class="quotation-service-selector-wrap">
                            <select class="item-service-select" required>
                                ${getPopularServicesOptionsHtml(defaultService.name)}
                            </select>
                            <div class="quotation-other-search-wrap" style="display: none;">
                                <div class="quotation-search-bar-inner">
                                    <svg class="quotation-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    <input type="text" class="quotation-other-search-input" placeholder="Search 100+ services (e.g. ISO, Patent, ROC)..." autocomplete="off">
                                    <button type="button" class="quotation-search-switch-back-btn" title="Back to popular list">Popular List</button>
                                </div>
                                <div class="quotation-suggestions-dropdown" style="display: none;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="quotation-field quotation-service-price-field">
                        <label>Price</label>
                        <input type="text" class="item-price-display" readonly value="${currency(defaultService.price)}" aria-label="Service Price">
                        <input type="hidden" class="item-quantity" value="1">
                    </div>
                </div>
            `;
            servicesList.appendChild(newItem);
            setupRowSearch(newItem);
            updateServiceIndices();
            calculate();
            const selectEl = newItem.querySelector(".item-service-select");
            if (selectEl) selectEl.focus();
        });

        servicesList.addEventListener("change", function (e) {
            if (e.target.matches(".item-service-select")) {
                calculate();
            }
        });

        servicesList.addEventListener("click", function (e) {
            const removeBtn = e.target.closest(".quotation-remove-service-btn");
            if (removeBtn) {
                const item = removeBtn.closest(".quotation-service-item");
                if (item) {
                    item.remove();
                    updateServiceIndices();
                    calculate();
                }
            }
        });
    }

    [gstInput, roundOffInput].forEach(input => {
        if (input) {
            input.addEventListener("input", calculate);
        }
    });

    // Initialize initial service dropdown with popular options
    const initialSelect = document.getElementById("quotationServiceSelect");
    if (initialSelect) {
        initialSelect.innerHTML = getPopularServicesOptionsHtml("Private Limited Company Registration");
    }

    const initialRow = servicesList ? servicesList.querySelector(".quotation-service-item") : null;
    if (initialRow) {
        setupRowSearch(initialRow);
    }

    updateServiceIndices();
    calculate();

    /* =====================================================
       OPEN MODAL
    ===================================================== */
    function openQuotationModalDirect(prefill) {
        quotationData = null;
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        var nameToFill = (prefill && prefill.customerName) || "";
        if (!nameToFill) {
            try {
                nameToFill = localStorage.getItem("corporateMart_leadName") || "";
            } catch (e) {}
        }
        if (nameToFill && customerNameInput) {
            customerNameInput.value = nameToFill;
        }

        if (prefill && prefill.serviceName && servicesList) {
            var firstRow = servicesList.querySelector(".quotation-service-item");
            var firstRowSelect = firstRow ? firstRow.querySelector(".item-service-select") : null;
            if (firstRow && firstRowSelect) {
                var targetService = prefill.serviceName.trim().toLowerCase();
                var matchedPopular = POPULAR_SERVICES.find(s => s.name.toLowerCase().includes(targetService) || targetService.includes(s.name.toLowerCase()));
                if (matchedPopular) {
                    firstRowSelect.value = matchedPopular.name;
                    firstRowSelect.dispatchEvent(new Event("change"));
                } else {
                    var matchedCatalog = ALL_SERVICES.find(s => s.name.toLowerCase().includes(targetService) || targetService.includes(s.name.toLowerCase()));
                    if (matchedCatalog && typeof firstRow.selectServiceFromSearch === "function") {
                        var searchWrap = firstRow.querySelector(".quotation-other-search-wrap");
                        if (searchWrap) searchWrap.style.display = "block";
                        firstRow.selectServiceFromSearch(matchedCatalog.name, matchedCatalog.price);
                    }
                }
            }
        }

        setTimeout(function () {
            if (customerNameInput && !customerNameInput.value.trim()) {
                customerNameInput.focus();
            } else if (addressInput) {
                addressInput.focus();
            }
        }, 200);
    }

    window.openQuotationModal = openQuotationModalDirect;

    function handleOpenQuotationClick(e) {
        if (e) e.preventDefault();

        var isFilled = false;
        try {
            isFilled = localStorage.getItem("corporateMart_leadSubmitted") === "true";
        } catch (err) {
            isFilled = false;
        }

        if (isFilled) {
            // Already filled lead form -> proceed directly to quotation form
            openQuotationModalDirect();
        } else {
            // Not filled yet -> open lead modal form first
            window.pendingQuotationAfterLead = true;
            if (typeof window.openLeadModal === "function") {
                window.openLeadModal(true);
            } else {
                var leadM = document.getElementById("leadModal");
                if (leadM) {
                    leadM.classList.add("is-open");
                    leadM.setAttribute("aria-hidden", "false");
                    document.body.style.overflow = "hidden";
                    var nameField = document.getElementById("leadName");
                    if (nameField) setTimeout(function () { nameField.focus(); }, 200);
                }
            }
        }
    }

    openBtn.addEventListener("click", handleOpenQuotationClick);

    // Also support any other quotation triggers if added
    document.querySelectorAll("[data-open-quotation], .open-quotation-btn").forEach(btn => {
        if (btn !== openBtn) {
            btn.addEventListener("click", handleOpenQuotationClick);
        }
    });

    /* =====================================================
       CLOSE MODAL
    ===================================================== */
    document.querySelectorAll("[data-close-quotation]").forEach(button => {
        button.addEventListener("click", function () {
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        });
    });

    /* =====================================================
       DATE FORMAT (DD-MM-YYYY)
    ===================================================== */
    function formatDate(date) {
        if (!date) return "";
        const parts = date.split("-");
        if (parts.length !== 3) return date;
        return parts[2] + "-" + parts[1] + "-" + parts[0];
    }

    /* =====================================================
       LOAD ORIGINAL EXCEL TEMPLATE
    ===================================================== */
    async function loadTemplate() {
        if (typeof ExcelJS === "undefined") {
            throw new Error("ExcelJS is not loaded.");
        }

        const response = await fetch("QUOTATION.xlsx", { cache: "no-store" });
        if (!response.ok) {
            throw new Error("Could not load QUOTATION.xlsx template file.");
        }

        const buffer = await response.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        return workbook;
    }

    /* =====================================================
       FILL TEMPLATE
       Preserves all original template styling, layout & formatting.
       - Company Name in CAPS next to "BILL TO : " (Row 6, Cell A6)
       - Address in Row 7 (Cell A7)
       - State in Row 9, GST in Row 11
       - Dynamic expansion if services > 7
       - Quantity formatted as number '#,##0' (NO ₹)
       - Amount formatted as '₹#,##0.00'
       - Totals shifted appropriately
    ===================================================== */
    function fillTemplate(workbook, data) {
        const sheet = workbook.getWorksheet("Sheet1");
        if (!sheet) {
            throw new Error("Sheet1 not found in quotation template.");
        }

        /* 1. Date in D3 */
        sheet.getCell("D3").value = formatDate(data.date);

        /* 2. Customer Name in CAPS next to "BILL TO : " in Row 6 (A6:D6 merged) */
        sheet.getCell("A6").value = "BILL TO : " + (data.customerName || "").toUpperCase() + (data.quotationNumber ? ("                  QUOTATION NO : " + data.quotationNumber) : "");

        /* 3. Address in Row 7 (A7:D7 merged) */
        sheet.getCell("A7").value = data.billingAddress || "";

        /* 4. State in Row 9 (Cell C9 in merged block) */
        sheet.getCell("C9").value = data.state || "Gujarat";

        /* 5. Customer GST in Row 11 (Cell C11 in merged block) */
        sheet.getCell("C11").value = data.customerGST || "";

        /* 6. Dynamic Table Rows (Services start at Row 13) */
        const baseRow = 13;
        const defaultSlotCount = 7; // Rows 13 to 19
        const needed = data.items.length;
        const extraRowsNeeded = Math.max(0, needed - defaultSlotCount);

        if (extraRowsNeeded > 0) {
            sheet.duplicateRow(19, extraRowsNeeded, true);

            for (let r = 20; r < 20 + extraRowsNeeded; r++) {
                const row = sheet.getRow(r);
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.value = null;
                });
            }
        }

        data.items.forEach((item, index) => {
            const rowNumber = baseRow + index;
            const row = sheet.getRow(rowNumber);

            const qtyCell = row.getCell(1); // Column A
            const descCell = row.getCell(2); // Column B
            const amtCell = row.getCell(3); // Column C

            qtyCell.value = Number(item.quantity) || 0;
            qtyCell.numFmt = '#,##0';

            descCell.value = item.description || "";

            amtCell.value = Number(item.amount) || 0;
            amtCell.numFmt = '"₹"#,##0.00;[Red]-"₹"#,##0.00;"₹"0.00';
        });

        for (let i = needed; i < defaultSlotCount + extraRowsNeeded; i++) {
            const rowNumber = baseRow + i;
            const row = sheet.getRow(rowNumber);
            row.getCell(1).value = null;
            row.getCell(2).value = null;
            row.getCell(3).value = null;
        }

        const totalRowNumber = 20 + extraRowsNeeded;
        const gstRowNumber = 21 + extraRowsNeeded;
        const roundOffRowNumber = 22 + extraRowsNeeded;
        const grandTotalRowNumber = 23 + extraRowsNeeded;

        const totalCell = sheet.getRow(totalRowNumber).getCell(3);
        totalCell.value = Number(data.subtotal) || 0;
        totalCell.numFmt = '"₹"#,##0.00;[Red]-"₹"#,##0.00;"₹"0.00';

        const gstLabelCell = sheet.getRow(gstRowNumber).getCell(1);
        if (gstLabelCell) {
            gstLabelCell.value = `GST ${data.gst}%`;
        }
        const gstCell = sheet.getRow(gstRowNumber).getCell(3);
        gstCell.value = Number(data.gstAmount) || 0;
        gstCell.numFmt = '"₹"#,##0.00;[Red]-"₹"#,##0.00;"₹"0.00';

        const roundOffCell = sheet.getRow(roundOffRowNumber).getCell(3);
        roundOffCell.value = Number(data.roundOff) || 0;
        roundOffCell.numFmt = '"₹"#,##0.00;[Red]-"₹"#,##0.00;"₹"0.00';

        const grandTotalCell = sheet.getRow(grandTotalRowNumber).getCell(3);
        grandTotalCell.value = Number(data.grandTotal) || 0;
        grandTotalCell.numFmt = '"₹"#,##0.00;[Red]-"₹"#,##0.00;"₹"0.00';

        return workbook;
    }

    /* =====================================================
       COLLECT DATA
    ===================================================== */
    function collectData() {
        const calculation = calculate();
        const existingNo = (quotationData && quotationData.quotationNumber) ? quotationData.quotationNumber : "";
        const quotationNumber = existingNo || `CMPL/2026-27/${Math.floor(1000 + Math.random() * 9000)}`;

        return {
            quotationNumber: quotationNumber,
            date: dateInput ? dateInput.value : "",
            customerName: customerNameInput ? customerNameInput.value.trim() : "",
            billingAddress: addressInput ? addressInput.value.trim() : "",
            state: stateInput ? stateInput.value.trim() : "",
            customerGST: customerGSTInput ? customerGSTInput.value.trim() : "",
            items: calculation.items,
            subtotal: calculation.subtotal,
            gst: calculation.gst,
            gstAmount: calculation.gstAmount,
            roundOff: calculation.roundOff,
            grandTotal: calculation.grandTotal
        };
    }

    /* =====================================================
       EXTRACT TEMPLATE METADATA DIRECTLY FROM QUOTATION.XLSX
       Dynamically reads company info, bank info, signatory & footer banner
       so ANY changes made in QUOTATION.xlsx reflect in preview & PDF.
    ===================================================== */
    function extractTemplateMeta(workbook) {
        if (!workbook) return null;
        const sheet = workbook.getWorksheet("Sheet1");
        if (!sheet) return null;

        function getCellText(cell) {
            if (!cell || cell.value === null || cell.value === undefined) return "";
            const v = cell.value;
            if (typeof v === "string" || typeof v === "number") return String(v).trim();
            if (v.richText && Array.isArray(v.richText)) {
                return v.richText.map(r => r.text || "").join("").trim();
            }
            if (v.text) return String(v.text).trim();
            return String(v).trim();
        }

        let companyName = getCellText(sheet.getCell("A25")) || "CORPORATEMART PRIVATE LIMITED";
        let office = getCellText(sheet.getCell("A26")) || "Office: 403, Emerald Complex, Nr. Swastik Cross Road, Navrangpura, Ahmedabad - 380009";
        let gst = getCellText(sheet.getCell("A28")) || "GST : 24AANCC2934R1Z3";
        let accountNo = getCellText(sheet.getCell("A29")) || "Account No :50200119641366";
        let ifsc = getCellText(sheet.getCell("A30")) || "IFSC CODE : HDFC0001678";
        let branch = getCellText(sheet.getCell("A31")) || "Branch Name : Navrangpura Branch";
        let bank = getCellText(sheet.getCell("A32")) || "Bank name : HDFC BANK LTD";
        let upi = getCellText(sheet.getCell("A33")) || "UPI - corporatemartprivate.82229585@hdfcbank";
        let forCompany = getCellText(sheet.getCell("A36")) || "For,    CORPORATEMART PRIVATE LIMITED";
        let signatory = getCellText(sheet.getCell("A37")); // Will be empty if removed in Excel
        let footerBanner = getCellText(sheet.getCell("A38")) || "This is a system-generated quotation and does not require a signature.";

        // Also scan rows below row 20 in case rows were shifted or modified in Excel
        sheet.eachRow((row, rNum) => {
            if (rNum >= 20) {
                const text = getCellText(row.getCell(1));
                if (/^GST\s*:/i.test(text) && text.length > 10) gst = text;
                else if (/^Account\s*No/i.test(text)) accountNo = text;
                else if (/^IFSC/i.test(text)) ifsc = text;
                else if (/^Branch\s*Name/i.test(text)) branch = text;
                else if (/^Bank\s*name/i.test(text)) bank = text;
                else if (/^UPI/i.test(text)) upi = text;
                else if (/^For,/i.test(text)) forCompany = text;
                else if (/Authorised\s*Signatory/i.test(text)) signatory = text;
                else if (/system-generated|appreciate your business/i.test(text) || rNum === 38) {
                    if (text) footerBanner = text;
                }
            }
        });

        return {
            companyName,
            office,
            gst,
            accountNo,
            ifsc,
            branch,
            bank,
            upi,
            forCompany,
            signatory,
            footerBanner
        };
    }

    /* =====================================================
       RENDER REAL DOCUMENT PREVIEW
    ===================================================== */
    function renderPreview(data, templateMeta) {
        if (!previewModal) return;
        const preview = previewModal.querySelector("#quotationPreviewContent");
        if (!preview) return;

        const isDark = document.body.classList.contains("dark-mode");
        const logoSrc = isDark
            ? "icons/Your_paragraph_text__9_-removebg-preview.png"
            : "icons/Your_paragraph_text__8_-removebg-preview.png";

        const meta = templateMeta || (data && data.templateMeta) || {
            companyName: "CORPORATEMART PRIVATE LIMITED",
            office: "Office: 403, Emerald Complex, Nr. Swastik Cross Road, Navrangpura, Ahmedabad - 380009",
            gst: "GST : 24AANCC2934R1Z3",
            accountNo: "Account No :50200119641366",
            ifsc: "IFSC CODE : HDFC0001678",
            branch: "Branch Name : Navrangpura Branch",
            bank: "Bank name : HDFC BANK LTD",
            upi: "UPI - corporatemartprivate.82229585@hdfcbank",
            forCompany: "For,    CORPORATEMART PRIVATE LIMITED",
            signatory: "",
            footerBanner: "This is a system-generated quotation and does not require a signature."
        };

        let itemsRowsHtml = "";
        data.items.forEach(item => {
            itemsRowsHtml += `
                <tr class="excel-item-row">
                    <td class="col-qty">${item.quantity}</td>
                    <td class="col-desc">${escapeHtml(item.description)}</td>
                    <td class="col-amount">${currency(item.amount)}</td>
                </tr>
            `;
        });

        preview.innerHTML = `
            <div class="quotation-sheet-preview excel-doc-sheet">
                <!-- Row 1: Header Title -->
                <div class="excel-header-title">
                    QUOTATION
                </div>

                <!-- Rows 2-3: Logo & Date -->
                <div class="excel-top-meta">
                    <div class="excel-top-logo">
                        <img src="${logoSrc}" alt="CorporateMart" class="qs-logo">
                    </div>
                    <div class="excel-top-date">
                        <span class="excel-date-label">Date :</span>
                        <span class="excel-date-val">${formatDate(data.date)}</span>
                    </div>
                </div>

                <!-- Row 6: BILL TO Banner -->
                <div class="excel-teal-banner excel-bill-banner">
                    <span class="excel-bill-to-text">BILL TO : ${escapeHtml(data.customerName.toUpperCase())}</span>
                    <span class="excel-quotation-no-text">QUOTATION NO : ${escapeHtml(data.quotationNumber)}</span>
                </div>

                <!-- Rows 7-11: Customer Info -->
                <div class="excel-customer-details">
                    <div class="excel-cust-line excel-cust-address">${escapeHtml(data.billingAddress || "")}</div>
                    <div class="excel-cust-line excel-cust-state"><strong>State &nbsp;: &nbsp;</strong>${escapeHtml(data.state || "Gujarat")}</div>
                    <div class="excel-cust-line excel-cust-gst"><strong>GST &nbsp;&nbsp;&nbsp;: &nbsp;</strong>${escapeHtml(data.customerGST || "")}</div>
                </div>

                <!-- Table Rows 12 to 23 -->
                <table class="excel-table">
                    <thead>
                        <tr class="excel-th-row">
                            <th class="col-qty">QUANTITY</th>
                            <th class="col-desc">DESCRIPTION</th>
                            <th class="col-amount">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRowsHtml}
                        <!-- Row 20: TOTAL -->
                        <tr class="excel-total-row">
                            <td class="col-qty excel-border-cell"></td>
                            <td class="col-desc excel-total-label">TOTAL</td>
                            <td class="col-amount excel-total-val">${currency(data.subtotal)}</td>
                        </tr>
                        <!-- Row 21: GST -->
                        <tr class="excel-gst-row">
                            <td colspan="2" class="excel-gst-label">GST ${data.gst}%</td>
                            <td class="col-amount excel-gst-val">${currency(data.gstAmount)}</td>
                        </tr>
                        <!-- Row 22: Round Off (if any) -->
                        ${data.roundOff !== 0 ? `
                        <tr class="excel-round-row">
                            <td colspan="2" class="excel-round-label">Round off</td>
                            <td class="col-amount excel-round-val">${currency(data.roundOff)}</td>
                        </tr>` : ''}
                        <!-- Row 23: GRAND TOTAL -->
                        <tr class="excel-grand-row">
                            <td colspan="2" class="excel-grand-label">GRAND TOTAL</td>
                            <td class="col-amount excel-grand-val">${currency(data.grandTotal)}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Rows 25-33: Company & Bank Details (Dynamically from QUOTATION.xlsx) -->
                <div class="excel-company-section">
                    <div class="excel-comp-name">${escapeHtml(meta.companyName)}</div>
                    <div class="excel-comp-line">${escapeHtml(meta.office)}</div>
                    <div class="excel-comp-spacer"></div>
                    <div class="excel-comp-line">${escapeHtml(meta.gst)}</div>
                    <div class="excel-comp-line">${escapeHtml(meta.accountNo)}</div>
                    <div class="excel-comp-line">${escapeHtml(meta.ifsc)}</div>
                    <div class="excel-comp-line">${escapeHtml(meta.branch)}</div>
                    <div class="excel-comp-line">${escapeHtml(meta.bank)}</div>
                    <div class="excel-comp-line excel-upi-line">${escapeHtml(meta.upi)}</div>
                </div>

                <!-- Rows 34-37: QR Code on left, Signatory on right -->
                <div class="excel-bottom-meta">
                    <div class="excel-qr-box">
                        <img src="icons/quotation_qr.png" alt="UPI QR Code" class="excel-qr-img">
                    </div>
                    <div class="excel-signatory-box">
                        <div class="excel-for-comp">${escapeHtml(meta.forCompany.trim())}</div>
                        ${meta.signatory ? `<div class="excel-sign-space"></div><div class="excel-auth-sign">${escapeHtml(meta.signatory)}</div>` : ''}
                    </div>
                </div>

                <!-- Row 38: Footer Banner (Dynamically from QUOTATION.xlsx) -->
                <div class="excel-teal-banner excel-footer-banner">
                    ${escapeHtml(meta.footerBanner)}
                </div>
            </div>
        `;
    }

    /* =====================================================
       BUILD DEDICATED LIGHT-THEME CONTAINER FOR PDF EXPORT
       Guarantees 100% white theme regardless of active website theme
    ===================================================== */
    function buildLightQuotationElement(data) {
        let itemsRowsHtml = "";
        data.items.forEach(item => {
            itemsRowsHtml += `
                <tr class="excel-item-row">
                    <td class="col-qty">${item.quantity}</td>
                    <td class="col-desc">${escapeHtml(item.description)}</td>
                    <td class="col-amount">${currency(item.amount)}</td>
                </tr>
            `;
        });

        const meta = (data && data.templateMeta) || {
            companyName: "CORPORATEMART PRIVATE LIMITED",
            office: "Office: 403, Emerald Complex, Nr. Swastik Cross Road, Navrangpura, Ahmedabad - 380009",
            gst: "GST : 24AANCC2934R1Z3",
            accountNo: "Account No :50200119641366",
            ifsc: "IFSC CODE : HDFC0001678",
            branch: "Branch Name : Navrangpura Branch",
            bank: "Bank name : HDFC BANK LTD",
            upi: "UPI - corporatemartprivate.82229585@hdfcbank",
            forCompany: "For,    CORPORATEMART PRIVATE LIMITED",
            signatory: "",
            footerBanner: "This is a system-generated quotation and does not require a signature."
        };

        const exportWrap = document.createElement("div");
        exportWrap.className = "pdf-export-container";
        exportWrap.innerHTML = `
            <div class="quotation-sheet-preview excel-doc-sheet">
                <!-- Row 1: Header Title (32px, all caps) -->
                <div class="excel-header-title">
                    QUOTATION
                </div>

                <!-- Rows 2-3: Logo & Date (Clean Light Logo) -->
                <div class="excel-top-meta">
                    <div class="excel-top-logo">
                        <img src="icons/Your_paragraph_text__8_-removebg-preview.png" alt="CorporateMart" class="qs-logo">
                    </div>
                    <div class="excel-top-date">
                        <span class="excel-date-label">Date :</span>
                        <span class="excel-date-val">${formatDate(data.date)}</span>
                    </div>
                </div>

                <!-- Row 6: BILL TO Banner with Quotation Number on right -->
                <div class="excel-teal-banner excel-bill-banner">
                    <span class="excel-bill-to-text">BILL TO : ${escapeHtml(data.customerName.toUpperCase())}</span>
                    <span class="excel-quotation-no-text">QUOTATION NO : ${escapeHtml(data.quotationNumber)}</span>
                </div>

                <!-- Rows 7-11: Customer Info -->
                <div class="excel-customer-details">
                    <div class="excel-cust-line excel-cust-address">${escapeHtml(data.billingAddress || "")}</div>
                    <div class="excel-cust-line excel-cust-state"><strong>State &nbsp;: &nbsp;</strong>${escapeHtml(data.state || "Gujarat")}</div>
                    <div class="excel-cust-line excel-cust-gst"><strong>GST &nbsp;&nbsp;&nbsp;: &nbsp;</strong>${escapeHtml(data.customerGST || "")}</div>
                </div>

                <!-- Table Rows 12 to 23 -->
                <table class="excel-table">
                    <thead>
                        <tr class="excel-th-row">
                            <th class="col-qty">QUANTITY</th>
                            <th class="col-desc">DESCRIPTION</th>
                            <th class="col-amount">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRowsHtml}
                        <!-- Row 20: TOTAL -->
                        <tr class="excel-total-row">
                            <td class="col-qty excel-border-cell"></td>
                            <td class="col-desc excel-total-label">TOTAL</td>
                            <td class="col-amount excel-total-val">${currency(data.subtotal)}</td>
                        </tr>
                        <!-- Row 21: GST -->
                        <tr class="excel-gst-row">
                            <td colspan="2" class="excel-gst-label">GST ${data.gst}%</td>
                            <td class="col-amount excel-gst-val">${currency(data.gstAmount)}</td>
                        </tr>
                        <!-- Row 22: Round Off (if any) -->
                        ${data.roundOff !== 0 ? `
                        <tr class="excel-round-row">
                            <td colspan="2" class="excel-round-label">Round off</td>
                            <td class="col-amount excel-round-val">${currency(data.roundOff)}</td>
                        </tr>` : ''}
                        <!-- Row 23: GRAND TOTAL -->
                        <tr class="excel-grand-row">
                            <td colspan="2" class="excel-grand-label">GRAND TOTAL</td>
                            <td class="col-amount excel-grand-val">${currency(data.grandTotal)}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Rows 25-33: Company & Bank Details (Dynamically from QUOTATION.xlsx) -->
                <div class="excel-company-section">
                    <div class="excel-comp-name">${escapeHtml(meta.companyName)}</div>
                    <div class="excel-comp-line">${escapeHtml(meta.office)}</div>
                    <div class="excel-comp-spacer"></div>
                    <div class="excel-comp-line">${escapeHtml(meta.gst)}</div>
                    <div class="excel-comp-line">${escapeHtml(meta.accountNo)}</div>
                    <div class="excel-comp-line">${escapeHtml(meta.ifsc)}</div>
                    <div class="excel-comp-line">${escapeHtml(meta.branch)}</div>
                    <div class="excel-comp-line">${escapeHtml(meta.bank)}</div>
                    <div class="excel-comp-line excel-upi-line">${escapeHtml(meta.upi)}</div>
                </div>

                <!-- Rows 34-37: QR Code on left, Signatory on right -->
                <div class="excel-bottom-meta">
                    <div class="excel-qr-box">
                        <img src="icons/quotation_qr.png" alt="UPI QR Code" class="excel-qr-img">
                    </div>
                    <div class="excel-signatory-box">
                        <div class="excel-for-comp">${escapeHtml(meta.forCompany.trim())}</div>
                        ${meta.signatory ? `<div class="excel-sign-space"></div><div class="excel-auth-sign">${escapeHtml(meta.signatory)}</div>` : ''}
                    </div>
                </div>

                <!-- Row 38: Footer Banner (Dynamically from QUOTATION.xlsx) -->
                <div class="excel-teal-banner excel-footer-banner">
                    ${escapeHtml(meta.footerBanner)}
                </div>
            </div>
        `;
        return exportWrap;
    }

    /* =====================================================
       GENERATE QUOTATION SUBMISSION
    ===================================================== */
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const generateButton = document.getElementById("generateQuotationBtn");

        try {
            generateButton.disabled = true;
            generateButton.textContent = "Generating...";

            const data = collectData();

            if (!data.customerName) {
                throw new Error("Please enter company / customer name.");
            }

            if (!data.items || data.items.length === 0) {
                throw new Error("Please add at least one service item.");
            }

            const missingDesc = data.items.some(it => !it.description);
            if (missingDesc) {
                throw new Error("Please select a service for all items.");
            }

            /* Load ORIGINAL template */
            const workbook = await loadTemplate();

            /* Extract metadata dynamically from the loaded template */
            const templateMeta = extractTemplateMeta(workbook);
            data.templateMeta = templateMeta;

            /* Fill data & handle dynamic row expansion */
            fillTemplate(workbook, data);

            generatedWorkbook = workbook;
            quotationData = data;

            /* Close form modal */
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");

            /* Render realistic visual preview using template metadata */
            renderPreview(data, templateMeta);

            /* Open preview modal */
            if (previewModal) {
                previewModal.classList.add("is-open");
                previewModal.setAttribute("aria-hidden", "false");
                document.body.style.overflow = "hidden";
            }

        } catch (error) {
            console.error("Quotation generation failed:", error);
            alert("Unable to generate quotation.\n\n" + error.message);
        } finally {
            generateButton.disabled = false;
            generateButton.textContent = "Generate Quotation";
        }
    });

    /* =====================================================
       DOWNLOAD PDF QUOTATION (EXACT SPREADSHEET TWIN - 100% 1 PAGE - ALWAYS LIGHT THEME)
    ===================================================== */
    async function downloadPdfQuotation() {
        if (!quotationData) {
            alert("No quotation data available to download.");
            return;
        }

        const downloadButton = document.getElementById("downloadQuotation");
        const originalText = downloadButton ? downloadButton.textContent : "Download PDF Quotation";
        let exportContainer = null;

        try {
            if (downloadButton) {
                downloadButton.disabled = true;
                downloadButton.textContent = "Creating PDF...";
            }

            // 1. Build dedicated light-theme container to guarantee white background & light styling regardless of website dark mode
            exportContainer = buildLightQuotationElement(quotationData);
            document.body.appendChild(exportContainer);

            const previewEl = exportContainer.querySelector(".quotation-sheet-preview");
            if (!previewEl) {
                throw new Error("Could not construct quotation preview element for PDF.");
            }

            // 2. Ensure all images (logo, QR code) are fully loaded
            const imgElements = previewEl.querySelectorAll("img");
            await Promise.all(
                Array.from(imgElements).map(img => {
                    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
                    return new Promise(res => {
                        img.onload = res;
                        img.onerror = res;
                    });
                })
            );

            // Small delay to ensure layout reflows and fonts are crisp
            await new Promise(r => setTimeout(r, 80));

            // 3. Render high-resolution canvas with clean light background
            const canvas = await html2canvas(previewEl, {
                scale: 2.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#ffffff",
                logging: false
            });

            // 4. Generate high-quality lossless PNG (perfect contrast for QR code and crisp typography)
            const imgData = canvas.toDataURL("image/png");
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 8;
            const printWidth = pdfWidth - (margin * 2);
            const printHeight = (canvas.height * printWidth) / canvas.width;

            let finalHeight = printHeight;
            let finalWidth = printWidth;
            let finalX = margin;
            let finalY = margin;

            // Fit exactly onto 1 single page without distortion or clipping
            const maxHeight = pdfHeight - (margin * 2);
            if (finalHeight > maxHeight) {
                const ratio = maxHeight / finalHeight;
                finalHeight = maxHeight;
                finalWidth = finalWidth * ratio;
                finalX = (pdfWidth - finalWidth) / 2; // Center horizontally
            }

            pdf.addImage(imgData, "PNG", finalX, finalY, finalWidth, finalHeight, undefined, "FAST");

            const safeName = (quotationData.customerName || "Quotation").replace(/[^a-zA-Z0-9_-]/g, "_");
            const safeDate = (quotationData.date || "").replace(/[^0-9-]/g, "");
            const filename = `Quotation_${safeName}_${safeDate}.pdf`;
            pdf.save(filename);

        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("Failed to generate PDF. Please try downloading Excel instead.");
        } finally {
            if (exportContainer && exportContainer.parentNode) {
                exportContainer.parentNode.removeChild(exportContainer);
            }
            if (downloadButton) {
                downloadButton.disabled = false;
                downloadButton.textContent = originalText;
            }
        }
    }

    /* =====================================================
       DOWNLOAD EXCEL QUOTATION (.XLSX)
    ===================================================== */
    async function downloadExcelQuotation() {
        if (!generatedWorkbook || !quotationData) {
            alert("Please generate a quotation first.");
            return;
        }

        try {
            const buffer = await generatedWorkbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            });

            const safeName = (quotationData.customerName || "Quotation").replace(/[^a-zA-Z0-9_-]/g, "_");
            const safeDate = (quotationData.date || "").replace(/[^0-9-]/g, "");
            const filename = `Quotation_${safeName}_${safeDate}.xlsx`;

            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Excel download failed:", error);
            alert("Error downloading quotation Excel file:\n" + error.message);
        }
    }

    const downloadBtn = document.getElementById("downloadQuotation");
    if (downloadBtn) {
        downloadBtn.addEventListener("click", downloadPdfQuotation);
    }

    const downloadExcelBtn = document.getElementById("downloadExcelQuotation");
    if (downloadExcelBtn) {
        downloadExcelBtn.addEventListener("click", downloadExcelQuotation);
    }

    const backBtn = document.getElementById("backToQuotationForm");
    if (backBtn && previewModal && modal) {
        backBtn.addEventListener("click", function () {
            previewModal.classList.remove("is-open");
            previewModal.setAttribute("aria-hidden", "true");
            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
        });
    }

    document.querySelectorAll("[data-close-preview]").forEach(btn => {
        btn.addEventListener("click", function () {
            if (previewModal) {
                previewModal.classList.remove("is-open");
                previewModal.setAttribute("aria-hidden", "true");
                document.body.style.overflow = "";
            }
        });
    });
})();

/* =========================================================
   WHY CORPORATE MART — scroll-linked horizontal slide
   Matches "Our Journey" section from about_us.html
========================================================= */
(function () {
    "use strict";

    const wrap = document.getElementById("whyPinWrap");
    const track = document.getElementById("whyTrack");
    const progressBar = document.getElementById("whyProgressBar");
    const counter = document.getElementById("whyCounter");

    if (!wrap || !track) return;

    const cards = Array.from(track.querySelectorAll(".why-card"));
    const totalCards = cards.length;
    if (totalCards === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ticking = false;

    // Dynamically set wrap height based on horizontal track width
    function adjustWrapHeight() {
        if (reduced || window.innerWidth <= 900) {
            wrap.style.height = "auto";
            return;
        }
        const sticky = wrap.querySelector(".why-sticky");
        if (!sticky) return;

        const scrollableWidth = Math.max(0, track.scrollWidth - sticky.clientWidth);
        const scrollMultiplier = 2.6;
        // Total height needed = viewport sticky height + scroll distance
        wrap.style.height = (sticky.offsetHeight + Math.max(scrollableWidth * scrollMultiplier, 1300)) + "px";
    }

    function updatePosition() {
        ticking = false;

        if (reduced || window.innerWidth <= 900) {
            track.style.transform = "";
            return;
        }

        const sticky = wrap.querySelector(".why-sticky");
        if (!sticky) return;

        const wrapRect = wrap.getBoundingClientRect();
        const scrollableDistance = wrap.offsetHeight - sticky.offsetHeight;

        let progress = 0;
        if (scrollableDistance > 0) {
            progress = -wrapRect.top / scrollableDistance;
            progress = Math.max(0, Math.min(1, progress));
        }

        const maxTranslate = Math.max(
            0,
            track.scrollWidth - sticky.clientWidth + 600
        );

        const translateX = progress * maxTranslate;
        track.style.transform = "translateX(-" + translateX + "px)";

        if (progressBar) {
            progressBar.style.width = (progress * 100) + "%";
        }

        // Calculate active card index based on current scroll progress
        const activeIndex = Math.min(
            Math.floor(progress * totalCards),
            totalCards - 1
        );
        const activeCard = cards[activeIndex] || cards[0];

        cards.forEach((card, idx) => {
            const isActive = (card === activeCard);
            const isNear = Math.abs(idx - activeIndex) === 1;
            card.classList.toggle("is-active", isActive);
            card.classList.toggle("is-near", isNear);
        });

        if (counter && activeCard) {
            counter.textContent =
                String(activeIndex + 1).padStart(2, "0") + " / " +
                String(totalCards).padStart(2, "0");
        }
    }

    function onScrollOrResize(e) {
        if (e && e.type === "resize") {
            adjustWrapHeight();
        }

        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(updatePosition);
        }
    }

    // Allow clicking card to smoothly scroll into focus on desktop
    cards.forEach((card, idx) => {
        card.addEventListener("click", function () {
            if (window.innerWidth <= 900) return;
            const sticky = wrap.querySelector(".why-sticky");
            if (!sticky) return;
            const scrollableDistance = wrap.offsetHeight - sticky.offsetHeight;
            if (scrollableDistance <= 0) return;
            const targetProgress = idx / (totalCards - 1);
            const targetY = window.pageYOffset + wrap.getBoundingClientRect().top + targetProgress * scrollableDistance;
            window.scrollTo({ top: targetY, behavior: "smooth" });
        });
    });

    // Initialize sizing and Listeners
    adjustWrapHeight();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    updatePosition();
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
