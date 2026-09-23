/**
 * ==========================================================================
 * CORPORATE MART - OPERATIONS PORTAL CONTROLLER
 * ==========================================================================
 */

(function () {
  'use strict';

  // State
  let authToken = localStorage.getItem('ops_token') || '';
  let currentUser = null;
  let cachedClients = [];
  let cachedCases = [];
  let currentCaseFilter = '';

  // DOM Elements
  const authOverlay = document.getElementById('authOverlay');
  const opsLoginForm = document.getElementById('opsLoginForm');
  const opsLoginError = document.getElementById('opsLoginError');
  const opsLogoutBtn = document.getElementById('opsLogoutBtn');
  const opsThemeToggle = document.getElementById('opsThemeToggle');
  const opsMenuToggle = document.getElementById('opsMenuToggle');
  const opsSidebar = document.getElementById('opsSidebar');
  const opsPageTitle = document.getElementById('opsPageTitle');
  const opsPageSubtitle = document.getElementById('opsPageSubtitle');
  const toastContainer = document.getElementById('toastContainer');

  // ==========================================
  // 1. NOTIFICATIONS & TOASTS
  // ==========================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `ops-toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ==========================================
  // 2. THEME & MOBILE MENU
  // ==========================================
  function initTheme() {
    const savedTheme = localStorage.getItem('ops_theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }
    opsThemeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('ops_theme', isDark ? 'dark' : 'light');
    });
  }

  function initMobileMenu() {
    if (opsMenuToggle && opsSidebar) {
      opsMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        opsSidebar.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!opsSidebar.contains(e.target) && !opsMenuToggle.contains(e.target)) {
          opsSidebar.classList.remove('open');
        }
      });
    }
  }

  // ==========================================
  // 3. AUTHENTICATION & SESSION
  // ==========================================
  async function apiRequest(endpoint, options = {}) {
    const headers = options.headers || {};
    if (authToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const res = await fetch(endpoint, { ...options, headers });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleAuthFailure(data.error || 'Session expired. Please log in.');
        }
        throw new Error(data.error || `HTTP error ${res.status}`);
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  function handleAuthFailure(msg) {
    authToken = '';
    currentUser = null;
    localStorage.removeItem('ops_token');
    authOverlay.classList.remove('hidden');
    if (msg) {
      opsLoginError.textContent = msg;
      opsLoginError.style.display = 'block';
    }
  }

  async function checkAuth() {
    if (!authToken) {
      authOverlay.classList.remove('hidden');
      return;
    }

    try {
      const data = await apiRequest('/api/portal/auth/me');
      if (data && data.user) {
        currentUser = data.user;
        if (currentUser.role !== 'admin' && currentUser.role !== 'operations') {
          handleAuthFailure('Access denied: Staff credentials required.');
          return;
        }
        authOverlay.classList.add('hidden');
        renderStaffProfile();
        loadAllData();
      }
    } catch (err) {
      handleAuthFailure();
    }
  }

  function renderStaffProfile() {
    if (!currentUser) return;
    const nameEl = document.getElementById('staffName');
    const roleEl = document.getElementById('staffRole');
    const avatarEl = document.getElementById('staffAvatar');

    if (nameEl) nameEl.textContent = currentUser.name || 'Operations Staff';
    if (roleEl) roleEl.textContent = currentUser.role === 'admin' ? 'Operations Admin' : 'Operations Staff';
    if (avatarEl) {
      const initials = (currentUser.name || 'OP')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      avatarEl.textContent = initials || 'OP';
    }
  }

  // Handle Login Submit
  opsLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    opsLoginError.style.display = 'none';
    const email = document.getElementById('opsEmail').value.trim();
    const password = document.getElementById('opsPassword').value;

    try {
      const res = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (data.user.role !== 'admin' && data.user.role !== 'operations') {
        throw new Error('Access denied: Only Operations and Admin staff can enter this portal.');
      }

      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('ops_token', authToken);
      authOverlay.classList.add('hidden');
      renderStaffProfile();
      showToast(`Welcome back, ${currentUser.name}!`, 'success');
      loadAllData();
    } catch (err) {
      opsLoginError.textContent = err.message;
      opsLoginError.style.display = 'block';
    }
  });

  // Handle Logout
  if (opsLogoutBtn) {
    opsLogoutBtn.addEventListener('click', () => {
      authToken = '';
      currentUser = null;
      localStorage.removeItem('ops_token');
      authOverlay.classList.remove('hidden');
      showToast('Logged out of operations portal.');
    });
  }

  // ==========================================
  // 3B. FORGOT PASSWORD & STAFF PROFILE SETTINGS
  // ==========================================
  const opsForgotOverlay = document.getElementById('opsForgotOverlay');
  const linkOpsForgotPass = document.getElementById('linkOpsForgotPass');
  const linkOpsBackToLogin = document.getElementById('linkOpsBackToLogin');
  const linkOpsBackToLogin2 = document.getElementById('linkOpsBackToLogin2');
  const linkOpsResendOtp = document.getElementById('linkOpsResendOtp');
  const formOpsForgotStep1 = document.getElementById('formOpsForgotStep1');
  const formOpsForgotStep2 = document.getElementById('formOpsForgotStep2');
  const opsForgotError1 = document.getElementById('opsForgotError1');
  const opsForgotError2 = document.getElementById('opsForgotError2');
  const displayOpsForgotEmail = document.getElementById('displayOpsForgotEmail');

  let opsForgotEmailTarget = '';

  if (linkOpsForgotPass) {
    linkOpsForgotPass.addEventListener('click', (e) => {
      e.preventDefault();
      authOverlay.classList.add('hidden');
      if (opsForgotOverlay) {
        opsForgotOverlay.classList.remove('hidden');
        if (formOpsForgotStep1) formOpsForgotStep1.style.display = 'block';
        if (formOpsForgotStep2) formOpsForgotStep2.style.display = 'none';
        if (opsForgotError1) opsForgotError1.style.display = 'none';
        if (opsForgotError2) opsForgotError2.style.display = 'none';
        const opsEmailInput = document.getElementById('opsEmail');
        if (opsEmailInput && opsEmailInput.value) {
          const forgotInput = document.getElementById('opsForgotEmail');
          if (forgotInput) forgotInput.value = opsEmailInput.value;
        }
      }
    });
  }

  function returnOpsToLogin() {
    if (opsForgotOverlay) opsForgotOverlay.classList.add('hidden');
    authOverlay.classList.remove('hidden');
  }

  if (linkOpsBackToLogin) linkOpsBackToLogin.addEventListener('click', (e) => { e.preventDefault(); returnOpsToLogin(); });
  if (linkOpsBackToLogin2) linkOpsBackToLogin2.addEventListener('click', (e) => { e.preventDefault(); returnOpsToLogin(); });

  if (formOpsForgotStep1) {
    formOpsForgotStep1.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (opsForgotError1) opsForgotError1.style.display = 'none';
      const email = (document.getElementById('opsForgotEmail').value || '').trim();
      if (!email) return;

      const btn = document.getElementById('btnSendOpsResetOtp');
      btn.disabled = true;
      btn.textContent = 'Sending Code...';

      try {
        const res = await fetch('/api/portal/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send reset code');

        opsForgotEmailTarget = email;
        if (displayOpsForgotEmail) displayOpsForgotEmail.textContent = email;
        formOpsForgotStep1.style.display = 'none';
        formOpsForgotStep2.style.display = 'block';
        showToast('6-digit code sent to your staff email!', 'success');
      } catch (err) {
        if (opsForgotError1) {
          opsForgotError1.textContent = err.message;
          opsForgotError1.style.display = 'block';
        }
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Send Verification Code</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
      }
    });
  }

  if (linkOpsResendOtp) {
    linkOpsResendOtp.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!opsForgotEmailTarget) return;
      try {
        await fetch('/api/portal/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: opsForgotEmailTarget })
        });
        showToast('A new 6-digit code has been sent!', 'info');
      } catch (err) {
        showToast('Failed to resend code', 'error');
      }
    });
  }

  if (formOpsForgotStep2) {
    formOpsForgotStep2.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (opsForgotError2) opsForgotError2.style.display = 'none';
      const otp = (document.getElementById('opsForgotOtp').value || '').trim();
      const newPassword = document.getElementById('opsForgotNewPass').value;
      const confirmPass = document.getElementById('opsForgotConfirmPass').value;

      if (newPassword !== confirmPass) {
        if (opsForgotError2) {
          opsForgotError2.textContent = 'Passwords do not match';
          opsForgotError2.style.display = 'block';
        }
        return;
      }
      if (newPassword.length < 6) {
        if (opsForgotError2) {
          opsForgotError2.textContent = 'Password must be at least 6 characters';
          opsForgotError2.style.display = 'block';
        }
        return;
      }

      const btn = document.getElementById('btnVerifyOpsResetOtp');
      btn.disabled = true;
      btn.textContent = 'Resetting Password...';

      try {
        const res = await fetch('/api/portal/auth/verify-reset-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: opsForgotEmailTarget, otp, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reset password');

        showToast('Password reset successfully! Please sign in.', 'success');
        returnOpsToLogin();
        const opsEmailInput = document.getElementById('opsEmail');
        if (opsEmailInput) opsEmailInput.value = opsForgotEmailTarget;
        const opsPassInput = document.getElementById('opsPassword');
        if (opsPassInput) opsPassInput.value = '';
      } catch (err) {
        if (opsForgotError2) {
          opsForgotError2.textContent = err.message;
          opsForgotError2.style.display = 'block';
        }
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Reset Password & Log In</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      }
    });
  }

  // Staff Profile & Password Modal
  const modalOpsProfile = document.getElementById('modalOpsProfile');
  const opsSettingsBtn = document.getElementById('opsSettingsBtn');
  const opsTopSettingsBtn = document.getElementById('opsTopSettingsBtn');
  const tabBtnOpsProfile = document.getElementById('tabBtnOpsProfile');
  const tabBtnOpsSecurity = document.getElementById('tabBtnOpsSecurity');
  const formOpsProfile = document.getElementById('formOpsProfile');
  const formOpsChangePassword = document.getElementById('formOpsChangePassword');
  const opsProfileMsg = document.getElementById('opsProfileMsg');
  const opsChangePassMsg = document.getElementById('opsChangePassMsg');

  function openOpsProfileModal(tab = 'profile') {
    if (!currentUser) return;
    const editOpsName = document.getElementById('editOpsName');
    const editOpsPhone = document.getElementById('editOpsPhone');
    const editOpsEmail = document.getElementById('editOpsEmail');

    if (editOpsName) editOpsName.value = currentUser.name || '';
    if (editOpsPhone) editOpsPhone.value = currentUser.phone || '';
    if (editOpsEmail) editOpsEmail.value = currentUser.email || '';

    switchOpsProfileTab(tab);
    if (opsProfileMsg) opsProfileMsg.style.display = 'none';
    if (opsChangePassMsg) opsChangePassMsg.style.display = 'none';
    openModal('modalOpsProfile');
  }

  function switchOpsProfileTab(tab) {
    if (!tabBtnOpsProfile || !tabBtnOpsSecurity) return;
    if (tab === 'profile') {
      tabBtnOpsProfile.style.color = 'var(--ops-primary)';
      tabBtnOpsProfile.style.borderBottom = '2px solid var(--ops-primary)';
      tabBtnOpsSecurity.style.color = 'var(--ops-text-muted)';
      tabBtnOpsSecurity.style.borderBottom = 'none';
      if (formOpsProfile) formOpsProfile.style.display = 'block';
      if (formOpsChangePassword) formOpsChangePassword.style.display = 'none';
    } else {
      tabBtnOpsSecurity.style.color = 'var(--ops-primary)';
      tabBtnOpsSecurity.style.borderBottom = '2px solid var(--ops-primary)';
      tabBtnOpsProfile.style.color = 'var(--ops-text-muted)';
      tabBtnOpsProfile.style.borderBottom = 'none';
      if (formOpsChangePassword) formOpsChangePassword.style.display = 'block';
      if (formOpsProfile) formOpsProfile.style.display = 'none';
    }
  }

  if (opsSettingsBtn) opsSettingsBtn.addEventListener('click', () => openOpsProfileModal('profile'));
  if (opsTopSettingsBtn) opsTopSettingsBtn.addEventListener('click', () => openOpsProfileModal('profile'));
  if (tabBtnOpsProfile) tabBtnOpsProfile.addEventListener('click', () => switchOpsProfileTab('profile'));
  if (tabBtnOpsSecurity) tabBtnOpsSecurity.addEventListener('click', () => switchOpsProfileTab('security'));

  if (formOpsProfile) {
    formOpsProfile.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (document.getElementById('editOpsName').value || '').trim();
      const phone = (document.getElementById('editOpsPhone').value || '').trim();
      const btn = document.getElementById('btnSaveOpsProfile');

      btn.disabled = true;
      btn.textContent = 'Saving...';
      if (opsProfileMsg) opsProfileMsg.style.display = 'none';

      try {
        const data = await apiRequest('/api/portal/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({ name, phone })
        });
        currentUser = { ...currentUser, ...data.user };
        renderStaffProfile();
        showToast('Profile updated successfully!', 'success');
        if (opsProfileMsg) {
          opsProfileMsg.style.background = 'rgba(16,185,129,0.1)';
          opsProfileMsg.style.color = '#10b981';
          opsProfileMsg.textContent = 'Staff profile updated successfully!';
          opsProfileMsg.style.display = 'block';
        }
        setTimeout(() => closeModal(modalOpsProfile), 1200);
      } catch (err) {
        if (opsProfileMsg) {
          opsProfileMsg.style.background = 'rgba(239,68,68,0.1)';
          opsProfileMsg.style.color = '#ef4444';
          opsProfileMsg.textContent = err.message || 'Failed to update profile';
          opsProfileMsg.style.display = 'block';
        }
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
      }
    });
  }

  if (formOpsChangePassword) {
    formOpsChangePassword.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('currOpsPassword').value;
      const newPassword = document.getElementById('newOpsPassword').value;
      const confirmPassword = document.getElementById('confirmOpsPassword').value;
      const btn = document.getElementById('btnSaveOpsPassword');

      if (opsChangePassMsg) opsChangePassMsg.style.display = 'none';

      if (newPassword !== confirmPassword) {
        if (opsChangePassMsg) {
          opsChangePassMsg.style.background = 'rgba(239,68,68,0.1)';
          opsChangePassMsg.style.color = '#ef4444';
          opsChangePassMsg.textContent = 'New passwords do not match';
          opsChangePassMsg.style.display = 'block';
        }
        return;
      }
      if (newPassword.length < 6) {
        if (opsChangePassMsg) {
          opsChangePassMsg.style.background = 'rgba(239,68,68,0.1)';
          opsChangePassMsg.style.color = '#ef4444';
          opsChangePassMsg.textContent = 'New password must be at least 6 characters';
          opsChangePassMsg.style.display = 'block';
        }
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Updating...';

      try {
        await apiRequest('/api/portal/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword })
        });
        showToast('Password changed successfully!', 'success');
        if (opsChangePassMsg) {
          opsChangePassMsg.style.background = 'rgba(16,185,129,0.1)';
          opsChangePassMsg.style.color = '#10b981';
          opsChangePassMsg.textContent = 'Password updated successfully!';
          opsChangePassMsg.style.display = 'block';
        }
        formOpsChangePassword.reset();
        setTimeout(() => closeModal(modalOpsProfile), 1200);
      } catch (err) {
        if (opsChangePassMsg) {
          opsChangePassMsg.style.background = 'rgba(239,68,68,0.1)';
          opsChangePassMsg.style.color = '#ef4444';
          opsChangePassMsg.textContent = err.message || 'Failed to update password';
          opsChangePassMsg.style.display = 'block';
        }
      } finally {
        btn.disabled = false;
        btn.textContent = 'Update Password';
      }
    });
  }

  // ==========================================
  // 4. NAVIGATION & SECTION ROUTING
  // ==========================================
  const pageHeaders = {
    dashboard: { title: 'Dashboard', sub: 'Overview of clients, services in progress, and messages' },
    clients: { title: 'Clients List', sub: 'Add and manage registered client companies and contacts' },
    cases: { title: 'Services & Status', sub: 'Track progress and update status of client services' },
    documents: { title: 'Client Documents', sub: 'Upload certificates and files for clients to download' },
    tickets: { title: 'Support & Messages', sub: 'Client questions and staff replies' }
  };

  function switchSection(sectionId) {
    const targetSec = document.getElementById(`sec-${sectionId}`);
    if (!targetSec) return;

    document.querySelectorAll('.ops-view-section').forEach((sec) => sec.classList.remove('active'));
    targetSec.classList.add('active');

    document.querySelectorAll('.ops-nav-link, .portal-bottom-nav-item').forEach((link) => {
      link.classList.toggle('active', link.dataset.nav === sectionId);
    });

    if (pageHeaders[sectionId]) {
      opsPageTitle.textContent = pageHeaders[sectionId].title;
      opsPageSubtitle.textContent = pageHeaders[sectionId].sub;
    }

    if (opsSidebar) opsSidebar.classList.remove('open');
  }

  document.querySelectorAll('.ops-nav-link, .portal-bottom-nav-item').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const nav = link.dataset.nav;
      window.location.hash = nav;
      switchSection(nav);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    switchSection(hash);
  });

  // ==========================================
  // 5. MODALS ENGINE
  // ==========================================
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalEl) {
    if (!modalEl) modalEl = document.querySelector('.ops-modal.is-open');
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', () => {
      closeModal(el.closest('.ops-modal'));
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Button Triggers for Modals
  const topOnboardBtn = document.getElementById('topOnboardBtn');
  const qaAddClientBtn = document.getElementById('qaAddClientBtn');
  const openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
  [topOnboardBtn, qaAddClientBtn, openAddClientModalBtn].forEach((btn) => {
    if (btn) btn.addEventListener('click', () => openModal('modalAddClient'));
  });

  const qaCreateCaseBtn = document.getElementById('qaCreateCaseBtn');
  const openCreateCaseModalBtn = document.getElementById('openCreateCaseModalBtn');
  [qaCreateCaseBtn, openCreateCaseModalBtn].forEach((btn) => {
    if (btn) btn.addEventListener('click', () => openModal('modalCreateCase'));
  });

  const qaUploadDocBtn = document.getElementById('qaUploadDocBtn');
  const openUploadDocModalBtn = document.getElementById('openUploadDocModalBtn');
  [qaUploadDocBtn, openUploadDocModalBtn].forEach((btn) => {
    if (btn) btn.addEventListener('click', () => openModal('modalUploadDoc'));
  });

  // ==========================================
  // 6. DATA FETCHERS & RENDERERS
  // ==========================================
  async function loadAllData() {
    await Promise.allSettled([
      loadStats(),
      loadClients(),
      loadCases(),
      loadDocuments(),
      loadTickets()
    ]);
  }

  // A. Stats
  async function loadStats() {
    try {
      const data = await apiRequest('/api/portal/ops/stats');
      if (data && data.stats) {
        const s = data.stats;
        const totalClientsEl = document.getElementById('kpiTotalClients');
        const activeCasesEl = document.getElementById('kpiActiveCases');
        const completedCasesEl = document.getElementById('kpiCompletedCases');
        const openTicketsEl = document.getElementById('kpiOpenTickets');

        if (totalClientsEl) totalClientsEl.textContent = s.totalClients || 0;
        if (activeCasesEl) activeCasesEl.textContent = s.activeCases || 0;
        if (completedCasesEl) completedCasesEl.textContent = s.completedCases || 0;
        if (openTicketsEl) openTicketsEl.textContent = s.openTickets || 0;

        const navClientsBadge = document.getElementById('navClientsBadge');
        const navCasesBadge = document.getElementById('navCasesBadge');
        const navDocsBadge = document.getElementById('navDocsBadge');
        const navTicketsBadge = document.getElementById('navTicketsBadge');

        const bClients = document.getElementById('bottomNavClientsBadge');
        const bCases = document.getElementById('bottomNavCasesBadge');
        const bDocs = document.getElementById('bottomNavOpsDocsBadge');
        const bTickets = document.getElementById('bottomNavOpsTicketsBadge');

        if (navClientsBadge) navClientsBadge.textContent = s.totalClients || 0;
        if (navCasesBadge) navCasesBadge.textContent = s.totalCases || 0;
        if (navDocsBadge) navDocsBadge.textContent = s.totalDocs || 0;
        if (navTicketsBadge) navTicketsBadge.textContent = s.openTickets || 0;

        if (bClients) { bClients.textContent = s.totalClients || 0; bClients.style.display = s.totalClients > 0 ? 'block' : 'none'; }
        if (bCases) { bCases.textContent = s.totalCases || 0; bCases.style.display = s.totalCases > 0 ? 'block' : 'none'; }
        if (bDocs) { bDocs.textContent = s.totalDocs || 0; bDocs.style.display = s.totalDocs > 0 ? 'block' : 'none'; }
        if (bTickets) { bTickets.textContent = s.openTickets || 0; bTickets.style.display = s.openTickets > 0 ? 'block' : 'none'; }
      }
    } catch (e) {
      console.warn('Error loading stats:', e);
    }
  }

  // B. Clients
  async function loadClients() {
    try {
      const data = await apiRequest('/api/portal/ops/clients');
      cachedClients = data.clients || [];
      renderClientsTable(cachedClients);
      populateClientSelects();
    } catch (e) {
      console.warn('Error loading clients:', e);
    }
  }

  function renderClientsTable(clients) {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;
    if (clients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="ops-td-empty">No clients found. Click "+ Add New Client" to onboard.</td></tr>';
      return;
    }

    tbody.innerHTML = clients
      .map((c) => {
        const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
        const status = c.status || 'active';
        let statusBadge = '<span class="ops-badge ops-badge-active">🟢 Active</span>';
        if (status === 'pending') {
          statusBadge = '<span class="ops-badge ops-badge-pending">🟡 Pending</span>';
        } else if (status === 'suspended') {
          statusBadge = '<span class="ops-badge ops-badge-suspended">🟠 Suspended</span>';
        } else if (status === 'inactive') {
          statusBadge = '<span class="ops-badge ops-badge-inactive">⚪ Inactive</span>';
        }

        return `
          <tr data-client-row-id="${c.id}">
            <td><strong>${escapeHtml(c.companyName || c.name)}</strong></td>
            <td>${escapeHtml(c.name)}</td>
            <td><a href="mailto:${escapeHtml(c.email)}" class="ops-link">${escapeHtml(c.email)}</a></td>
            <td>${escapeHtml(c.phone || '—')}</td>
            <td>${statusBadge}</td>
            <td>${dateStr}</td>
            <td style="white-space:nowrap;">
              <button type="button" class="ops-btn ops-btn-update ops-btn-sm btn-update-client" data-client-id="${c.id}" title="Update status, documents, or manage client">
                ✏️ Update
              </button>
              <button type="button" class="ops-btn ops-btn-secondary ops-btn-sm btn-quick-case" data-client-id="${c.id}" data-client-name="${escapeHtml(c.name)}" data-company-name="${escapeHtml(c.companyName || c.name)}" title="Start service for this client">
                + Service
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Wire quick case buttons
    tbody.querySelectorAll('.btn-quick-case').forEach((btn) => {
      btn.addEventListener('click', () => {
        const clientId = btn.dataset.clientId;
        const select = document.getElementById('caseClientSelect');
        if (select) select.value = clientId;
        openModal('modalCreateCase');
      });
    });

    // Wire update client buttons
    tbody.querySelectorAll('.btn-update-client').forEach((btn) => {
      btn.addEventListener('click', () => {
        const clientId = btn.dataset.clientId;
        openUpdateClientModal(clientId);
      });
    });
  }

  let activeEditingClientId = null;
  let activeEditingClientDocs = [];

  async function openUpdateClientModal(clientId) {
    const client = cachedClients.find((c) => c.id === clientId);
    if (!client) {
      showToast('Client not found', 'error');
      return;
    }
    activeEditingClientId = clientId;

    const titleEl = document.getElementById('updateClientModalTitle');
    const subEl = document.getElementById('updateClientModalSub');
    if (titleEl) titleEl.textContent = `Manage: ${client.companyName || client.name}`;
    if (subEl) subEl.textContent = `Director: ${client.name} • Email: ${client.email}`;

    const idInput = document.getElementById('updateClientId');
    const compInput = document.getElementById('updateClientCompanyName');
    const nameInput = document.getElementById('updateClientDirectorName');
    const emailInput = document.getElementById('updateClientEmail');
    const phoneInput = document.getElementById('updateClientPhone');
    const statusSelect = document.getElementById('updateClientStatus');
    const dangerName = document.getElementById('dangerClientName');

    if (idInput) idInput.value = client.id;
    if (compInput) compInput.value = client.companyName || client.name;
    if (nameInput) nameInput.value = client.name;
    if (emailInput) emailInput.value = client.email;
    if (phoneInput) phoneInput.value = client.phone || '';
    if (statusSelect) statusSelect.value = client.status || 'active';
    if (dangerName) dangerName.textContent = client.companyName || client.name;

    // Reset to tab 1
    switchUpdateClientTab('tabClientOverview');

    // Load documents for this client
    loadAndRenderClientDocs(clientId);

    openModal('modalUpdateClient');
  }

  function switchUpdateClientTab(tabId) {
    document.querySelectorAll('#updateClientTabs .ops-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });
    document.querySelectorAll('.update-client-tab-content').forEach((c) => {
      c.style.display = c.id === tabId ? 'block' : 'none';
    });
  }

  async function loadAndRenderClientDocs(clientId) {
    const docsTbody = document.getElementById('clientDocsTableBody');
    const docsCountEl = document.getElementById('clientDocsCount');
    if (docsTbody) docsTbody.innerHTML = '<tr><td colspan="5" class="ops-td-empty">Loading documents...</td></tr>';

    try {
      const res = await apiRequest(`/api/portal/ops/clients/${clientId}/documents`);
      activeEditingClientDocs = res.documents || [];
      if (docsCountEl) docsCountEl.textContent = activeEditingClientDocs.length;

      if (!docsTbody) return;
      if (activeEditingClientDocs.length === 0) {
        docsTbody.innerHTML = '<tr><td colspan="5" class="ops-td-empty">No documents found for this client yet.</td></tr>';
        return;
      }

      docsTbody.innerHTML = activeEditingClientDocs
        .map((d) => {
          const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
          let statusBadge = '<span class="ops-badge ops-badge-active">Approved</span>';
          if (d.status === 'revoked') {
            statusBadge = '<span class="ops-badge ops-badge-revoked">⚠️ Revoked</span>';
          } else if (d.status === 'pending_verification') {
            statusBadge = '<span class="ops-badge ops-badge-pending">Pending</span>';
          } else if (d.status === 'rejected') {
            statusBadge = '<span class="ops-badge ops-badge-revoked">Rejected</span>';
          }

          const docIdentifier = d.docId || d.id;

          return `
            <tr>
              <td>
                <div style="font-weight:600; font-size:13px; color:var(--ops-text);">${escapeHtml(d.title)}</div>
                <div style="font-size:11px; color:var(--ops-text-muted); font-family:monospace;">${escapeHtml(d.fileName || '')} (${escapeHtml(d.fileSize || '')})</div>
              </td>
              <td><span class="ops-tag">${escapeHtml(d.category || 'certificate')}</span></td>
              <td>${statusBadge}</td>
              <td style="font-size:12px;">${dateStr}</td>
              <td style="white-space:nowrap;">
                <div style="display:flex; gap:6px; align-items:center;">
                  <a href="${escapeHtml(d.fileUrl)}" target="_blank" class="ops-btn ops-btn-sm ops-btn-secondary" title="View or Download Document">
                    👁️ View
                  </a>
                  <button type="button" class="ops-btn-remove btn-remove-single-doc" data-doc-id="${docIdentifier}" title="Delete document permanently from database">
                    🗑️ Remove
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');

      // Wire remove buttons
      docsTbody.querySelectorAll('.btn-remove-single-doc').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const docId = btn.dataset.docId;
          if (!confirm('Are you sure you want to permanently delete this document? This cannot be undone.')) {
            return;
          }
          try {
            btn.disabled = true;
            btn.textContent = 'Removing...';
            const res = await apiRequest(`/api/portal/ops/documents/${docId}`, {
              method: 'DELETE'
            });
            showToast(res.message || 'Document deleted permanently', 'success');
            loadAndRenderClientDocs(clientId);
            loadDocuments();
          } catch (err) {
            showToast(err.message || 'Failed to delete document', 'error');
            btn.disabled = false;
            btn.textContent = '🗑️ Remove';
          }
        });
      });

    } catch (err) {
      console.warn('Error loading client documents:', err);
      if (docsTbody) docsTbody.innerHTML = `<tr><td colspan="5" class="ops-td-empty" style="color:#ef4444;">Failed to load documents: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  function populateClientSelects() {
    const caseSelect = document.getElementById('caseClientSelect');
    const docSelect = document.getElementById('uploadClientSelect');

    const optionsHtml = '<option value="">-- Choose Client --</option>' +
      cachedClients
        .map((c) => `<option value="${c.id}">${escapeHtml(c.companyName || c.name)} (${escapeHtml(c.name)})</option>`)
        .join('');

    if (caseSelect) caseSelect.innerHTML = optionsHtml;
    if (docSelect) docSelect.innerHTML = optionsHtml;
  }

  // Filter clients search
  const clientFilterSearch = document.getElementById('clientFilterSearch');
  if (clientFilterSearch) {
    clientFilterSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = cachedClients.filter(
        (c) =>
          (c.companyName && c.companyName.toLowerCase().includes(q)) ||
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
      renderClientsTable(filtered);
    });
  }

  // Onboard Client Form Submit
  const formAddClient = document.getElementById('formAddClient');
  if (formAddClient) {
    formAddClient.addEventListener('submit', async (e) => {
      e.preventDefault();
      const companyName = document.getElementById('newCompanyName').value.trim();
      const name = document.getElementById('newDirectorName').value.trim();
      const phone = document.getElementById('newPhone').value.trim();
      const email = document.getElementById('newEmail').value.trim();
      const password = document.getElementById('newPassword').value.trim();
      const initialService = document.getElementById('newInitialService').value;

      try {
        const res = await apiRequest('/api/portal/ops/clients', {
          method: 'POST',
          body: JSON.stringify({ companyName, name, phone, email, password, initialService })
        });
        showToast('Client successfully onboarded!', 'success');
        closeModal();
        formAddClient.reset();
        loadClients();
        loadCases();
        loadStats();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // C. Cases & Services
  async function loadCases(statusFilter = '') {
    try {
      currentCaseFilter = statusFilter;
      const url = statusFilter ? `/api/portal/ops/cases?status=${encodeURIComponent(statusFilter)}` : '/api/portal/ops/cases';
      const data = await apiRequest(url);
      cachedCases = data.cases || [];
      renderCasesTable(cachedCases);
      renderDashboardCases(cachedCases.slice(0, 5));
      populateCaseSelectForDocs();
    } catch (e) {
      console.warn('Error loading cases:', e);
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'approved':
        return '<span class="ops-badge ops-badge-approved">🟢 Completed</span>';
      case 'in_review':
        return '<span class="ops-badge ops-badge-review">🟡 In Progress</span>';
      case 'rejected':
        return '<span class="ops-badge ops-badge-rejected">🔴 Needs Attention</span>';
      case 'pending_documents':
        return '<span class="ops-badge ops-badge-pending">⚪ Waiting for Client</span>';
      default:
        return `<span class="ops-badge ops-badge-pending">${escapeHtml(status)}</span>`;
    }
  }

  function renderDashboardCases(cases) {
    const tbody = document.getElementById('dashCasesBody');
    if (!tbody) return;
    if (cases.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="ops-td-empty">No active services yet. Click "+ Start New Service" above.</td></tr>';
      return;
    }

    tbody.innerHTML = cases
      .map((c) => `
        <tr>
          <td><code>${escapeHtml(c.caseId)}</code></td>
          <td><strong>${escapeHtml(c.companyName || c.clientName)}</strong></td>
          <td>${escapeHtml(c.serviceName)}</td>
          <td>${getStatusBadge(c.status)}</td>
          <td>
            <button type="button" class="ops-btn ops-btn-secondary ops-btn-sm btn-dash-update-case"
              data-case-id="${c.caseId}"
              data-service="${escapeHtml(c.serviceName)}"
              data-company="${escapeHtml(c.companyName || c.clientName)}"
              data-status="${c.status}"
              data-note="${escapeHtml(c.statusNote || '')}">
              Update
            </button>
          </td>
        </tr>
      `)
      .join('');

    tbody.querySelectorAll('.btn-dash-update-case').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById('updateCaseId').value = btn.dataset.caseId;
        document.getElementById('updateCaseInfo').textContent = `${btn.dataset.caseId} — ${btn.dataset.company} (${btn.dataset.service})`;
        document.getElementById('updateCaseStatusSelect').value = btn.dataset.status;
        document.getElementById('updateCaseNote').value = btn.dataset.note;
        openModal('modalUpdateCase');
      });
    });
  }

  function renderCasesTable(cases) {
    const tbody = document.getElementById('casesTableBody');
    if (!tbody) return;
    if (cases.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="ops-td-empty">No service cases found.</td></tr>';
      return;
    }

    tbody.innerHTML = cases
      .map((c) => {
        const updatedStr = c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
        return `
          <tr>
            <td><code>${escapeHtml(c.caseId)}</code></td>
            <td><strong>${escapeHtml(c.companyName)}</strong></td>
            <td>${escapeHtml(c.serviceName)}</td>
            <td>${getStatusBadge(c.status)}</td>
            <td style="max-width:240px; font-size:12px; color:var(--ops-text-muted);">${escapeHtml(c.statusNote || '—')}</td>
            <td>📁 ${c.documentsCount || 0}</td>
            <td>${updatedStr}</td>
            <td>
              <div style="display:flex; gap:6px;">
                <button type="button" class="ops-btn ops-btn-primary ops-btn-sm btn-update-case" 
                  data-case-id="${c.caseId}" 
                  data-service="${escapeHtml(c.serviceName)}" 
                  data-company="${escapeHtml(c.companyName)}"
                  data-status="${c.status}"
                  data-note="${escapeHtml(c.statusNote || '')}">
                  Update
                </button>
                <button type="button" class="ops-btn ops-btn-secondary ops-btn-sm btn-upload-for-case"
                  data-client-id="${c.clientId}"
                  data-case-id="${c.caseId}">
                  + Doc
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    // Wire Update Case Buttons
    tbody.querySelectorAll('.btn-update-case').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById('updateCaseId').value = btn.dataset.caseId;
        document.getElementById('updateCaseInfo').textContent = `${btn.dataset.caseId} — ${btn.dataset.company} (${btn.dataset.service})`;
        document.getElementById('updateCaseStatusSelect').value = btn.dataset.status;
        document.getElementById('updateCaseNote').value = btn.dataset.note;
        openModal('modalUpdateCase');
      });
    });

    // Wire Upload For Case Buttons
    tbody.querySelectorAll('.btn-upload-for-case').forEach((btn) => {
      btn.addEventListener('click', () => {
        const clientSelect = document.getElementById('uploadClientSelect');
        const caseSelect = document.getElementById('uploadCaseSelect');
        if (clientSelect) clientSelect.value = btn.dataset.clientId;
        populateCaseSelectForDocs(btn.dataset.clientId);
        if (caseSelect) caseSelect.value = btn.dataset.caseId;
        openModal('modalUploadDoc');
      });
    });
  }

  // Tabs for Cases Status Filter
  const caseTabs = document.querySelectorAll('#caseStatusTabs .ops-tab');
  caseTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      caseTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      loadCases(tab.dataset.status);
    });
  });

  // Update Case Form Submit
  const formUpdateCase = document.getElementById('formUpdateCase');
  if (formUpdateCase) {
    formUpdateCase.addEventListener('submit', async (e) => {
      e.preventDefault();
      const caseId = document.getElementById('updateCaseId').value;
      const status = document.getElementById('updateCaseStatusSelect').value;
      const note = document.getElementById('updateCaseNote').value.trim();

      try {
        await apiRequest(`/api/portal/ops/cases/${caseId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status, note })
        });
        showToast(`Case ${caseId} status updated to ${status}!`, 'success');
        closeModal();
        loadCases(currentCaseFilter);
        loadStats();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Create Case Form Submit
  const formCreateCase = document.getElementById('formCreateCase');
  if (formCreateCase) {
    formCreateCase.addEventListener('submit', async (e) => {
      e.preventDefault();
      const clientId = document.getElementById('caseClientSelect').value;
      const serviceName = document.getElementById('caseServiceName').value;
      const status = document.getElementById('caseInitialStatus').value;
      const statusNote = document.getElementById('caseInitialNote').value.trim();

      const client = cachedClients.find((c) => c.id === clientId);
      if (!client) {
        showToast('Please select a valid client', 'error');
        return;
      }

      try {
        await apiRequest('/api/portal/ops/cases', {
          method: 'POST',
          body: JSON.stringify({
            clientId: client.id,
            clientName: client.name,
            companyName: client.companyName || client.name,
            serviceName,
            status,
            statusNote
          })
        });
        showToast('Service case opened successfully!', 'success');
        closeModal();
        formCreateCase.reset();
        loadCases(currentCaseFilter);
        loadStats();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // D. Documents
  async function loadDocuments() {
    try {
      const data = await apiRequest('/api/portal/ops/documents');
      renderDocumentsTable(data.documents || []);
    } catch (e) {
      console.warn('Error loading documents:', e);
    }
  }

  function renderDocumentsTable(docs) {
    const tbody = document.getElementById('documentsTableBody');
    if (!tbody) return;
    if (docs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="ops-td-empty">No documents uploaded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = docs
      .map((d) => {
        const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
        return `
          <tr>
            <td><code>${escapeHtml(d.docId)}</code></td>
            <td><strong>${escapeHtml(d.companyName || 'General')}</strong></td>
            <td>${escapeHtml(d.title)}</td>
            <td><span class="ops-badge ops-badge-purple">${escapeHtml(d.category)}</span></td>
            <td style="font-size:12px; color:var(--ops-text-muted);">${escapeHtml(d.fileName)}</td>
            <td>${escapeHtml(d.fileSize)}</td>
            <td>${dateStr}</td>
            <td>
              <div style="display:flex; gap:6px; align-items:center;">
                <button type="button" class="ops-btn ops-btn-secondary ops-btn-sm btn-preview-doc" data-doc-id="${escapeHtml(d.docId)}" title="Preview document">
                  👁 Preview
                </button>
                <a href="${escapeHtml(d.fileUrl)}" target="_blank" download class="ops-btn ops-btn-outline ops-btn-sm" title="Download to device" style="text-decoration:none;">
                  ⬇ Download
                </a>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    // Wire preview buttons
    tbody.querySelectorAll('.btn-preview-doc').forEach((btn) => {
      btn.addEventListener('click', () => {
        const docId = btn.dataset.docId;
        const doc = docs.find((x) => x.docId === docId);
        if (doc) openDocPreview(doc);
      });
    });
  }

  function openDocPreview(doc) {
    const titleEl = document.getElementById('docPreviewTitle');
    const catEl = document.getElementById('docPreviewCategory');
    const nameEl = document.getElementById('docPreviewFileName');
    const newTabEl = document.getElementById('docPreviewNewTab');
    const dlEl = document.getElementById('docPreviewDownload');
    const bodyEl = document.getElementById('docPreviewBody');

    if (titleEl) titleEl.textContent = doc.title || 'Document Preview';
    if (catEl) catEl.textContent = doc.category || 'document';
    if (nameEl) nameEl.textContent = `${doc.fileName || 'file'} (${doc.fileSize || ''})`;
    if (newTabEl) newTabEl.href = doc.fileUrl;
    if (dlEl) {
      dlEl.href = doc.fileUrl;
      dlEl.setAttribute('download', doc.fileName || 'download');
    }

    if (!bodyEl) return;
    bodyEl.innerHTML = '';

    const url = doc.fileUrl || '';
    const ext = (url.split('.').pop() || '').toLowerCase();
    const mime = (doc.fileType || '').toLowerCase();

    if (ext === 'pdf' || mime.includes('pdf')) {
      bodyEl.innerHTML = `
        <iframe src="${escapeHtml(url)}#toolbar=1" type="application/pdf" title="PDF Document Viewer">
          <p class="ops-preview-fallback">Your browser cannot render this PDF inline. <a href="${escapeHtml(url)}" target="_blank" style="color:#60a5fa;">Click here to open or download</a>.</p>
        </iframe>
      `;
    } else if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext) || mime.startsWith('image/')) {
      bodyEl.innerHTML = `
        <img src="${escapeHtml(url)}" alt="${escapeHtml(doc.title || 'Document Preview')}" />
      `;
    } else {
      bodyEl.innerHTML = `
        <div class="ops-preview-fallback">
          <div class="ops-preview-fallback-icon">📄</div>
          <h4 style="font-size:16px; margin-bottom:8px;">${escapeHtml(doc.fileName || 'File Preview')}</h4>
          <p style="font-size:13px; color:#94a3b8; max-width:400px; margin:0 auto 18px;">
            Inline preview is not supported for .${escapeHtml(ext)} files. You can open or download the file directly.
          </p>
          <div style="display:flex; justify-content:center; gap:12px;">
            <a href="${escapeHtml(url)}" target="_blank" class="ops-btn ops-btn-secondary ops-btn-sm" style="text-decoration:none;">↗ Open File</a>
            <a href="${escapeHtml(url)}" download class="ops-btn ops-btn-primary ops-btn-sm" style="text-decoration:none;">⬇ Download File</a>
          </div>
        </div>
      `;
    }

    openModal('modalDocPreview');
  }

  function populateCaseSelectForDocs(selectedClientId = '') {
    const caseSelect = document.getElementById('uploadCaseSelect');
    if (!caseSelect) return;
    let relevantCases = cachedCases;
    if (selectedClientId) {
      relevantCases = cachedCases.filter((c) => c.clientId === selectedClientId);
    }

    caseSelect.innerHTML = '<option value="">-- General Document (No specific case) --</option>' +
      relevantCases
        .map((c) => `<option value="${c.caseId}">${escapeHtml(c.caseId)} - ${escapeHtml(c.serviceName)} (${escapeHtml(c.companyName)})</option>`)
        .join('');
  }

  const uploadClientSelect = document.getElementById('uploadClientSelect');
  if (uploadClientSelect) {
    uploadClientSelect.addEventListener('change', (e) => {
      populateCaseSelectForDocs(e.target.value);
    });
  }

  // Upload Document Form Submit
  const formUploadDoc = document.getElementById('formUploadDoc');
  if (formUploadDoc) {
    formUploadDoc.addEventListener('submit', async (e) => {
      e.preventDefault();
      const clientId = document.getElementById('uploadClientSelect').value;
      const caseId = document.getElementById('uploadCaseSelect').value;
      const title = document.getElementById('uploadDocTitle').value.trim();
      const category = document.getElementById('uploadDocCategory').value;
      const fileInput = document.getElementById('uploadFileInput');

      if (!fileInput.files || fileInput.files.length === 0) {
        showToast('Please select a file to upload', 'error');
        return;
      }

      const client = cachedClients.find((c) => c.id === clientId);
      const companyName = client ? (client.companyName || client.name) : '';
      const autoApprove = document.getElementById('uploadAutoApprove')?.checked !== false;

      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('clientId', clientId);
      formData.append('companyName', companyName);
      formData.append('caseId', caseId);
      formData.append('title', title);
      formData.append('category', category);
      formData.append('autoApprove', autoApprove ? 'true' : 'false');

      const submitBtn = document.getElementById('btnSubmitUpload');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading...';

      try {
        await apiRequest('/api/portal/ops/documents/upload', {
          method: 'POST',
          body: formData
        });
        showToast('Document uploaded and delivered to client!', 'success');
        closeModal();
        formUploadDoc.reset();
        loadDocuments();
        loadCases();
        loadStats();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload & Deliver to Client';
      }
    });
  }

  // E. Support & Help Messages
  async function loadTickets() {
    try {
      const data = await apiRequest('/api/portal/ops/tickets');
      const tickets = data.tickets || [];
      renderTicketsTable(tickets);
      renderDashboardTickets(tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').slice(0, 5));
    } catch (e) {
      console.warn('Error loading tickets:', e);
    }
  }

  function renderTicketsTable(tickets) {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) return;
    if (tickets.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="ops-td-empty">No support tickets found.</td></tr>';
      return;
    }

    tbody.innerHTML = tickets
      .map((t) => {
        const lastMsg = t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1].text : '—';
        const isResolved = t.status === 'resolved';
        return `
          <tr>
            <td><code>${escapeHtml(t.ticketId)}</code></td>
            <td><strong>${escapeHtml(t.companyName || t.clientName)}</strong></td>
            <td><strong>${escapeHtml(t.subject)}</strong></td>
            <td><span class="ops-badge ops-badge-pending">${escapeHtml(t.category)}</span></td>
            <td>${t.priority === 'high' ? '<span class="ops-badge ops-badge-rejected">High</span>' : '<span class="ops-badge ops-badge-pending">' + t.priority + '</span>'}</td>
            <td>${isResolved ? '<span class="ops-badge ops-badge-approved">🟢 Resolved</span>' : '<span class="ops-badge ops-badge-review">🟡 Open</span>'}</td>
            <td style="max-width:200px; font-size:12px; color:var(--ops-text-muted);">${escapeHtml(lastMsg)}</td>
            <td>
              <button type="button" class="ops-btn ops-btn-primary ops-btn-sm btn-view-ticket" data-ticket='${JSON.stringify(t).replace(/'/g, "&apos;")}'>
                Reply / View
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('.btn-view-ticket').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ticket = JSON.parse(btn.dataset.ticket);
        openTicketModal(ticket);
      });
    });
  }

  function renderDashboardTickets(tickets) {
    const tbody = document.getElementById('dashTicketsBody');
    if (!tbody) return;
    if (tickets.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="ops-td-empty">No pending tickets requiring attention.</td></tr>';
      return;
    }

    tbody.innerHTML = tickets
      .map((t) => {
        return `
          <tr>
            <td><code>${escapeHtml(t.ticketId)}</code></td>
            <td><strong>${escapeHtml(t.companyName || t.clientName)}</strong></td>
            <td>${escapeHtml(t.subject)}</td>
            <td>${t.priority === 'high' ? '<span class="ops-badge ops-badge-rejected">High</span>' : '<span class="ops-badge ops-badge-review">Normal</span>'}</td>
            <td>
              <button type="button" class="ops-btn ops-btn-secondary ops-btn-sm btn-view-ticket" data-ticket='${JSON.stringify(t).replace(/'/g, "&apos;")}'>
                Reply
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('.btn-view-ticket').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ticket = JSON.parse(btn.dataset.ticket);
        openTicketModal(ticket);
      });
    });
  }

  function openTicketModal(ticket) {
    document.getElementById('replyTicketId').value = ticket.ticketId;
    document.getElementById('ticketModalTitle').textContent = `${ticket.ticketId}: ${ticket.subject}`;
    document.getElementById('ticketModalSubtitle').textContent = `${ticket.companyName || ticket.clientName} • Category: ${ticket.category.toUpperCase()}`;
    document.getElementById('ticketNewStatus').value = ticket.status === 'resolved' ? 'resolved' : 'in_progress';

    const container = document.getElementById('ticketMessagesContainer');
    container.innerHTML = (ticket.messages || [])
      .map((m) => {
        const isOps = m.sender === 'operations';
        const dateStr = m.date ? new Date(m.date).toLocaleString('en-IN') : '';
        return `
          <div class="ops-msg-bubble ${isOps ? 'ops-msg-ops' : 'ops-msg-client'}">
            <div class="ops-msg-meta">${escapeHtml(m.senderName || (isOps ? 'Staff' : 'Client'))} • ${dateStr}</div>
            <div>${escapeHtml(m.text)}</div>
          </div>
        `;
      })
      .join('');

    openModal('modalViewTicket');
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 100);
  }

  // Reply Ticket Form Submit
  const formReplyTicket = document.getElementById('formReplyTicket');
  if (formReplyTicket) {
    formReplyTicket.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ticketId = document.getElementById('replyTicketId').value;
      const message = document.getElementById('ticketReplyText').value.trim();
      const status = document.getElementById('ticketNewStatus').value;

      try {
        await apiRequest(`/api/portal/ops/tickets/${ticketId}/reply`, {
          method: 'POST',
          body: JSON.stringify({ message, status })
        });
        showToast('Reply dispatched to client!', 'success');
        closeModal();
        formReplyTicket.reset();
        loadTickets();
        loadStats();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Helper Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================
  // PWA APP DOWNLOAD SUGGESTION & SERVICE WORKER
  // ==========================================
  let deferredOpsInstallPrompt = null;
  function initPwa() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.log('Ops SW registration skipped:', err);
        });
      });
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const hasBeenSuggested = localStorage.getItem('cm_ops_pwa_suggested') === 'true';
    const suggestBanner = document.getElementById('opsPwaSuggestBanner');
    const btnInstall = document.getElementById('btnOpsPwaSuggestInstall');
    const btnDismiss = document.getElementById('btnOpsPwaSuggestDismiss');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredOpsInstallPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      deferredOpsInstallPrompt = null;
      localStorage.setItem('cm_ops_pwa_suggested', 'true');
      if (suggestBanner) suggestBanner.style.display = 'none';
      showToast('Operations Desk installed as an app!', 'success');
    });

    // If already running inside standalone app or user has already interacted, do not show
    if (isStandalone || hasBeenSuggested || !suggestBanner) {
      return;
    }

    // Show suggestion banner after 1.5s delay
    setTimeout(() => {
      if (!localStorage.getItem('cm_ops_pwa_suggested') && !isStandalone) {
        suggestBanner.style.display = 'flex';
      }
    }, 1500);

    function dismissSuggestion() {
      localStorage.setItem('cm_ops_pwa_suggested', 'true');
      if (suggestBanner) {
        suggestBanner.style.opacity = '0';
        suggestBanner.style.transform = 'translateY(20px)';
        suggestBanner.style.transition = 'all 0.3s ease';
        setTimeout(() => { suggestBanner.style.display = 'none'; }, 300);
      }
    }

    if (btnInstall) {
      btnInstall.addEventListener('click', async () => {
        dismissSuggestion();
        if (deferredOpsInstallPrompt) {
          deferredOpsInstallPrompt.prompt();
          const choice = await deferredOpsInstallPrompt.userChoice;
          if (choice.outcome === 'accepted') {
            showToast('Corporate Mart Operations installed successfully!', 'success');
          }
          deferredOpsInstallPrompt = null;
        } else {
          showToast('To install, use the Install icon (⊕ / 💻) in your browser address bar or menu.', 'info');
        }
      });
    }

    if (btnDismiss) {
      btnDismiss.addEventListener('click', () => {
        dismissSuggestion();
      });
    }
  }

  // ==========================================
  // UPDATE CLIENT SUITE EVENT LISTENERS
  // ==========================================
  function initUpdateClientSuite() {
    // Tab switching in modal
    const tabsContainer = document.getElementById('updateClientTabs');
    if (tabsContainer) {
      tabsContainer.querySelectorAll('.ops-tab').forEach((tabBtn) => {
        tabBtn.addEventListener('click', () => {
          const tabId = tabBtn.dataset.tab;
          if (tabId) switchUpdateClientTab(tabId);
        });
      });
    }

    // Form Update Client Details Submit
    const formUpdateClientDetails = document.getElementById('formUpdateClientDetails');
    if (formUpdateClientDetails) {
      formUpdateClientDetails.addEventListener('submit', async (e) => {
        e.preventDefault();
        const clientId = document.getElementById('updateClientId').value;
        const companyName = document.getElementById('updateClientCompanyName').value.trim();
        const name = document.getElementById('updateClientDirectorName').value.trim();
        const email = document.getElementById('updateClientEmail').value.trim().toLowerCase();
        const phone = document.getElementById('updateClientPhone').value.trim();
        const status = document.getElementById('updateClientStatus').value;
        const btnSave = document.getElementById('btnSaveClientStatus');
        const msgEl = document.getElementById('updateClientMsg');

        try {
          if (btnSave) {
            btnSave.disabled = true;
            btnSave.textContent = 'Saving...';
          }
          const res = await apiRequest(`/api/portal/ops/clients/${clientId}`, {
            method: 'PUT',
            body: JSON.stringify({ companyName, name, email, phone, status })
          });

          showToast('Client updated successfully!', 'success');
          if (msgEl) {
            msgEl.textContent = 'Client details and status saved successfully!';
            msgEl.style.display = 'block';
            msgEl.style.background = 'rgba(16, 185, 129, 0.15)';
            msgEl.style.color = '#10b981';
            setTimeout(() => {
              if (msgEl) msgEl.style.display = 'none';
            }, 3000);
          }

          // Refresh clients in state and UI
          loadClients();
        } catch (err) {
          showToast(err.message || 'Failed to update client', 'error');
          if (msgEl) {
            msgEl.textContent = err.message || 'Update failed';
            msgEl.style.display = 'block';
            msgEl.style.background = 'rgba(239, 68, 68, 0.15)';
            msgEl.style.color = '#ef4444';
          }
        } finally {
          if (btnSave) {
            btnSave.disabled = false;
            btnSave.textContent = 'Save Status & Info';
          }
        }
      });
    }

    // Button: Open Upload For This Client
    const btnOpenUploadForThisClient = document.getElementById('btnOpenUploadForThisClient');
    if (btnOpenUploadForThisClient) {
      btnOpenUploadForThisClient.addEventListener('click', () => {
        const uploadSelect = document.getElementById('uploadClientSelect');
        if (uploadSelect && activeEditingClientId) {
          uploadSelect.value = activeEditingClientId;
          uploadSelect.dispatchEvent(new Event('change'));
        }
        closeModal();
        openModal('modalUploadDoc');
      });
    }

    // Button: Delete Client Account
    const btnDeleteClientAccount = document.getElementById('btnDeleteClientAccount');
    if (btnDeleteClientAccount) {
      btnDeleteClientAccount.addEventListener('click', async () => {
        const clientId = document.getElementById('updateClientId').value;
        const compName = document.getElementById('updateClientCompanyName').value || 'this client';
        if (!confirm(`Are you sure you want to PERMANENTLY DELETE client "${compName}"?\n\nThis will remove their portal login, service records, and documents. This action cannot be reversed.`)) {
          return;
        }

        try {
          btnDeleteClientAccount.disabled = true;
          btnDeleteClientAccount.textContent = 'Deleting Client...';
          const res = await apiRequest(`/api/portal/ops/clients/${clientId}`, {
            method: 'DELETE'
          });
          showToast(res.message || 'Client account deleted successfully', 'success');
          closeModal();
          loadClients();
          loadStats();
          loadCases();
          loadDocuments();
        } catch (err) {
          showToast(err.message || 'Failed to delete client', 'error');
          btnDeleteClientAccount.disabled = false;
          btnDeleteClientAccount.textContent = '🗑️ Delete Client Permanently';
        }
      });
    }
  }

  // ==========================================
  // 7. INITIALIZATION
  // ==========================================
  initTheme();
  initMobileMenu();
  initPwa();
  initUpdateClientSuite();

  const initialHash = window.location.hash.replace('#', '') || 'dashboard';
  switchSection(initialHash);

  checkAuth();
})();
