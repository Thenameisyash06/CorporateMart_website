/* About Us page functionality */

(function () {
    "use strict";

    /* =========================================================
       JOURNEY SECTION — scroll-linked horizontal slide
    ========================================================= */

    const wrap = document.getElementById("journeyPinWrap");
    const track = document.getElementById("journeyTrack");
    const progressBar = document.getElementById("journeyProgressBar");
    const counter = document.getElementById("journeyCounter");

    if (wrap && track) {

        const cards = Array.from(track.querySelectorAll(".about-journey-item"));
        const totalCards = cards.length;

        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        let ticking = false;

        // Dynamically set wrap height based on horizontal track width
        function adjustWrapHeight() {
            if (reduced) return;
            const sticky = wrap.querySelector(".about-journey-sticky");
            if (!sticky) return;

            const scrollableWidth = track.scrollWidth - sticky.clientWidth;
            const scrollMultiplier = 3;
            // Total height needed = viewport sticky height + scroll distance
            wrap.style.height = (sticky.offsetHeight + scrollableWidth * scrollMultiplier) + "px";
        }

        function updatePosition() {
            ticking = false;

            if (reduced) {
                track.style.transform = "";
                return;
            }

            const sticky = wrap.querySelector(".about-journey-sticky");
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

            cards.forEach(card => {
                card.classList.toggle("is-active", card === activeCard);
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

        // Initialize sizing and Listeners
        adjustWrapHeight();
        window.addEventListener("scroll", onScrollOrResize, { passive: true });
        window.addEventListener("resize", onScrollOrResize);

        updatePosition();
    }

})();