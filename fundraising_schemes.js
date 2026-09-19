/* =========================================================
   FUNDING SCHEMES & GRANTS PORTAL INTERACTIVITY ENGINE
   - Multi-facet sidebar filters matching Excel columns
   - Keyword search & hero category pills
   - Sorting, active filter tags, responsive drawer
   - Interactive Scheme Detail Modal & Lead Modal trigger
========================================================= */

(function () {
  'use strict';

  // Global State
  const state = {
    search: '',
    quickType: 'all',
    filters: {
      stage: new Set(),
      fundingType: new Set(),
      amountRange: new Set(),
      industry: new Set(),
      state: new Set(),
      founderType: new Set(),
      entityType: new Set(),
      registrations: new Set()
    },
    sortBy: 'default',
    schemes: [],
    user: null,
    token: localStorage.getItem('cm_auth_token') || null,
    isSubscriber: false,
    pendingPlanId: null
  };

  // DOM Elements
  let elements = {};

  function initElements() {
    elements = {
      grid: document.getElementById('schemesGrid'),
      resultsCount: document.getElementById('resultsCountNumber'),
      searchInput: document.getElementById('schemeSearchInput'),
      sortSelect: document.getElementById('sortSelect'),
      activeChips: document.getElementById('activeChipsContainer'),
      sidebar: document.getElementById('schemesSidebar'),
      sidebarBackdrop: document.getElementById('sidebarBackdrop'),
      mobileFilterBtn: document.getElementById('mobileFilterTrigger'),
      resetFiltersBtn: document.getElementById('resetFiltersBtn'),
      quickPills: document.querySelectorAll('.quick-pill'),
      modalBackdrop: document.getElementById('schemeModalBackdrop'),
      modalCloseBtn: document.getElementById('modalCloseBtn'),
      modalContent: document.getElementById('modalSchemeContent'),
      modalApplyBtn: document.getElementById('modalApplyBtn'),
      modalSowBtn: document.getElementById('modalSowBtn'),

      // Auth & Pro Elements
      userBar: document.getElementById('schemesUserBar'),
      userStatusIcon: document.getElementById('userStatusIcon'),
      userBarTitle: document.getElementById('userBarTitle'),
      userBarSubtitle: document.getElementById('userBarSubtitle'),
      userBarActions: document.getElementById('userBarActions'),
      openPricingBtn: document.getElementById('openPricingBtn'),
      openAuthBtn: document.getElementById('openAuthBtn'),

      authModal: document.getElementById('authModal'),
      authModalCloseBtn: document.getElementById('authModalCloseBtn'),
      tabSignIn: document.getElementById('tabSignIn'),
      tabRegister: document.getElementById('tabRegister'),
      signInForm: document.getElementById('signInForm'),
      registerForm: document.getElementById('registerForm'),
      authErrorMsg: document.getElementById('authErrorMsg'),

      pricingModal: document.getElementById('pricingModal'),
      pricingModalCloseBtn: document.getElementById('pricingModalCloseBtn')
    };
  }

  // Helper: Amount range classifier
  function getAmountRange(val) {
    if (val === 0) return 'variable';
    if (val <= 2500000) return 'under-25l';
    if (val <= 10000000) return '25l-1cr';
    if (val <= 50000000) return '1cr-5cr';
    return 'above-5cr';
  }

  const AMOUNT_RANGES = [
    { id: 'under-25l', label: 'Up to ₹25 Lakh' },
    { id: '25l-1cr', label: '₹25 Lakh to ₹1 Crore' },
    { id: '1cr-5cr', label: '₹1 Crore to ₹5 Crore' },
    { id: 'above-5cr', label: 'Above ₹5 Crore' },
    { id: 'variable', label: 'Custom / Discretionary' }
  ];

  // Helper to parse deadline string into timestamp or null (for rolling/ongoing)
  function parseDeadline(deadlineStr) {
    if (!deadlineStr) return null;
    const str = String(deadlineStr).trim();
    if (/rolling|ongoing|open|always|tbd/i.test(str)) return null;
    const ts = Date.parse(str);
    return isNaN(ts) ? null : ts;
  }

  // Helper to test if a deadline has expired
  function isDeadlineExpired(deadlineStr) {
    if (!deadlineStr) return false;
    const str = String(deadlineStr).trim();
    if (/closed|expired/i.test(str)) return true;
    const ts = parseDeadline(str);
    if (ts === null) return false;
    const d = new Date(ts);
    d.setHours(23, 59, 59, 999);
    return d.getTime() < Date.now();
  }

  // Calculate deadline visual tag & remaining days status
  // Green: Rolling / Ongoing
  // Orange: More than 5 days remaining
  // Red: 5 or less days remaining
  // Closed: Deadline expired / passed
  function getDeadlineStatus(deadlineStr) {
    if (!deadlineStr) {
      return { tagClass: 'deadline-tag-green', label: 'Rolling / Ongoing', isClosed: false };
    }
    const str = String(deadlineStr).trim();
    if (/closed|expired/i.test(str)) {
      return { tagClass: 'deadline-tag-closed', label: 'Closed', isClosed: true };
    }
    if (/rolling|ongoing|open|always|tbd/i.test(str)) {
      return { tagClass: 'deadline-tag-green', label: 'Rolling / Ongoing', isClosed: false };
    }
    const ts = Date.parse(str);
    if (isNaN(ts)) {
      return { tagClass: 'deadline-tag-green', label: str, isClosed: false };
    }
    const endOfDay = new Date(ts);
    endOfDay.setHours(23, 59, 59, 999);
    const diffMs = endOfDay.getTime() - Date.now();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0 || daysLeft <= 0) {
      return {
        tagClass: 'deadline-tag-closed',
        label: 'Closed',
        isClosed: true
      };
    } else if (daysLeft <= 5) {
      return {
        tagClass: 'deadline-tag-red',
        label: `${str} (${daysLeft}d left)`,
        isClosed: false
      };
    } else {
      return {
        tagClass: 'deadline-tag-orange',
        label: `${str} (${daysLeft}d left)`,
        isClosed: false
      };
    }
  }

  // Check if a scheme is currently active (schemes are NOT removed when expired)
  function isSchemeActive(s) {
    if (s.active === false || s.status === 'inactive') return false;
    return true;
  }

  // Get all schemes (including closed schemes)
  function getActiveSchemes() {
    const list = (state.schemes && state.schemes.length) ? state.schemes : (window.SCHEMES_DATA || []);
    return list.filter(isSchemeActive);
  }

  // Update dynamic scheme count badges across the page
  function updateActiveCountsBadge() {
    const activeCount = getActiveSchemes().length;
    const sideSubtitle = document.getElementById('sideNavSubtitleCount');
    if (sideSubtitle) sideSubtitle.textContent = `${activeCount} Schemes Available`;
    const statBox = document.getElementById('statSchemesCount');
    if (statBox) statBox.textContent = `${activeCount}+`;
  }

  // Build Dynamic Sidebar Filters
  function buildSidebarFilters() {
    if (!elements.sidebar) return;

    updateActiveCountsBadge();

    // Collect distinct values from active schemes
    const distinct = {
      stage: new Map(),
      fundingType: new Map(),
      amountRange: new Map(),
      industry: new Map(),
      state: new Map(),
      founderType: new Map(),
      entityType: new Map(),
      registrations: new Map()
    };

    getActiveSchemes().forEach(s => {
      // Stage
      if (s.stage) distinct.stage.set(s.stage, (distinct.stage.get(s.stage) || 0) + 1);
      // Funding Type
      if (s.fundingType) distinct.fundingType.set(s.fundingType, (distinct.fundingType.get(s.fundingType) || 0) + 1);
      // Amount Range
      const ar = getAmountRange(s.amountValue);
      distinct.amountRange.set(ar, (distinct.amountRange.get(ar) || 0) + 1);
      // Industry
      if (s.industry) {
        const inds = s.industry.split('\n');
        inds.forEach(ind => {
          const clean = ind.trim();
          if (clean) distinct.industry.set(clean, (distinct.industry.get(clean) || 0) + 1);
        });
      }
      // State
      if (s.state) distinct.state.set(s.state, (distinct.state.get(s.state) || 0) + 1);
      // Founder Type
      if (s.founderType) distinct.founderType.set(s.founderType, (distinct.founderType.get(s.founderType) || 0) + 1);
      // Entity Type
      if (s.entityType) distinct.entityType.set(s.entityType, (distinct.entityType.get(s.entityType) || 0) + 1);
      // Registrations
      if (s.registrations) distinct.registrations.set(s.registrations, (distinct.registrations.get(s.registrations) || 0) + 1);
    });

    const filterConfigs = [
      { key: 'fundingType', title: 'Funding Type', items: Array.from(distinct.fundingType.entries()) },
      { key: 'stage', title: 'Startup Stage', items: Array.from(distinct.stage.entries()) },
      { key: 'amountRange', title: 'Funding Amount', items: AMOUNT_RANGES.map(r => [r.id, distinct.amountRange.get(r.id) || 0, r.label]) },
      { key: 'industry', title: 'Industry / Sector', items: Array.from(distinct.industry.entries()) },
      { key: 'founderType', title: 'Founder Eligibility', items: Array.from(distinct.founderType.entries()) },
      { key: 'entityType', title: 'Entity Type', items: Array.from(distinct.entityType.entries()) },
      { key: 'state', title: 'State / Geography', items: Array.from(distinct.state.entries()) },
      { key: 'registrations', title: 'Mandatory Registrations', items: Array.from(distinct.registrations.entries()) }
    ];

    const container = document.getElementById('sidebarFiltersList');
    if (!container) return;
    container.innerHTML = '';

    filterConfigs.forEach(cfg => {
      if (!cfg.items || cfg.items.length === 0) return;

      const groupEl = document.createElement('div');
      groupEl.className = 'filter-group';
      groupEl.innerHTML = `
        <div class="filter-group-title" data-group="${cfg.key}">
          <span>${cfg.title}</span>
          <span class="chevron-icon">▾</span>
        </div>
        <div class="filter-options-list" id="filter-opts-${cfg.key}"></div>
      `;

      const optsList = groupEl.querySelector(`#filter-opts-${cfg.key}`);
      cfg.items.forEach(([val, count, customLabel]) => {
        if (!count) return;
        const labelText = customLabel || val;
        const itemEl = document.createElement('label');
        itemEl.className = 'filter-checkbox-label';
        itemEl.innerHTML = `
          <span class="check-wrapper">
            <input type="checkbox" class="filter-checkbox" data-category="${cfg.key}" value="${val}">
            <span>${labelText}</span>
          </span>
          <span class="filter-count">${count}</span>
        `;
        optsList.appendChild(itemEl);
      });

      const titleEl = groupEl.querySelector('.filter-group-title');
      titleEl.addEventListener('click', () => {
        groupEl.classList.toggle('is-collapsed');
      });

      container.appendChild(groupEl);
    });

    container.querySelectorAll('.filter-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const cat = cb.getAttribute('data-category');
        const val = cb.value;
        if (cb.checked) {
          state.filters[cat].add(val);
        } else {
          state.filters[cat].delete(val);
        }
        applyFilters();
      });
    });
  }

  // Helper to parse deadline string into timestamp
  function parseDeadline(deadlineStr) {
    if (!deadlineStr) return null;
    const str = String(deadlineStr).trim();
    if (/rolling|ongoing|open/i.test(str)) {
      return null;
    }
    const timestamp = Date.parse(str);
    return isNaN(timestamp) ? null : timestamp;
  }

  // Filter & Search Logic
  function filterSchemes() {
    let list = getActiveSchemes().slice();

    // 1. Keyword search
    if (state.search.trim()) {
      const q = state.search.toLowerCase().trim();
      list = list.filter(s => {
        return (
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.industry.toLowerCase().includes(q) ||
          s.fundingType.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.entityType.toLowerCase().includes(q) ||
          s.founderType.toLowerCase().includes(q)
        );
      });
    }

    // 2. Quick Pill Filter
    if (state.quickType && state.quickType !== 'all') {
      if (state.quickType === 'grant') {
        list = list.filter(s => s.fundingType.toLowerCase().includes('grant'));
      } else if (state.quickType === 'debt') {
        list = list.filter(s => s.fundingType.toLowerCase().includes('debt'));
      } else if (state.quickType === 'loan') {
        list = list.filter(s => s.fundingType.toLowerCase().includes('loan'));
      } else if (state.quickType === 'equity') {
        list = list.filter(s => s.fundingType.toLowerCase().includes('equity'));
      } else if (state.quickType === 'dpiit') {
        list = list.filter(s => s.registrations.toLowerCase().includes('dpiit'));
      }
    }

    // 3. Multi-facet filters
    if (state.filters.stage.size > 0) {
      list = list.filter(s => state.filters.stage.has(s.stage));
    }
    if (state.filters.fundingType.size > 0) {
      list = list.filter(s => state.filters.fundingType.has(s.fundingType));
    }
    if (state.filters.amountRange.size > 0) {
      list = list.filter(s => state.filters.amountRange.has(getAmountRange(s.amountValue)));
    }
    if (state.filters.industry.size > 0) {
      list = list.filter(s => {
        for (let ind of state.filters.industry) {
          if (s.industry.toLowerCase().includes(ind.toLowerCase())) return true;
        }
        return false;
      });
    }
    if (state.filters.state.size > 0) {
      list = list.filter(s => state.filters.state.has(s.state));
    }
    if (state.filters.founderType.size > 0) {
      list = list.filter(s => state.filters.founderType.has(s.founderType));
    }
    if (state.filters.entityType.size > 0) {
      list = list.filter(s => state.filters.entityType.has(s.entityType));
    }
    if (state.filters.registrations.size > 0) {
      list = list.filter(s => state.filters.registrations.has(s.registrations));
    }

    // 4. Sorting
    if (state.sortBy === 'deadline-asc') {
      list.sort((a, b) => {
        const expA = isDeadlineExpired(a.deadline);
        const expB = isDeadlineExpired(b.deadline);
        if (!expA && expB) return -1;
        if (expA && !expB) return 1;
        const da = parseDeadline(a.deadline);
        const db = parseDeadline(b.deadline);
        if (da !== null && db !== null) return da - db;
        if (da !== null && db === null) return -1;
        if (da === null && db !== null) return 1;
        return a.name.localeCompare(b.name);
      });
    } else if (state.sortBy === 'deadline-desc') {
      list.sort((a, b) => {
        const expA = isDeadlineExpired(a.deadline);
        const expB = isDeadlineExpired(b.deadline);
        if (!expA && expB) return -1;
        if (expA && !expB) return 1;
        const da = parseDeadline(a.deadline);
        const db = parseDeadline(b.deadline);
        if (da !== null && db !== null) return db - da;
        if (da === null && db !== null) return -1;
        if (da !== null && db === null) return 1;
        return a.name.localeCompare(b.name);
      });
    } else if (state.sortBy === 'amount-desc') {
      list.sort((a, b) => b.amountValue - a.amountValue);
    } else if (state.sortBy === 'amount-asc') {
      list.sort((a, b) => (a.amountValue || 999999999) - (b.amountValue || 999999999));
    } else if (state.sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }

  // Render Scheme Cards
  function renderCards(schemes) {
    if (!elements.grid) return;

    if (elements.resultsCount) {
      elements.resultsCount.textContent = schemes.length;
    }

    if (schemes.length === 0) {
      elements.grid.innerHTML = `
        <div class="schemes-empty-state">
          <div class="empty-icon">🔍</div>
          <h4>No Funding Schemes Match Your Criteria</h4>
          <p>Try clearing some filters or searching for broader terms like "grant", "tech", or "all sectors".</p>
          <button type="button" class="btn-reset-empty" id="emptyResetBtn">Reset All Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('emptyResetBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', resetAllFilters);
      }
      return;
    }

    const html = schemes.map(s => {
      const ft = s.fundingType ? s.fundingType.toLowerCase() : '';
      let typeClass = 'type-grant';
      if (ft.includes('loan')) typeClass = 'type-loan';
      else if (ft.includes('debt')) typeClass = 'type-debt';
      else if (ft.includes('equity')) typeClass = 'type-equity';

      const isDpiit = s.registrations && s.registrations.toLowerCase().includes('dpiit');
      const dl = getDeadlineStatus(s.deadline);
      const industryDisplay = (s.industry || '').replace(/\n/g, ', ');
      const isLocked = !!s.isLocked;

      return `
        <article class="scheme-card ${dl.isClosed ? 'is-scheme-closed' : ''} ${isLocked ? 'is-scheme-locked' : ''}" data-id="${s.id}">
          <div>
            <div class="card-badges">
              <span class="type-badge ${typeClass}">
                ● ${s.fundingType}
              </span>
              <span class="stage-badge">${s.stage} Stage</span>
              ${isDpiit ? '<span class="dpiit-badge">★ DPIIT Required</span>' : ''}
              ${isLocked ? '<span class="pro-badge">★ PRO ONLY</span>' : ''}
            </div>

            <h3>${s.name}</h3>

            <div class="card-amount-banner">
              <div class="banner-amount ${isLocked ? 'pro-blur-trigger' : ''}" ${isLocked ? 'title="Click to unlock with Pro"' : ''}>
                <span class="amount-lbl">Funding Amount</span>
                <span class="amount-val ${isLocked ? 'blur-text' : ''}">${s.amount}</span>
              </div>
              <div class="banner-deadline ${dl.tagClass} ${isLocked ? 'pro-blur-trigger' : ''}" ${isLocked ? 'title="Click to unlock with Pro"' : ''}>
                <span class="deadline-lbl">Deadline</span>
                <span class="deadline-val ${isLocked ? 'blur-text' : ''}">${dl.label}</span>
              </div>
            </div>

            <p class="card-desc">${s.description}</p>

            <div class="card-criteria-grid ${isLocked ? 'pro-blur-trigger' : ''}" ${isLocked ? 'title="Click to unlock with Pro"' : ''}>
              <div class="criteria-item">
                <span class="cr-key">Industry</span>
                <span class="cr-val ${isLocked ? 'blur-text' : ''}" title="${isLocked ? 'Click to unlock with Pro' : industryDisplay}">${industryDisplay}</span>
              </div>
              <div class="criteria-item">
                <span class="cr-key">Geography</span>
                <span class="cr-val ${isLocked ? 'blur-text' : ''}" title="${isLocked ? 'Click to unlock with Pro' : s.state}">${s.state}</span>
              </div>
              <div class="criteria-item">
                <span class="cr-key">Founder</span>
                <span class="cr-val ${isLocked ? 'blur-text' : ''}" title="${isLocked ? 'Click to unlock with Pro' : s.founderType}">${s.founderType}</span>
              </div>
              <div class="criteria-item">
                <span class="cr-key">Entity</span>
                <span class="cr-val ${isLocked ? 'blur-text' : ''}" title="${isLocked ? 'Click to unlock with Pro' : s.entityType}">${s.entityType}</span>
              </div>
            </div>
          </div>

          <div class="card-actions">
            ${isLocked ? `
              <button type="button" class="btn-scheme-details btn-details-full is-locked-details" data-locked-details="${s.id}" title="Click to unlock details with Pro">
                🔒 Details
              </button>
            ` : (!dl.isClosed ? `
              <button type="button" class="btn-scheme-apply" data-apply="${s.name}" data-amount="${s.amount}">
                Apply with Expert →
              </button>
              <button type="button" class="btn-scheme-details" data-details="${s.id}">
                Details
              </button>
            ` : `
              <button type="button" class="btn-scheme-details btn-details-full" data-details="${s.id}">
                Details
              </button>
            `)}
          </div>
        </article>
      `;
    }).join('');

    elements.grid.innerHTML = html;

    // Attach card event listeners
    elements.grid.querySelectorAll('[data-apply]').forEach(btn => {
      btn.addEventListener('click', () => {
        const schemeName = btn.getAttribute('data-apply');
        const amount = btn.getAttribute('data-amount');
        openApplicationModal(schemeName, amount);
      });
    });

    // Locked details button -> opens pricing modal
    elements.grid.querySelectorAll('[data-locked-details]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openPricingModal();
      });
    });

    // Unlocked details button -> opens scheme details modal
    elements.grid.querySelectorAll('[data-details]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-details');
        const scheme = getActiveSchemes().find(item => item.id === id);
        if (scheme) {
          if (scheme.isLocked) {
            openPricingModal();
          } else {
            openDetailsModal(scheme);
          }
        }
      });
    });

    // Click on any blurred element (.pro-blur-trigger) to open Upgrade to Pro modal
    elements.grid.querySelectorAll('.pro-blur-trigger').forEach(trigger => {
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        openPricingModal();
      });
    });
  }

  // Render Active Chips
  function renderActiveChips() {
    if (!elements.activeChips) return;

    const chips = [];

    if (state.search.trim()) {
      chips.push({ type: 'search', key: 'search', val: state.search, label: `Search: "${state.search}"` });
    }

    if (state.quickType && state.quickType !== 'all') {
      const pill = Array.from(elements.quickPills).find(p => p.getAttribute('data-quick') === state.quickType);
      const label = pill ? pill.textContent.trim() : state.quickType;
      chips.push({ type: 'quick', key: 'quick', val: state.quickType, label: `Type: ${label}` });
    }

    Object.keys(state.filters).forEach(cat => {
      state.filters[cat].forEach(val => {
        let displayVal = val;
        if (cat === 'amountRange') {
          const found = AMOUNT_RANGES.find(r => r.id === val);
          if (found) displayVal = found.label;
        }
        chips.push({ type: 'filter', cat, val, label: displayVal });
      });
    });

    if (chips.length === 0) {
      elements.activeChips.innerHTML = '';
      elements.activeChips.style.display = 'none';
      return;
    }

    elements.activeChips.style.display = 'flex';
    elements.activeChips.innerHTML = chips.map((c, idx) => `
      <span class="active-chip">
        ${c.label}
        <button type="button" data-chip-idx="${idx}" aria-label="Remove filter">&times;</button>
      </span>
    `).join('') + '<button type="button" class="clear-all-chips" id="clearAllChipsBtn">Clear All</button>';

    elements.activeChips.querySelectorAll('button[data-chip-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-chip-idx'), 10);
        const target = chips[idx];
        if (!target) return;

        if (target.type === 'search') {
          state.search = '';
          if (elements.searchInput) elements.searchInput.value = '';
        } else if (target.type === 'quick') {
          state.quickType = 'all';
          updateQuickPillsUI();
        } else if (target.type === 'filter') {
          state.filters[target.cat].delete(target.val);
          const cb = document.querySelector(`.filter-checkbox[data-category="${target.cat}"][value="${target.val}"]`);
          if (cb) cb.checked = false;
        }
        applyFilters();
      });
    });

    const clearAll = document.getElementById('clearAllChipsBtn');
    if (clearAll) {
      clearAll.addEventListener('click', resetAllFilters);
    }
  }

  function applyFilters() {
    renderActiveChips();
    const filtered = filterSchemes();
    renderCards(filtered);
  }

  function resetAllFilters() {
    state.search = '';
    state.quickType = 'all';
    state.sortBy = 'default';

    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.sortSelect) elements.sortSelect.value = 'default';

    Object.keys(state.filters).forEach(k => state.filters[k].clear());

    document.querySelectorAll('.filter-checkbox').forEach(cb => {
      cb.checked = false;
    });

    updateQuickPillsUI();
    applyFilters();
  }

  function updateQuickPillsUI() {
    elements.quickPills.forEach(p => {
      const q = p.getAttribute('data-quick');
      p.classList.toggle('is-active', q === state.quickType);
    });
  }

  // Scheme Details Modal
  function openDetailsModal(s) {
    if (!s) return;
    if (s.isLocked) {
      openPricingModal();
      return;
    }
    if (!elements.modalBackdrop || !elements.modalContent) return;

    const ft = s.fundingType ? s.fundingType.toLowerCase() : '';
    let typeClass = 'type-grant';
    if (ft.includes('loan')) typeClass = 'type-loan';
    else if (ft.includes('debt')) typeClass = 'type-debt';
    else if (ft.includes('equity')) typeClass = 'type-equity';
    const dl = getDeadlineStatus(s.deadline);
    const isLocked = !!s.isLocked;

    elements.modalContent.innerHTML = `
      <div class="card-badges" style="margin-bottom: 12px;">
        <span class="type-badge ${typeClass}">● ${s.fundingType}</span>
        <span class="stage-badge">${s.stage} Stage</span>
        ${s.registrations && s.registrations.toLowerCase().includes('dpiit') ? '<span class="dpiit-badge">★ DPIIT Required</span>' : ''}
        ${isLocked ? '<span class="pro-badge">★ PRO ONLY</span>' : ''}
      </div>

      <h2 style="font-size: 24px; font-weight: 800; color: var(--fg-text); margin: 0 0 16px;">${s.name}</h2>
      
      ${isLocked ? `
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
          <div>
            <strong style="color: #d97706; display: block; font-size: 14px; margin-bottom: 2px;">★ Pro Exclusive Funding Opportunity</strong>
            <span style="font-size: 12.5px; color: var(--fg-text-muted);">Subscribe to CorporateMart Pro to view exact funding ticket sizes, direct nodal portals, and detailed DPR checklist.</span>
          </div>
          <button type="button" class="btn-upgrade-pro" id="modalProUpgradeCta" style="white-space: nowrap; padding: 8px 16px;">Upgrade Now</button>
        </div>
      ` : ''}

      <div class="card-amount-banner" style="margin-bottom: 22px;">
        <div class="banner-amount">
          <span class="amount-lbl">Funding Ticket / Pool</span>
          <span class="amount-val" style="font-size: 18px; ${isLocked ? 'color: #d97706;' : ''}">${s.amount}</span>
        </div>
        <div class="banner-deadline ${dl.tagClass}">
          <span class="deadline-lbl">Application Status</span>
          <span class="deadline-val" style="font-size: 13px;">${dl.label}</span>
        </div>
      </div>

      <h4 style="font-size: 15px; font-weight: 700; margin: 0 0 8px; color: var(--fg-text);">Scheme Overview</h4>
      <p style="font-size: 14px; line-height: 1.7; color: var(--fg-text-muted); margin-bottom: 24px;">${s.description}</p>

      <h4 style="font-size: 15px; font-weight: 700; margin: 0 0 12px; color: var(--fg-text);">Eligibility Matrix</h4>
      <div style="background: var(--fg-bg); border: 1px solid var(--fg-border); border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
        <div class="modal-detail-row">
          <span class="modal-detail-label">Stage Requirement</span>
          <span class="modal-detail-value">${s.stage} stage startups</span>
        </div>
        <div class="modal-detail-row">
          <span class="modal-detail-label">Eligible Entities</span>
          <span class="modal-detail-value">${s.entityType}</span>
        </div>
        <div class="modal-detail-row">
          <span class="modal-detail-label">Sector / Industry</span>
          <span class="modal-detail-value">${(s.industry || '').replace(/\n/g, ', ')}</span>
        </div>
        <div class="modal-detail-row">
          <span class="modal-detail-label">Target Founder</span>
          <span class="modal-detail-value">${s.founderType}</span>
        </div>
        <div class="modal-detail-row">
          <span class="modal-detail-label">Territorial Scope</span>
          <span class="modal-detail-value">${s.state}</span>
        </div>
        <div class="modal-detail-row">
          <span class="modal-detail-label">Registration Needed</span>
          <span class="modal-detail-value">${s.registrations}</span>
        </div>
      </div>

      <h4 style="font-size: 15px; font-weight: 700; margin: 0 0 10px; color: var(--fg-text);">How CorporateMart Helps You Secure This Funding:</h4>
      <ul style="font-size: 13px; line-height: 1.7; color: var(--fg-text-muted); margin: 0 0 16px; padding-left: 20px;">
        <li>Full eligibility review & DPIIT recognition compliance check</li>
        <li>Preparation of Detailed Project Report (DPR) & pitching deck</li>
        <li>Financial projections & valuation report by practicing CA/CS</li>
        <li>Direct application filing & representation with nodal authorities</li>
      </ul>
    `;

    const ctaBtn = document.getElementById('modalProUpgradeCta');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        closeDetailsModal();
        openPricingModal();
      });
    }

    if (elements.modalApplyBtn) {
      if (isLocked) {
        elements.modalApplyBtn.style.display = '';
        elements.modalApplyBtn.innerHTML = '★ Unlock with Pro Membership';
        elements.modalApplyBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        elements.modalApplyBtn.onclick = () => {
          closeDetailsModal();
          openPricingModal();
        };
      } else if (dl.isClosed) {
        elements.modalApplyBtn.style.display = 'none';
      } else {
        elements.modalApplyBtn.style.display = '';
        elements.modalApplyBtn.innerHTML = 'Apply with Expert Assistance &rarr;';
        elements.modalApplyBtn.style.background = '';
        elements.modalApplyBtn.onclick = () => {
          closeDetailsModal();
          openApplicationModal(s.name, s.amount);
        };
      }
    }

    if (elements.modalSowBtn) {
      const isLoan = ft.includes('loan');
      elements.modalSowBtn.href = isLoan ? 'images/Loan_SOW.jpeg' : 'images/Fund_SOW.jpeg';
    }

    elements.modalBackdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailsModal() {
    if (elements.modalBackdrop) {
      elements.modalBackdrop.classList.remove('is-open');
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  }

  // Open Lead / Quotation Modal
  function openApplicationModal(schemeName, amount) {
    const quotationModal = document.getElementById('quotationModal');
    const planModal = document.getElementById('planModal');
    const planInput = document.getElementById('planSelected');

    if (planModal) {
      if (planInput) {
        planInput.value = `Fundraising: ${schemeName}${amount ? ' (' + amount + ')' : ''}`;
      }
      planModal.classList.add('is-open');
      planModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      const nameField = document.getElementById('planName');
      if (nameField) {
        setTimeout(() => {
          try {
            nameField.focus({ preventScroll: true });
          } catch (e) {
            nameField.focus();
          }
        }, 120);
      }
      return;
    }

    const openQuotationBtn = document.getElementById('openQuotationModal') || document.getElementById('openQuotationModalBtn');
    if (openQuotationBtn) {
      openQuotationBtn.click();
      return;
    }

    const consultationSection = document.getElementById('consultationContact');
    if (consultationSection) {
      consultationSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = 'contact_us.html?service=' + encodeURIComponent(`Fundraising: ${schemeName}`);
    }
  }

  function closeApplicationModal() {
    const planModal = document.getElementById('planModal');
    if (planModal) {
      planModal.classList.remove('is-open');
      planModal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  }

  // Sticky Header Row 2 with frosted glass blur effect (matches other pages)
  function initStickyHeader() {
    const row1 = document.querySelector('.header-row-1');
    const row2 = document.querySelector('.header-row-2');
    if (!row1 || !row2) return;

    let spacer = document.querySelector('.header-row-2-spacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.className = 'header-row-2-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      row2.parentNode.insertBefore(spacer, row2.nextSibling);
    }

    function setStuck(stuck) {
      if (stuck) {
        spacer.style.height = row2.offsetHeight + 'px';
        spacer.classList.add('is-active');
        row2.classList.add('is-stuck');
      } else {
        row2.classList.remove('is-stuck');
        spacer.classList.remove('is-active');
        spacer.style.height = '0px';
      }
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        entries => {
          setStuck(!entries[0].isIntersecting);
        },
        { root: null, threshold: 0 }
      ).observe(row1);
    }

    window.addEventListener('scroll', () => {
      setStuck(row1.getBoundingClientRect().bottom <= 0);
    }, { passive: true });

    setStuck(row1.getBoundingClientRect().bottom <= 0);
  }

  // Setup Global Listeners
  function initListeners() {
    if (elements.searchInput) {
      let debounceTimer;
      elements.searchInput.addEventListener('input', e => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.search = e.target.value;
          applyFilters();
        }, 180);
      });
    }

    if (elements.sortSelect) {
      elements.sortSelect.addEventListener('change', e => {
        state.sortBy = e.target.value;
        applyFilters();
      });
    }

    elements.quickPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const q = pill.getAttribute('data-quick');
        state.quickType = q;
        updateQuickPillsUI();
        applyFilters();
      });
    });

    if (elements.resetFiltersBtn) {
      elements.resetFiltersBtn.addEventListener('click', resetAllFilters);
    }

    if (elements.mobileFilterBtn && elements.sidebar) {
      elements.mobileFilterBtn.addEventListener('click', () => {
        elements.sidebar.classList.add('is-open');
        if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      });
    }

    if (elements.sidebarBackdrop && elements.sidebar) {
      elements.sidebarBackdrop.addEventListener('click', () => {
        elements.sidebar.classList.remove('is-open');
        elements.sidebarBackdrop.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    }

    // Auth Modal Listeners
    if (elements.openAuthBtn) {
      elements.openAuthBtn.addEventListener('click', () => openAuthModal('signin'));
    }
    if (elements.authModalCloseBtn) {
      elements.authModalCloseBtn.addEventListener('click', closeAuthModal);
    }
    if (elements.authModal) {
      elements.authModal.addEventListener('click', e => {
        if (e.target === elements.authModal) closeAuthModal();
      });
    }
    if (elements.tabSignIn) {
      elements.tabSignIn.addEventListener('click', () => switchAuthTab('signin'));
    }
    if (elements.tabRegister) {
      elements.tabRegister.addEventListener('click', () => switchAuthTab('register'));
    }

    // Sign In Form Submit
    if (elements.signInForm) {
      elements.signInForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Login failed');

          state.user = data.user;
          state.token = data.token;
          state.isSubscriber = !!(data.user.isSubscribed || data.user.role === 'admin');
          localStorage.setItem('cm_auth_token', data.token);
          localStorage.setItem('cm_user', JSON.stringify(data.user));

          closeAuthModal();
          updateAccountUI();
          await loadSchemesData();
          buildSidebarFilters();
          applyFilters();

          if (state.pendingPlanId) {
            const planToResume = state.pendingPlanId;
            state.pendingPlanId = null;
            openPricingModal();
            startSubscriptionCheckout(planToResume);
          }
        } catch (err) {
          showAuthError(err.message);
        }
      });
    }

    // Register Form Submit
    if (elements.registerForm) {
      elements.registerForm.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const phone = (document.getElementById('regPhone')?.value || '').trim();
        const password = document.getElementById('regPassword').value;

        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Registration failed');

          state.user = data.user;
          state.token = data.token;
          state.isSubscriber = false;
          localStorage.setItem('cm_auth_token', data.token);
          localStorage.setItem('cm_user', JSON.stringify(data.user));

          closeAuthModal();
          updateAccountUI();
          await loadSchemesData();
          buildSidebarFilters();
          applyFilters();

          if (state.pendingPlanId) {
            const planToResume = state.pendingPlanId;
            state.pendingPlanId = null;
            openPricingModal();
            startSubscriptionCheckout(planToResume);
          }
        } catch (err) {
          showAuthError(err.message);
        }
      });
    }

    // Forgot Password Link Click
    const forgotPwdLink = document.getElementById('btnForgotPwdLink');
    if (forgotPwdLink) {
      forgotPwdLink.addEventListener('click', () => switchAuthTab('forgot'));
    }

    // Back to Sign In Link Click
    const backToSignIn = document.getElementById('btnBackToSignIn');
    if (backToSignIn) {
      backToSignIn.addEventListener('click', () => switchAuthTab('signin'));
    }

    // Forgot Password Form Submit
    const forgotForm = document.getElementById('forgotPwdForm');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = (document.getElementById('resetEmail')?.value || '').trim();
        const phone = (document.getElementById('resetPhone')?.value || '').trim();
        const newPassword = document.getElementById('resetNewPassword')?.value || '';
        const confirmPassword = document.getElementById('resetConfirmPassword')?.value || '';

        if (newPassword !== confirmPassword) {
          showAuthError('Passwords do not match. Please verify and re-type.');
          return;
        }

        try {
          const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, phone, newPassword })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to reset password');

          alert('Password successfully updated! Please sign in with your new password.');
          switchAuthTab('signin');
          const loginEmail = document.getElementById('loginEmail');
          if (loginEmail) loginEmail.value = email;
          const loginPass = document.getElementById('loginPassword');
          if (loginPass) {
            loginPass.value = '';
            loginPass.focus();
          }
        } catch (err) {
          showAuthError(err.message);
        }
      });
    }

    // Pricing Modal Listeners
    if (elements.openPricingBtn) {
      elements.openPricingBtn.addEventListener('click', openPricingModal);
    }
    if (elements.pricingModalCloseBtn) {
      elements.pricingModalCloseBtn.addEventListener('click', closePricingModal);
    }
    if (elements.pricingModal) {
      elements.pricingModal.addEventListener('click', e => {
        if (e.target === elements.pricingModal) closePricingModal();
      });
    }

    document.querySelectorAll('.btn-select-plan').forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = btn.getAttribute('data-plan') || 'pro_99';
        startSubscriptionCheckout(plan);
      });
    });

    const pricingSignInLink = document.getElementById('pricingSignInLink');
    if (pricingSignInLink) {
      pricingSignInLink.addEventListener('click', () => {
        closePricingModal();
        openAuthModal('signin');
      });
    }

    if (elements.modalCloseBtn) {
      elements.modalCloseBtn.addEventListener('click', closeDetailsModal);
    }

    const modalCloseFooterBtn = document.getElementById('modalCloseFooterBtn');
    if (modalCloseFooterBtn) {
      modalCloseFooterBtn.addEventListener('click', closeDetailsModal);
    }

    const planModalCloseBtn = document.getElementById('planModalCloseBtn');
    if (planModalCloseBtn) {
      planModalCloseBtn.addEventListener('click', closeApplicationModal);
    }

    const planModalBackdrop = document.getElementById('planModalBackdrop');
    if (planModalBackdrop) {
      planModalBackdrop.addEventListener('click', closeApplicationModal);
    }

    if (elements.modalBackdrop) {
      elements.modalBackdrop.addEventListener('click', e => {
        if (e.target === elements.modalBackdrop) closeDetailsModal();
      });
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeDetailsModal();
        closeApplicationModal();
        closeAuthModal();
        closePricingModal();
      }
    });
  }

  // ==========================================
  // AUTH & SUBSCRIPTION METHODS
  // ==========================================
  function updateAccountUI() {
    if (!elements.userBar) return;

    if (state.user && state.user.role === 'admin') {
      if (elements.userStatusIcon) elements.userStatusIcon.textContent = '🛡️';
      if (elements.userBarTitle) elements.userBarTitle.textContent = `Administrator: ${state.user.name}`;
      if (elements.userBarSubtitle) {
        elements.userBarSubtitle.textContent = 'Full administrative control active. You can Add, Update, and Delete fundraising schemes.';
      }
      if (elements.userBarActions) {
        elements.userBarActions.innerHTML = `
          <a href="fundraising_admin.html" class="btn-upgrade-pro" style="background: linear-gradient(135deg, #1e40af, #2563eb); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
            ⚙️ Manage Schemes (Admin)
          </a>
          <button type="button" class="btn-user-auth" id="btnSignOut">Sign Out</button>
        `;
      }
    } else if (state.user && state.isSubscriber) {
      if (elements.userStatusIcon) elements.userStatusIcon.textContent = '👑';
      if (elements.userBarTitle) elements.userBarTitle.textContent = `Pro Member: ${state.user.name}`;
      if (elements.userBarSubtitle) {
        elements.userBarSubtitle.textContent = 'All 25+ government grants, venture pools, and direct portals are completely unlocked.';
      }
      if (elements.userBarActions) {
        elements.userBarActions.innerHTML = `
          <span style="font-size: 12px; font-weight: 700; color: #10b981; display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(16, 185, 129, 0.1); border-radius: 999px;">
            ● Active Subscription
          </span>
          <button type="button" class="btn-user-auth" id="btnSignOut">Sign Out</button>
        `;
      }
    } else if (state.user) {
      if (elements.userStatusIcon) elements.userStatusIcon.textContent = '👤';
      if (elements.userBarTitle) elements.userBarTitle.textContent = `Member: ${state.user.name} (Free Tier)`;
      if (elements.userBarSubtitle) {
        elements.userBarSubtitle.textContent = 'Viewing 2 free schemes. Upgrade to Pro for 23+ exclusive venture grants.';
      }
      if (elements.userBarActions) {
        elements.userBarActions.innerHTML = `
          <button type="button" class="btn-upgrade-pro" id="btnUpgradeBar">★ Upgrade to Pro</button>
          <button type="button" class="btn-user-auth" id="btnSignOut">Sign Out</button>
        `;
      }
    } else {
      if (elements.userStatusIcon) elements.userStatusIcon.textContent = '🔒';
      if (elements.userBarTitle) elements.userBarTitle.textContent = 'Free Explorer View';
      if (elements.userBarSubtitle) {
        elements.userBarSubtitle.textContent = 'Viewing 2 standard public schemes. Subscribe to Pro to unlock 23+ exclusive venture & grand challenge grants.';
      }
      if (elements.userBarActions) {
        elements.userBarActions.innerHTML = `
          <button type="button" class="btn-upgrade-pro" id="btnUpgradeBar">★ Upgrade to Pro</button>
          <button type="button" class="btn-user-auth" id="btnSignInBar">Sign In / Register</button>
        `;
      }
    }

    const upgradeBtn = document.getElementById('btnUpgradeBar');
    if (upgradeBtn) upgradeBtn.addEventListener('click', openPricingModal);

    const signInBtn = document.getElementById('btnSignInBar');
    if (signInBtn) signInBtn.addEventListener('click', () => openAuthModal('signin'));

    const signOutBtn = document.getElementById('btnSignOut');
    if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);
  }

  function openAuthModal(defaultTab = 'signin') {
    const modal = elements.authModal || document.getElementById('authModal');
    if (!modal) return;
    if (elements.authErrorMsg) {
      elements.authErrorMsg.style.display = 'none';
      elements.authErrorMsg.textContent = '';
    }
    switchAuthTab(defaultTab);
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeAuthModal() {
    const modal = elements.authModal || document.getElementById('authModal');
    if (modal) {
      modal.classList.remove('is-open');
    }
    document.body.style.overflow = '';
  }

  function switchAuthTab(tab) {
    const forgotForm = document.getElementById('forgotPwdForm');
    const authTabs = document.querySelector('.auth-tabs');
    const modalTitle = document.getElementById('authModalTitle');

    if (tab === 'forgot') {
      if (authTabs) authTabs.style.display = 'none';
      if (modalTitle) modalTitle.textContent = 'Reset Password';
      if (elements.signInForm) elements.signInForm.style.display = 'none';
      if (elements.registerForm) elements.registerForm.style.display = 'none';
      if (forgotForm) forgotForm.style.display = 'block';
    } else {
      if (authTabs) authTabs.style.display = 'flex';
      if (modalTitle) modalTitle.textContent = 'Member Access';
      if (forgotForm) forgotForm.style.display = 'none';

      if (tab === 'register') {
        if (elements.tabRegister) elements.tabRegister.classList.add('is-active');
        if (elements.tabSignIn) elements.tabSignIn.classList.remove('is-active');
        if (elements.registerForm) elements.registerForm.style.display = 'block';
        if (elements.signInForm) elements.signInForm.style.display = 'none';
      } else {
        if (elements.tabSignIn) elements.tabSignIn.classList.add('is-active');
        if (elements.tabRegister) elements.tabRegister.classList.remove('is-active');
        if (elements.signInForm) elements.signInForm.style.display = 'block';
        if (elements.registerForm) elements.registerForm.style.display = 'none';
      }
    }
  }

  function showAuthError(msg) {
    if (elements.authErrorMsg) {
      elements.authErrorMsg.textContent = msg;
      elements.authErrorMsg.style.display = 'block';
    }
  }

  function handleSignOut() {
    state.user = null;
    state.token = null;
    state.isSubscriber = false;
    localStorage.removeItem('cm_auth_token');
    localStorage.removeItem('cm_user');
    updateAccountUI();
    loadSchemesData().then(() => {
      buildSidebarFilters();
      applyFilters();
    });
  }

  function openPricingModal() {
    const modal = elements.pricingModal || document.getElementById('pricingModal');
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closePricingModal() {
    const modal = elements.pricingModal || document.getElementById('pricingModal');
    if (modal) {
      modal.classList.remove('is-open');
    }
    document.body.style.overflow = '';
  }

  async function startSubscriptionCheckout(planId) {
    if (!state.user || !state.token) {
      state.pendingPlanId = planId;
      closePricingModal();
      openAuthModal('register');
      showAuthError('Please create an account or sign in to activate your Pro subscription.');
      return;
    }

    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ planId })
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || 'Could not initiate payment order');
      }

      if (orderData.isDemo) {
        const confirmMsg = `💳 Developer Test Gateway Active:\n\nConfirm test payment for ${orderData.planName} (₹${orderData.amount / 100})?\n\n(No real card required in test sandbox mode)`;
        if (confirm(confirmMsg)) {
          await verifyPaymentOnServer({
            orderId: orderData.orderId,
            paymentId: 'pay_sim_' + Date.now(),
            signature: 'simulated_sig_success',
            planId
          });
        }
        return;
      }

      if (typeof Razorpay !== 'undefined') {
        const rzpOptions = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'CorporateMart Pro',
          description: orderData.planName,
          order_id: orderData.orderId,
          prefill: {
            name: state.user.name,
            email: state.user.email,
            contact: state.user.phone || ''
          },
          theme: {
            color: '#1676bb'
          },
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true
          },
          handler: async function (response) {
            await verifyPaymentOnServer({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId
            });
          }
        };
        const rzp = new Razorpay(rzpOptions);
        rzp.open();
      } else {
        alert('Payment gateway failed to load. Please check your internet connection.');
      }
    } catch (err) {
      alert('Checkout error: ' + err.message);
    }
  }

  async function verifyPaymentOnServer(payload) {
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(payload)
      });

      const verifyData = await res.json();
      if (!res.ok) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      state.user = verifyData.user;
      state.isSubscriber = true;
      localStorage.setItem('cm_user', JSON.stringify(verifyData.user));

      closePricingModal();
      alert('🎉 ' + verifyData.message);

      await loadSchemesData();
      updateAccountUI();
      buildSidebarFilters();
      applyFilters();
    } catch (err) {
      alert('Payment Verification Failed: ' + err.message);
    }
  }

  async function loadSchemesData() {
    const headers = {};
    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    try {
      const res = await fetch('/api/schemes', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && data.schemes) {
          state.schemes = data.schemes;
          state.isSubscriber = !!(data.isSubscriber || data.isAdmin || (state.user && state.user.role === 'admin'));
          return;
        }
      }
    } catch (e) {
      console.log('Running in static / offline mode, using local schemes-data.js');
    }

    state.schemes = (typeof SCHEMES_DATA !== 'undefined' ? SCHEMES_DATA : []).map((s, idx) => ({
      ...s,
      tier: idx < 2 ? 'free' : 'pro',
      isLocked: (state.isSubscriber || (state.user && state.user.role === 'admin')) ? false : (idx >= 2)
    }));
  }

  async function checkAuthStatus() {
    if (!state.token) {
      const stored = localStorage.getItem('cm_user');
      if (stored) {
        try {
          state.user = JSON.parse(stored);
          state.isSubscriber = !!(state.user.isSubscribed || state.user.role === 'admin');
        } catch (err) {}
      } else {
        state.user = null;
        state.isSubscriber = false;
      }
      updateAccountUI();
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        state.user = data.user;
        state.isSubscriber = !!(data.user.isSubscribed || data.user.role === 'admin');
        localStorage.setItem('cm_user', JSON.stringify(data.user));
      } else {
        state.token = null;
        state.user = null;
        localStorage.removeItem('cm_auth_token');
        localStorage.removeItem('cm_user');
      }
    } catch (e) {
      const stored = localStorage.getItem('cm_user');
      if (stored) {
        try {
          state.user = JSON.parse(stored);
          state.isSubscriber = !!(state.user.isSubscribed || state.user.role === 'admin');
        } catch (err) {}
      }
    }

    updateAccountUI();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    initElements();
    initListeners();
    initStickyHeader();

    await checkAuthStatus();
    await loadSchemesData();

    buildSidebarFilters();
    applyFilters();
  });

})();
