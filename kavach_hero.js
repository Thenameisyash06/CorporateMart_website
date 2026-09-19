/**
 * Corporate Kavach — 60 FPS Interactive HTML5 Canvas Animation for Hero Section
 * Supports seamless Light and Dark theme switching, full 60 FPS orbital motion,
 * uncropped centered shield, and 100% upright capsules.
 */
(function () {
  'use strict';

  const CX = 600;
  const CY = 600;
  const R = 450; // Orbit radius
  const DURATION_SEC = 16.0; // 16 seconds per 360° rotation (slowed down by 2s)
  const TRIGGER_TOLERANCE = 4.2; // degrees for checkmark glow

  const POD_CONFIGS = [
    { name: 'Company Registration', file: 'company_registration.png' },
    { name: 'Compliance', file: 'compliance.png' },
    { name: 'Certification', file: 'certification.png' },
    { name: 'Funding', file: 'funding.png' },
    { name: 'Digital', file: 'digital.png' },
    { name: 'Business Growth', file: 'business_growth.png' },
    { name: 'Startup Support', file: 'startup_support.png' }
  ];

  const numPods = POD_CONFIGS.length;
  const stepDeg = 360.0 / numPods;

  function loadThemeAssets(folder) {
    const assets = {
      baseBlue: new Image(),
      baseGreen: new Image(),
      orbitRail: new Image(),
      pods: [],
      ready: false
    };

    let total = 3 + numPods;
    let count = 0;

    function checkReady() {
      count++;
      if (count >= total) {
        assets.ready = true;
      }
    }

    assets.baseBlue.onload = checkReady;
    assets.baseGreen.onload = checkReady;
    assets.orbitRail.onload = checkReady;

    assets.baseBlue.src = 'icons/' + folder + '/center_base_blue.png?v=centered_1';
    assets.baseGreen.src = 'icons/' + folder + '/center_base_green.png?v=centered_1';
    assets.orbitRail.src = 'icons/' + folder + '/orbit_rail.png?v=centered_1';

    POD_CONFIGS.forEach((cfg) => {
      const img = new Image();
      img.onload = () => {
        assets.pods.push({
          name: cfg.name,
          img: img,
          w: img.width,
          h: img.height
        });
        checkReady();
      };
      img.src = 'icons/' + folder + '/pods/' + cfg.file + '?v=centered_1';
    });

    return assets;
  }

  function init() {
    const canvasLight = document.getElementById('kavachCanvasLight');
    const canvasDark = document.getElementById('kavachCanvasDark');

    if (!canvasLight && !canvasDark) return;

    const ctxLight = canvasLight ? canvasLight.getContext('2d') : null;
    const ctxDark = canvasDark ? canvasDark.getContext('2d') : null;

    const lightAssets = loadThemeAssets('kavach_light');
    const darkAssets = loadThemeAssets('kavach');

    let rotationDeg = 0;
    let lastTimestamp = 0;
    let isVisible = true;

    // Pause rendering when hero section is not in viewport to optimize battery
    const heroMonitor = document.querySelector('.bizhero-monitor');
    if (heroMonitor && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.05 });
      observer.observe(heroMonitor);
    }

    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
    });

    function drawToCanvas(ctx, canvas, assets, angleDeg) {
      if (!ctx || !assets || !assets.ready) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply optical scale and vertical centering so top capsules are never cropped
      ctx.translate(600, 630);
      ctx.scale(0.88, 0.88);
      ctx.translate(-600, -600);

      // 1. Draw 3D metallic orbit rail
      ctx.drawImage(assets.orbitRail, 0, 0);

      // 2. Checkmark trigger at 12 o\'clock
      const rem = angleDeg % stepDeg;
      const distToTop = Math.min(rem, stepDeg - rem);
      const isGreen = distToTop <= TRIGGER_TOLERANCE;

      // 3. Draw Centered Shield + Pedestal Base
      if (isGreen) {
        ctx.drawImage(assets.baseGreen, 0, 0);
      } else {
        ctx.drawImage(assets.baseBlue, 0, 0);
      }

      // 4. Draw all 7 upright service capsules revolving on orbit
      for (let i = 0; i < assets.pods.length; i++) {
        const pod = assets.pods[i];
        if (!pod) continue;

        const podDeg = (angleDeg + i * stepDeg) % 360.0;
        const rad = (podDeg * Math.PI) / 180.0;

        const px = CX + R * Math.sin(rad);
        const py = CY - R * Math.cos(rad);

        const pasteX = px - pod.w / 2.0;
        const pasteY = py - (pod.h - 42.0);

        ctx.drawImage(pod.img, pasteX, pasteY);
      }

      ctx.restore();
    }

    function renderLoop(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaSec = (timestamp - lastTimestamp) / 1000.0;
      lastTimestamp = timestamp;

      // Advance rotation
      const degPerSec = 360.0 / DURATION_SEC;
      rotationDeg = (rotationDeg + degPerSec * deltaSec) % 360.0;

      if (isVisible) {
        const isDark = document.body.classList.contains('dark-mode');

        if (isDark && ctxDark && darkAssets.ready) {
          drawToCanvas(ctxDark, canvasDark, darkAssets, rotationDeg);
        } else if (!isDark && ctxLight && lightAssets.ready) {
          drawToCanvas(ctxLight, canvasLight, lightAssets, rotationDeg);
        }
      }

      requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
