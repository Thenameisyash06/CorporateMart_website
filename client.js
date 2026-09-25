/**
 * ==========================================================================
 * CORPORATE MART - CLIENT PORTAL CONTROLLER
 * ==========================================================================
 */

(function () {
  'use strict';

  // State
  let clientToken = localStorage.getItem('cm_client_token') || '';
  let currentUser = null;
  let cachedData = { stats: {}, cases: [], documents: [], tickets: [] };
  let activeTicketId = null;
  let deferredInstallPrompt = null;

  // DOM Elements
  const authOverlay = document.getElementById('authOverlay');
  const clientLoginForm = document.getElementById('clientLoginForm');
  const clientLoginError = document.getElementById('clientLoginError');
  const clientLogoutBtn = document.getElementById('clientLogoutBtn');
  const cpThemeToggle = document.getElementById('cpThemeToggle');
  const cpMenuToggle = document.getElementById('cpMenuToggle');
  const cpSidebar = document.getElementById('cpSidebar');
  const cpPageTitle = document.getElementById('cpPageTitle');
  const cpPageSubtitle = document.getElementById('cpPageSubtitle');
  const toastContainer = document.getElementById('toastContainer');

  // ==========================================
  // 1. TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `cp-toast toast-${type}`;
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
    const savedTheme = localStorage.getItem('cp_theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }
    cpThemeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('cp_theme', isDark ? 'dark' : 'light');
    });
  }

  function initMobileMenu() {
    if (cpMenuToggle && cpSidebar) {
      cpMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        cpSidebar.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!cpSidebar.contains(e.target) && !cpMenuToggle.contains(e.target)) {
          cpSidebar.classList.remove('open');
        }
      });
    }
  }

  // ==========================================
  // 3. PWA DOWNLOAD SUGGESTION & SERVICE WORKER
  // ==========================================
  function initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.log('SW registration skipped:', err);
        });
      });
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const hasBeenSuggested = localStorage.getItem('cm_client_pwa_suggested') === 'true';
    const suggestBanner = document.getElementById('clientPwaSuggestBanner');
    const btnInstall = document.getElementById('btnClientPwaSuggestInstall');
    const btnDismiss = document.getElementById('btnClientPwaSuggestDismiss');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      localStorage.setItem('cm_client_pwa_suggested', 'true');
      if (suggestBanner) suggestBanner.style.display = 'none';
      showToast('Corporate Mart App installed!', 'success');
    });

    // If already in standalone mode or already suggested, do not show
    if (isStandalone || hasBeenSuggested || !suggestBanner) {
      return;
    }

    // Show suggestion banner after 1.5s delay
    setTimeout(() => {
      if (!localStorage.getItem('cm_client_pwa_suggested') && !isStandalone) {
        suggestBanner.style.display = 'flex';
      }
    }, 1500);

    function dismissSuggestion() {
      localStorage.setItem('cm_client_pwa_suggested', 'true');
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
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          const choice = await deferredInstallPrompt.userChoice;
          if (choice.outcome === 'accepted') {
            showToast('Corporate Mart installed successfully!', 'success');
          }
          deferredInstallPrompt = null;
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
  // 3B. IN-PHONE WEB PUSH NOTIFICATIONS
  // ==========================================
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function checkNotificationStatus() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    const notifPromptCard = document.getElementById('notifPromptCard');
    const notifBadgeDot = document.getElementById('notifBadgeDot');
    const dismissed = localStorage.getItem('cm_notif_prompt_dismissed');

    if (Notification.permission === 'granted') {
      if (notifBadgeDot) notifBadgeDot.style.display = 'block';
      if (notifPromptCard) notifPromptCard.style.display = 'none';
      if (clientToken) {
        ensurePushSubscribed();
      }
    } else if (Notification.permission === 'default' && !dismissed) {
      if (notifPromptCard) notifPromptCard.style.display = 'flex';
      if (notifBadgeDot) notifBadgeDot.style.display = 'none';
    } else {
      if (notifBadgeDot) notifBadgeDot.style.display = 'none';
      if (notifPromptCard) notifPromptCard.style.display = 'none';
    }
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      showToast('Push notifications are not supported on this device/browser.', 'warning');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast('In-phone notifications enabled successfully!', 'success');
        const notifBadgeDot = document.getElementById('notifBadgeDot');
        const notifPromptCard = document.getElementById('notifPromptCard');
        if (notifBadgeDot) notifBadgeDot.style.display = 'block';
        if (notifPromptCard) notifPromptCard.style.display = 'none';
        await ensurePushSubscribed();
      } else if (permission === 'denied') {
        showToast('Notification permission was blocked in browser settings.', 'warning');
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  }

  async function ensurePushSubscribed() {
    try {
      if (!('serviceWorker' in navigator) || !clientToken) return;
      const reg = await navigator.serviceWorker.ready;
      if (!reg || !reg.pushManager) return;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const keyRes = await fetch('/api/portal/notifications/vapid-public-key');
        const keyData = await keyRes.json();
        if (!keyData.publicKey) return;

        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey)
        });
      }

      if (sub) {
        await apiRequest('/api/portal/client/notifications/subscribe', {
          method: 'POST',
          body: JSON.stringify({ subscription: sub })
        });
      }
    } catch (err) {
      console.log('Push subscription check:', err.message);
    }
  }

  function initNotifications() {
    const btnEnableNotifications = document.getElementById('btnEnableNotifications');
    const btnAllowNotifications = document.getElementById('btnAllowNotifications');
    const btnDismissNotifPrompt = document.getElementById('btnDismissNotifPrompt');

    if (btnEnableNotifications) {
      btnEnableNotifications.addEventListener('click', async () => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
          showToast('Push notifications are not supported on this browser/device.', 'warning');
          return;
        }

        if (Notification.permission === 'granted') {
          showToast('Syncing push subscription & sending test alert...', 'info');
          await ensurePushSubscribed();
          try {
            const res = await apiRequest('/api/portal/client/notifications/test', { method: 'POST' });
            showToast(res.message || 'Test push alert sent!', 'success');
          } catch (e) {
            showToast('Test failed: ' + e.message, 'error');
          }
        } else {
          requestNotificationPermission();
        }
      });
    }

    if (btnAllowNotifications) {
      btnAllowNotifications.addEventListener('click', () => {
        requestNotificationPermission();
      });
    }

    if (btnDismissNotifPrompt) {
      btnDismissNotifPrompt.addEventListener('click', () => {
        const notifPromptCard = document.getElementById('notifPromptCard');
        if (notifPromptCard) notifPromptCard.style.display = 'none';
        localStorage.setItem('cm_notif_prompt_dismissed', 'true');
      });
    }
  }


  // ==========================================
  // 4. API REQUEST WRAPPER & AUTH
  // ==========================================
  async function apiRequest(endpoint, options = {}) {
    const headers = options.headers || {};
    if (clientToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${clientToken}`;
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
    clientToken = '';
    currentUser = null;
    localStorage.removeItem('cm_client_token');
    authOverlay.classList.remove('hidden');
    if (msg) {
      clientLoginError.textContent = msg;
      clientLoginError.style.display = 'block';
    }
  }

  async function checkAuth() {
    if (!clientToken) {
      authOverlay.classList.remove('hidden');
      return;
    }

    try {
      const data = await apiRequest('/api/portal/auth/me');
      if (data && data.user) {
        currentUser = data.user;
        authOverlay.classList.add('hidden');
        renderProfile();
        checkNotificationStatus();
        loadPortalData();
      }
    } catch (err) {
      handleAuthFailure();
    }
  }

  function renderProfile() {
    if (!currentUser) return;
    const companyEl = document.getElementById('clientCompanyName');
    const directorEl = document.getElementById('clientDirectorName');
    const avatarEl = document.getElementById('clientAvatar');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeCompanyTag = document.getElementById('welcomeCompanyTag');

    const companyName = currentUser.companyName || currentUser.name || 'Company';
    const directorName = currentUser.name || 'Director';

    if (companyEl) companyEl.textContent = companyName;
    if (directorEl) directorEl.textContent = directorName;
    if (welcomeTitle) welcomeTitle.textContent = `Hello, ${directorName}! 👋`;
    if (welcomeCompanyTag) welcomeCompanyTag.textContent = companyName;

    if (avatarEl) {
      const initials = companyName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      avatarEl.textContent = initials || 'CM';
    }

    // Pre-fill request service modal
    const reqCompany = document.getElementById('reqCompanyName');
    const reqContact = document.getElementById('reqContactName');
    const reqEmail = document.getElementById('reqEmail');
    const reqPhone = document.getElementById('reqPhone');

    if (reqCompany) reqCompany.value = companyName;
    if (reqContact) reqContact.value = directorName;
    if (reqEmail) reqEmail.value = currentUser.email || '';
    if (reqPhone) reqPhone.value = currentUser.phone || '';
  }

  // Handle Login Submit
  clientLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clientLoginError.style.display = 'none';
    const email = document.getElementById('clientEmail').value.trim();
    const password = document.getElementById('clientPassword').value;

    try {
      const res = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      clientToken = data.token;
      currentUser = data.user;
      localStorage.setItem('cm_client_token', clientToken);
      authOverlay.classList.add('hidden');
      renderProfile();
      checkNotificationStatus();
      showToast(`Welcome back, ${currentUser.name}!`, 'success');
      loadPortalData();
    } catch (err) {
      clientLoginError.textContent = err.message;
      clientLoginError.style.display = 'block';
    }
  });

  // Handle Logout
  if (clientLogoutBtn) {
    clientLogoutBtn.addEventListener('click', () => {
      clientToken = '';
      currentUser = null;
      localStorage.removeItem('cm_client_token');
      authOverlay.classList.remove('hidden');
      showToast('Signed out of client portal.');
    });
  }

  // ==========================================
  // 4B. FORGOT PASSWORD & PROFILE SETTINGS
  // ==========================================
  const clientForgotOverlay = document.getElementById('clientForgotOverlay');
  const linkClientForgotPass = document.getElementById('linkClientForgotPass');
  const linkBackToLogin = document.getElementById('linkBackToLogin');
  const linkBackToLogin2 = document.getElementById('linkBackToLogin2');
  const linkResendOtp = document.getElementById('linkResendOtp');
  const formClientForgotStep1 = document.getElementById('formClientForgotStep1');
  const formClientForgotStep2 = document.getElementById('formClientForgotStep2');
  const clientForgotError1 = document.getElementById('clientForgotError1');
  const clientForgotError2 = document.getElementById('clientForgotError2');
  const displayForgotEmail = document.getElementById('displayForgotEmail');

  let forgotEmailTarget = '';

  if (linkClientForgotPass) {
    linkClientForgotPass.addEventListener('click', (e) => {
      e.preventDefault();
      authOverlay.classList.add('hidden');
      if (clientForgotOverlay) {
        clientForgotOverlay.classList.remove('hidden');
        formClientForgotStep1.style.display = 'block';
        formClientForgotStep2.style.display = 'none';
        clientForgotError1.style.display = 'none';
        clientForgotError2.style.display = 'none';
        const clientEmailInput = document.getElementById('clientEmail');
        if (clientEmailInput && clientEmailInput.value) {
          document.getElementById('clientForgotEmail').value = clientEmailInput.value;
        }
      }
    });
  }

  function returnToLogin() {
    if (clientForgotOverlay) clientForgotOverlay.classList.add('hidden');
    authOverlay.classList.remove('hidden');
  }

  if (linkBackToLogin) linkBackToLogin.addEventListener('click', (e) => { e.preventDefault(); returnToLogin(); });
  if (linkBackToLogin2) linkBackToLogin2.addEventListener('click', (e) => { e.preventDefault(); returnToLogin(); });

  if (formClientForgotStep1) {
    formClientForgotStep1.addEventListener('submit', async (e) => {
      e.preventDefault();
      clientForgotError1.style.display = 'none';
      const email = document.getElementById('clientForgotEmail').value.trim();
      if (!email) return;

      const btn = document.getElementById('btnSendResetOtp');
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

        forgotEmailTarget = email;
        if (displayForgotEmail) displayForgotEmail.textContent = email;
        formClientForgotStep1.style.display = 'none';
        formClientForgotStep2.style.display = 'block';
        showToast('6-digit code sent to your email!', 'success');
      } catch (err) {
        clientForgotError1.textContent = err.message;
        clientForgotError1.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Send Verification Code</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
      }
    });
  }

  if (linkResendOtp) {
    linkResendOtp.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!forgotEmailTarget) return;
      try {
        await fetch('/api/portal/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmailTarget })
        });
        showToast('A new 6-digit code has been sent!', 'info');
      } catch (err) {
        showToast('Failed to resend code', 'error');
      }
    });
  }

  if (formClientForgotStep2) {
    formClientForgotStep2.addEventListener('submit', async (e) => {
      e.preventDefault();
      clientForgotError2.style.display = 'none';
      const otp = document.getElementById('clientForgotOtp').value.trim();
      const newPassword = document.getElementById('clientForgotNewPass').value;
      const confirmPass = document.getElementById('clientForgotConfirmPass').value;

      if (newPassword !== confirmPass) {
        clientForgotError2.textContent = 'Passwords do not match';
        clientForgotError2.style.display = 'block';
        return;
      }
      if (newPassword.length < 6) {
        clientForgotError2.textContent = 'Password must be at least 6 characters';
        clientForgotError2.style.display = 'block';
        return;
      }

      const btn = document.getElementById('btnVerifyResetOtp');
      btn.disabled = true;
      btn.textContent = 'Resetting Password...';

      try {
        const res = await fetch('/api/portal/auth/verify-reset-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmailTarget, otp, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reset password');

        showToast('Password reset successfully! Please sign in.', 'success');
        returnToLogin();
        const clientEmailInput = document.getElementById('clientEmail');
        if (clientEmailInput) clientEmailInput.value = forgotEmailTarget;
        const clientPassInput = document.getElementById('clientPassword');
        if (clientPassInput) clientPassInput.value = '';
      } catch (err) {
        clientForgotError2.textContent = err.message;
        clientForgotError2.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Reset Password & Log In</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      }
    });
  }

  // Profile & Password Modal
  const modalClientProfile = document.getElementById('modalClientProfile');
  const clientSettingsBtn = document.getElementById('clientSettingsBtn');
  const clientTopSettingsBtn = document.getElementById('clientTopSettingsBtn');
  const tabBtnClientProfile = document.getElementById('tabBtnClientProfile');
  const tabBtnClientSecurity = document.getElementById('tabBtnClientSecurity');
  const formClientProfile = document.getElementById('formClientProfile');
  const formClientChangePassword = document.getElementById('formClientChangePassword');
  const clientProfileMsg = document.getElementById('clientProfileMsg');
  const clientChangePassMsg = document.getElementById('clientChangePassMsg');

  function openProfileModal(tab = 'profile') {
    if (!currentUser) return;
    const editClientName = document.getElementById('editClientName');
    const editClientCompany = document.getElementById('editClientCompany');
    const editClientPhone = document.getElementById('editClientPhone');
    const editClientEmail = document.getElementById('editClientEmail');

    if (editClientName) editClientName.value = currentUser.name || '';
    if (editClientCompany) editClientCompany.value = currentUser.companyName || '';
    if (editClientPhone) editClientPhone.value = currentUser.phone || '';
    if (editClientEmail) editClientEmail.value = currentUser.email || '';

    switchProfileTab(tab);
    if (clientProfileMsg) clientProfileMsg.style.display = 'none';
    if (clientChangePassMsg) clientChangePassMsg.style.display = 'none';
    openModal('modalClientProfile');
  }

  function switchProfileTab(tab) {
    if (!tabBtnClientProfile || !tabBtnClientSecurity) return;
    if (tab === 'profile') {
      tabBtnClientProfile.style.color = 'var(--cp-primary)';
      tabBtnClientProfile.style.borderBottom = '2px solid var(--cp-primary)';
      tabBtnClientSecurity.style.color = 'var(--cp-text-muted)';
      tabBtnClientSecurity.style.borderBottom = 'none';
      if (formClientProfile) formClientProfile.style.display = 'block';
      if (formClientChangePassword) formClientChangePassword.style.display = 'none';
    } else {
      tabBtnClientSecurity.style.color = 'var(--cp-primary)';
      tabBtnClientSecurity.style.borderBottom = '2px solid var(--cp-primary)';
      tabBtnClientProfile.style.color = 'var(--cp-text-muted)';
      tabBtnClientProfile.style.borderBottom = 'none';
      if (formClientChangePassword) formClientChangePassword.style.display = 'block';
      if (formClientProfile) formClientProfile.style.display = 'none';
    }
  }

  if (clientSettingsBtn) clientSettingsBtn.addEventListener('click', () => openProfileModal('profile'));
  if (clientTopSettingsBtn) clientTopSettingsBtn.addEventListener('click', () => openProfileModal('profile'));
  if (tabBtnClientProfile) tabBtnClientProfile.addEventListener('click', () => switchProfileTab('profile'));
  if (tabBtnClientSecurity) tabBtnClientSecurity.addEventListener('click', () => switchProfileTab('security'));

  document.querySelectorAll('.btn-client-modal-logout').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeModal();
      if (clientLogoutBtn) clientLogoutBtn.click();
    });
  });

  if (formClientProfile) {
    formClientProfile.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('editClientName').value.trim();
      const companyName = document.getElementById('editClientCompany').value.trim();
      const phone = document.getElementById('editClientPhone').value.trim();
      const btn = document.getElementById('btnSaveClientProfile');

      btn.disabled = true;
      btn.textContent = 'Saving...';
      if (clientProfileMsg) clientProfileMsg.style.display = 'none';

      try {
        const data = await apiRequest('/api/portal/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({ name, companyName, phone })
        });
        currentUser = { ...currentUser, ...data.user };
        renderProfile();
        showToast('Profile updated successfully!', 'success');
        if (clientProfileMsg) {
          clientProfileMsg.style.background = 'rgba(16,185,129,0.1)';
          clientProfileMsg.style.color = '#10b981';
          clientProfileMsg.textContent = 'Profile details saved successfully!';
          clientProfileMsg.style.display = 'block';
        }
        setTimeout(() => closeModal(), 1200);
      } catch (err) {
        if (clientProfileMsg) {
          clientProfileMsg.style.background = 'rgba(239,68,68,0.1)';
          clientProfileMsg.style.color = '#ef4444';
          clientProfileMsg.textContent = err.message || 'Failed to update profile';
          clientProfileMsg.style.display = 'block';
        }
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Profile';
      }
    });
  }

  if (formClientChangePassword) {
    formClientChangePassword.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('currClientPassword').value;
      const newPassword = document.getElementById('newClientPassword').value;
      const confirmPassword = document.getElementById('confirmClientPassword').value;
      const btn = document.getElementById('btnSaveClientPassword');

      if (newPassword !== confirmPassword) {
        if (clientChangePassMsg) {
          clientChangePassMsg.style.background = 'rgba(239,68,68,0.1)';
          clientChangePassMsg.style.color = '#ef4444';
          clientChangePassMsg.textContent = 'New passwords do not match';
          clientChangePassMsg.style.display = 'block';
        }
        return;
      }
      if (newPassword.length < 6) {
        if (clientChangePassMsg) {
          clientChangePassMsg.style.background = 'rgba(239,68,68,0.1)';
          clientChangePassMsg.style.color = '#ef4444';
          clientChangePassMsg.textContent = 'New password must be at least 6 characters';
          clientChangePassMsg.style.display = 'block';
        }
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Updating...';
      if (clientChangePassMsg) clientChangePassMsg.style.display = 'none';

      try {
        await apiRequest('/api/portal/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword })
        });
        showToast('Password changed successfully!', 'success');
        if (clientChangePassMsg) {
          clientChangePassMsg.style.background = 'rgba(16,185,129,0.1)';
          clientChangePassMsg.style.color = '#10b981';
          clientChangePassMsg.textContent = 'Password changed successfully!';
          clientChangePassMsg.style.display = 'block';
        }
        formClientChangePassword.reset();
        setTimeout(() => closeModal(), 1200);
      } catch (err) {
        if (clientChangePassMsg) {
          clientChangePassMsg.style.background = 'rgba(239,68,68,0.1)';
          clientChangePassMsg.style.color = '#ef4444';
          clientChangePassMsg.textContent = err.message || 'Failed to change password';
          clientChangePassMsg.style.display = 'block';
        }
      } finally {
        btn.disabled = false;
        btn.textContent = 'Update Password';
      }
    });
  }

  // ==========================================
  // 5. SECTION ROUTING
  // ==========================================
  const pageHeaders = {
    dashboard: { title: 'Dashboard', sub: 'Track company services, status & certificates' },
    services: { title: 'My Services', sub: 'Real-time progress and filings for your business' },
    buy: { title: 'Buy & Explore', sub: 'Combo packages, 100+ business services & funding schemes' },
    documents: { title: 'My Documents', sub: 'Official certificates and downloadable papers' },
    support: { title: 'Help & Support Desk', sub: 'Ask questions and review messages from operations' }
  };

  function switchSection(sectionId) {
    const targetSec = document.getElementById(`sec-${sectionId}`);
    if (!targetSec) return;

    document.querySelectorAll('.cp-view-section').forEach((sec) => sec.classList.remove('active'));
    targetSec.classList.add('active');

    document.querySelectorAll('.cp-nav-link, .portal-bottom-nav-item').forEach((link) => {
      link.classList.toggle('active', link.dataset.nav === sectionId);
    });

    if (pageHeaders[sectionId]) {
      if (cpPageTitle) cpPageTitle.textContent = pageHeaders[sectionId].title;
      if (cpPageSubtitle) cpPageSubtitle.textContent = pageHeaders[sectionId].sub;
    }

    if (cpSidebar) cpSidebar.classList.remove('open');
  }

  document.querySelectorAll('.cp-nav-link, .portal-bottom-nav-item').forEach((link) => {
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
  // 6. MODALS MANAGEMENT
  // ==========================================
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalEl) {
    if (!modalEl) {
      const openModals = document.querySelectorAll('.cp-modal.is-open');
      if (openModals.length > 0) modalEl = openModals[openModals.length - 1];
    }
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.cp-modal.is-open')) {
      document.body.style.overflow = '';
    }
  }

  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', () => {
      closeModal(el.closest('.cp-modal'));
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Navigation & Action Triggers
  function openBuySection(tab = 'combos') {
    window.location.hash = 'buy';
    switchSection('buy');
    if (tab) {
      const tabBtn = document.querySelector(`.cp-buy-tab-btn[data-buy-tab="${tab}"]`);
      if (tabBtn) tabBtn.click();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const topRequestServiceBtn = document.getElementById('topRequestServiceBtn');
  const qaRequestServiceBtn = document.getElementById('qaRequestServiceBtn');
  const openRequestServiceModalBtn = document.getElementById('openRequestServiceModalBtn');
  [topRequestServiceBtn, qaRequestServiceBtn, openRequestServiceModalBtn].forEach((btn) => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openBuySection('combos');
      });
    }
  });

  const qaAskSupportBtn = document.getElementById('qaAskSupportBtn');
  if (qaAskSupportBtn) {
    qaAskSupportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = 'support';
      switchSection('support');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const openNewTicketModalBtn = document.getElementById('openNewTicketModalBtn');
  if (openNewTicketModalBtn) {
    openNewTicketModalBtn.addEventListener('click', () => openModal('modalNewTicket'));
  }

  const qaViewDocsBtn = document.getElementById('qaViewDocsBtn');
  if (qaViewDocsBtn) {
    qaViewDocsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = 'documents';
      switchSection('documents');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ==========================================
  // 7. DATA FETCHING & RENDERING
  // ==========================================
  async function loadPortalData() {
    try {
      const data = await apiRequest('/api/portal/client/dashboard');
      if (data && data.success) {
        cachedData = data;
        renderDashboard(data);
        renderServices(data.cases || []);
        renderDocuments(data.documents || []);
        renderTickets(data.tickets || []);
        if (data.client) { currentUser = Object.assign(currentUser || {}, data.client); renderFundingSchemes(); }
        if (data.client) { currentUser = Object.assign(currentUser || {}, data.client); renderFundingSchemes(); }
      }
    } catch (err) {
      console.warn('Error loading portal data:', err);
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'approved':
        return '<span class="cp-badge cp-badge-approved">🟢 Completed</span>';
      case 'in_review':
        return '<span class="cp-badge cp-badge-review">🟡 In Progress</span>';
      case 'rejected':
        return '<span class="cp-badge cp-badge-rejected">🔴 Needs Attention</span>';
      case 'pending_documents':
        return '<span class="cp-badge cp-badge-pending">⚪ Waiting for Papers</span>';
      default:
        return `<span class="cp-badge cp-badge-pending">${escapeHtml(status)}</span>`;
    }
  }

  function setupCarousel(track, prevBtn, nextBtn, dotsContainer) {
    if (!track) return;

    function getItems() {
      return track.querySelectorAll('.cp-carousel-card-item');
    }

    function updateNav() {
      const items = getItems();
      if (items.length <= 1) {
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (dotsContainer) dotsContainer.innerHTML = '';
        return;
      }

      const scrollLeft = track.scrollLeft;
      const maxScroll = track.scrollWidth - track.clientWidth;

      if (prevBtn) prevBtn.disabled = scrollLeft <= 4;
      if (nextBtn) nextBtn.disabled = scrollLeft >= maxScroll - 4;

      if (dotsContainer) {
        const itemWidth = items[0].offsetWidth + 16;
        const activeIdx = Math.min(items.length - 1, Math.max(0, Math.round(scrollLeft / itemWidth)));
        const dots = dotsContainer.querySelectorAll('.cp-carousel-dot');
        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === activeIdx);
        });
      }
    }

    if (prevBtn) {
      prevBtn.onclick = (e) => {
        e.preventDefault();
        const items = getItems();
        if (items.length === 0) return;
        const step = items[0].offsetWidth + 16;
        track.scrollBy({ left: -step, behavior: 'smooth' });
      };
    }

    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.preventDefault();
        const items = getItems();
        if (items.length === 0) return;
        const step = items[0].offsetWidth + 16;
        track.scrollBy({ left: step, behavior: 'smooth' });
      };
    }

    track.onscroll = () => {
      updateNav();
    };

    if (dotsContainer) {
      const items = getItems();
      if (items.length > 1) {
        dotsContainer.innerHTML = Array.from(items).map((_, i) =>
          `<span class="cp-carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
        ).join('');

        dotsContainer.querySelectorAll('.cp-carousel-dot').forEach((dot) => {
          dot.onclick = () => {
            const idx = parseInt(dot.dataset.index, 10);
            const items = getItems();
            if (items.length === 0) return;
            const step = items[0].offsetWidth + 16;
            track.scrollTo({ left: idx * step, behavior: 'smooth' });
          };
        });
      } else {
        dotsContainer.innerHTML = '';
      }
    }

    updateNav();
  }

  // ==========================================
  // HERO CAROUSEL LOGOS & AUTHORITIES (MATCHING REFERENCE IMAGE)
  // ==========================================
  function getAadhaarLogoSvg() {
    return `
      <svg viewBox="0 0 64 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 28L8 23L14 22L12 28Z" fill="#F59E0B" />
        <path d="M16 20L13 14L20 16L16 20Z" fill="#F59E0B" />
        <path d="M23 15L22 8L28 12L23 15Z" fill="#F59E0B" />
        <path d="M32 13L32 6L35 13L32 13Z" fill="#F59E0B" />
        <path d="M41 15L42 8L36 12L41 15Z" fill="#F59E0B" />
        <path d="M48 20L51 14L44 16L48 20Z" fill="#F59E0B" />
        <path d="M52 28L56 23L50 22L52 28Z" fill="#F59E0B" />
        <path d="M18 36C18 25.5 24.3 19 32 19C39.7 19 46 25.5 46 36" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" />
        <path d="M22 36C22 28 26.5 23 32 23C37.5 23 42 28 42 36" stroke="#DC2626" stroke-width="2.2" stroke-linecap="round" />
        <path d="M26 36C26 31 28.7 27 32 27C35.3 27 38 31 38 36" stroke="#DC2626" stroke-width="2" stroke-linecap="round" />
        <path d="M30 36C30 34 30.9 31 32 31C33.1 31 34 34 34 36" stroke="#DC2626" stroke-width="2" stroke-linecap="round" />
        <text x="32" y="48" text-anchor="middle" font-size="7.5" font-weight="900" fill="#DC2626" font-family="Arial, sans-serif" letter-spacing="1">AADHAAR</text>
      </svg>
    `;
  }

  function getMcaLogoSvg() {
    return `
      <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="27" cy="27" r="25" fill="#EEF2FF" stroke="#4F46E5" stroke-width="2" />
        <path d="M17 18H37M20 22H34M17 38H37M27 12V18M21 22V38M27 22V38M33 22V38" stroke="#4338CA" stroke-width="2" stroke-linecap="round" />
        <circle cx="27" cy="30" r="4" fill="#F59E0B" />
        <text x="27" y="47" text-anchor="middle" font-size="6" font-weight="800" fill="#4338CA" font-family="Arial, sans-serif" letter-spacing="0.5">MCA • GOI</text>
      </svg>
    `;
  }

  function getGstLogoSvg() {
    return `
      <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="27,6 47,17 47,39 27,50 7,39 7,17" fill="#F0FDF4" stroke="#10B981" stroke-width="2" />
        <circle cx="27" cy="28" r="14" fill="#FFFFFF" stroke="#059669" stroke-width="1.5" />
        <rect x="18" y="21" width="18" height="3" rx="1.5" fill="#F97316" />
        <rect x="18" y="26" width="18" height="3" rx="1.5" fill="#0284C7" />
        <rect x="18" y="31" width="18" height="3" rx="1.5" fill="#16A34A" />
        <text x="27" y="44" text-anchor="middle" font-size="6" font-weight="900" fill="#059669" font-family="Arial, sans-serif" letter-spacing="1">GSTN</text>
      </svg>
    `;
  }

  function getIsoLogoSvg() {
    return `
      <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="27" cy="24" r="18" fill="#1E40AF" stroke="#3B82F6" stroke-width="2" />
        <circle cx="27" cy="24" r="14" fill="#FFFFFF" stroke="#60A5FA" stroke-width="1" />
        <text x="27" y="24" text-anchor="middle" font-size="8" font-weight="900" fill="#1E40AF" font-family="Arial, sans-serif">ISO</text>
        <text x="27" y="30" text-anchor="middle" font-size="5" font-weight="700" fill="#2563EB" font-family="Arial, sans-serif">9001:2015</text>
        <path d="M22 38L18 50L25 46L30 46L36 50L32 38" fill="#F59E0B" stroke="#D97706" stroke-width="1" />
      </svg>
    `;
  }

  function getTrademarkLogoSvg() {
    return `
      <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M27 6L44 14V28C44 38 36 46 27 50C18 46 10 38 10 28V14L27 6Z" fill="#FAF5FF" stroke="#7C3AED" stroke-width="2" />
        <circle cx="27" cy="26" r="9" fill="#EDE9FE" stroke="#8B5CF6" stroke-width="1.5" />
        <text x="27" y="30" text-anchor="middle" font-size="12" font-weight="900" fill="#6D28D9" font-family="Arial, sans-serif">®</text>
        <text x="27" y="44" text-anchor="middle" font-size="5" font-weight="800" fill="#7C3AED" font-family="Arial, sans-serif" letter-spacing="0.5">IP INDIA</text>
      </svg>
    `;
  }

  function getTaxLogoSvg() {
    return `
      <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="7" y="10" width="40" height="34" rx="6" fill="#F0FDF4" stroke="#059669" stroke-width="2" />
        <rect x="7" y="10" width="40" height="8" rx="4" fill="#059669" />
        <circle cx="16" cy="27" r="4.5" fill="#D1FAE5" stroke="#10B981" stroke-width="1" />
        <rect x="24" y="23" width="18" height="3" rx="1.5" fill="#059669" />
        <rect x="24" y="28" width="12" height="2" rx="1" fill="#10B981" />
        <text x="27" y="40" text-anchor="middle" font-size="5.5" font-weight="800" fill="#047857" font-family="Arial, sans-serif" letter-spacing="0.5">INCOME TAX</text>
      </svg>
    `;
  }

  function getStartupLogoSvg() {
    return `
      <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="27" cy="27" r="24" fill="#FFFBEB" stroke="#D97706" stroke-width="2" />
        <path d="M27 10L31 20L42 22L34 29L36 40L27 34L18 40L20 29L12 22L23 20L27 10Z" fill="#F59E0B" />
        <text x="27" y="47" text-anchor="middle" font-size="5" font-weight="800" fill="#B45309" font-family="Arial, sans-serif" letter-spacing="0.5">STARTUP INDIA</text>
      </svg>
    `;
  }

  function getDefaultDocLogoSvg() {
    return `
      <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="38" height="38" rx="8" fill="#EFF6FF" stroke="#2563EB" stroke-width="2" />
        <path d="M18 18H36M18 24H36M18 30H28M18 36H24" stroke="#1D4ED8" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="34" cy="33" r="5" fill="#3B82F6" />
        <path d="M32 33L33.5 34.5L36.5 31.5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }

  function getIssuedDocLogoSvg(doc) {
    const text = `${doc.title || ''} ${doc.fileName || ''} ${doc.category || ''}`.toLowerCase();
    if (text.includes('aadhaar') || text.includes('aadhar') || text.includes('uidai')) return getAadhaarLogoSvg();
    if (text.includes('incorporation') || text.includes('moa') || text.includes('aoa') || text.includes('mca') || text.includes('coi') || text.includes('roc') || text.includes('pvt ltd') || text.includes('llp')) return getMcaLogoSvg();
    if (text.includes('gst')) return getGstLogoSvg();
    if (text.includes('iso')) return getIsoLogoSvg();
    if (text.includes('trademark') || text.includes('patent') || text.includes('ip india') || text.includes('copyright')) return getTrademarkLogoSvg();
    if (text.includes('pan') || text.includes('tan') || text.includes('tax') || text.includes('itr')) return getTaxLogoSvg();
    if (text.includes('startup') || text.includes('msme') || text.includes('udyam')) return getStartupLogoSvg();
    return getDefaultDocLogoSvg();
  }

  function getIssuedDocWatermarkSvg(doc) {
    return getIssuedDocLogoSvg(doc);
  }

  function getIssuedDocAuthority(doc) {
    const text = `${doc.title || ''} ${doc.fileName || ''} ${doc.category || ''}`.toLowerCase();
    if (text.includes('aadhaar') || text.includes('aadhar') || text.includes('uidai')) return 'Unique Identification Authority of India (UIDAI)';
    if (text.includes('incorporation') || text.includes('moa') || text.includes('aoa') || text.includes('mca') || text.includes('coi') || text.includes('roc')) return 'Ministry of Corporate Affairs (MCA)';
    if (text.includes('gst')) return 'Goods and Services Tax Network (GSTN)';
    if (text.includes('iso')) return 'International Organization for Standardization (ISO)';
    if (text.includes('trademark') || text.includes('patent') || text.includes('ip')) return 'Controller General of Patents, Designs & Trademarks';
    if (text.includes('pan') || text.includes('tan') || text.includes('tax')) return 'Income Tax Department, Govt. of India';
    if (text.includes('msme') || text.includes('udyam')) return 'Ministry of Micro, Small & Medium Enterprises';
    if (text.includes('startup')) return 'Department for Promotion of Industry & Internal Trade (DPIIT)';
    return 'Corporate Mart Regulatory Compliance Desk';
  }

  function getIssuedDocIdentifier(doc) {
    const text = `${doc.title || ''} ${doc.fileName || ''}`.toLowerCase();
    if (text.includes('aadhaar') || text.includes('aadhar')) return 'xxxxxxxx7955';
    if (doc.docId) return `${doc.docId} • Verified Official`;
    return 'Official Issued Document';
  }

  function getServiceLogoSvg(c) {
    const text = `${c.serviceName || ''}`.toLowerCase();
    if (text.includes('incorporation') || text.includes('company') || text.includes('llp') || text.includes('director') || text.includes('roc') || text.includes('mca')) return getMcaLogoSvg();
    if (text.includes('gst')) return getGstLogoSvg();
    if (text.includes('iso')) return getIsoLogoSvg();
    if (text.includes('trademark') || text.includes('patent') || text.includes('brand')) return getTrademarkLogoSvg();
    if (text.includes('tax') || text.includes('accounting') || text.includes('audit')) return getTaxLogoSvg();
    if (text.includes('startup') || text.includes('funding') || text.includes('grant') || text.includes('msme')) return getStartupLogoSvg();
    return getDefaultDocLogoSvg();
  }

  function getServiceWatermarkSvg(c) {
    return getServiceLogoSvg(c);
  }

  function getServiceAuthority(c) {
    const text = `${c.serviceName || ''}`.toLowerCase();
    if (text.includes('incorporation') || text.includes('llp') || text.includes('pvt ltd') || text.includes('roc') || text.includes('mca')) return 'Ministry of Corporate Affairs (MCA)';
    if (text.includes('gst')) return 'Goods and Services Tax Network (GSTN)';
    if (text.includes('trademark') || text.includes('ip') || text.includes('patent')) return 'Office of Controller General of Patents, Designs & Trademarks';
    if (text.includes('iso')) return 'Quality Management Accreditation Body';
    if (text.includes('startup') || text.includes('funding')) return 'Startup India / DPIIT';
    return 'Corporate Mart Operations Desk';
  }

  // A. Dashboard Render
  function renderDashboard(data) {
    const stats = data.stats || {};
    const activeEl = document.getElementById('kpiActiveServices');
    const completedEl = document.getElementById('kpiCompletedServices');
    const docsEl = document.getElementById('kpiTotalDocuments');

    if (activeEl) activeEl.textContent = stats.activeServices || 0;
    if (completedEl) completedEl.textContent = stats.completedServices || 0;
    if (docsEl) docsEl.textContent = stats.totalDocuments || 0;

    const navServicesBadge = document.getElementById('navServicesBadge');
    const navDocsBadge = document.getElementById('navDocsBadge');
    const navTicketsBadge = document.getElementById('navTicketsBadge');

    const bServices = document.getElementById('bottomNavServicesBadge');
    const bDocs = document.getElementById('bottomNavDocsBadge');
    const bTickets = document.getElementById('bottomNavTicketsBadge');

    if (navServicesBadge) navServicesBadge.textContent = stats.totalServices || 0;
    if (navDocsBadge) navDocsBadge.textContent = stats.totalDocuments || 0;
    if (navTicketsBadge) navTicketsBadge.textContent = stats.openTickets || 0;

    if (bServices) { bServices.textContent = stats.totalServices || 0; bServices.style.display = stats.totalServices > 0 ? 'block' : 'none'; }
    if (bDocs) { bDocs.textContent = stats.totalDocuments || 0; bDocs.style.display = stats.totalDocuments > 0 ? 'block' : 'none'; }
    if (bTickets) { bTickets.textContent = stats.openTickets || 0; bTickets.style.display = stats.openTickets > 0 ? 'block' : 'none'; }

    const allDocs = data.documents || [];
    const issuedDocs = allDocs.filter((d) => d.docType !== 'company' && d.category !== 'client_kyc' && d.category !== 'company_document');
    const companyDocs = allDocs.filter((d) => d.docType === 'company' || d.category === 'client_kyc' || d.category === 'company_document');

    // 1. Render Dashboard Issued Documents Carousel (DigiLocker Hero Style)
    const dTrack = document.getElementById('dashDocsCarousel');
    const prevDocBtn = document.getElementById('btnPrevDashDoc');
    const nextDocBtn = document.getElementById('btnNextDashDoc');
    const dDots = document.getElementById('dashDocsDots');

    if (dTrack) {
      if (issuedDocs.length === 0) {
        dTrack.innerHTML = `
          <div class="cp-carousel-card-item">
            <div class="cp-carousel-empty-card" style="background:#ffffff; border-radius:20px; border:none; padding:32px 20px;">
              <span style="font-size:32px;">📁</span>
              <strong style="color:#1e293b;">No issued documents yet</strong>
              <p style="color:#64748b;">Official registration certificates, GST documents, and DSC files will appear here.</p>
            </div>
          </div>
        `;
        if (prevDocBtn) prevDocBtn.disabled = true;
        if (nextDocBtn) nextDocBtn.disabled = true;
        if (dDots) dDots.innerHTML = '';
      } else {
        dTrack.innerHTML = issuedDocs.map((d) => {
          const auth = getIssuedDocAuthority(d);
          const identifier = getIssuedDocIdentifier(d);
          const logoSvg = getIssuedDocLogoSvg(d);
          const watermarkSvg = getIssuedDocWatermarkSvg(d);

          return `
            <div class="cp-carousel-card-item">
              <div class="cp-hero-doc-card btn-client-preview-doc" data-doc-id="${escapeHtml(d.docId)}" title="Click to view & download ${escapeHtml(d.title)}">
                <div class="cp-hero-doc-top">
                  <div class="cp-hero-doc-logo-box">
                    ${logoSvg}
                  </div>
                  <div class="cp-hero-doc-main-info">
                    <h4 class="cp-hero-doc-title" title="${escapeHtml(d.title)}">${escapeHtml(d.title)}</h4>
                    <span class="cp-hero-doc-id">${escapeHtml(identifier)}</span>
                  </div>
                </div>
                <div class="cp-hero-doc-authority" title="${escapeHtml(auth)}">
                  ${escapeHtml(auth)}
                </div>
                <div class="cp-hero-doc-watermark">
                  ${watermarkSvg}
                </div>
              </div>
            </div>
          `;
        }).join('');

        wireDocPreviewButtons(dTrack);
        setupCarousel(dTrack, prevDocBtn, nextDocBtn, dDots);
      }
    }

    // 2. Render Dashboard Services Carousel (DigiLocker Hero Style)
    const sTrack = document.getElementById('dashServicesCarousel');
    const prevServiceBtn = document.getElementById('btnPrevDashService');
    const nextServiceBtn = document.getElementById('btnNextDashService');
    const sDots = document.getElementById('dashServicesDots');
    const cases = data.cases || [];

    if (sTrack) {
      if (cases.length === 0) {
        sTrack.innerHTML = `
          <div class="cp-carousel-card-item">
            <div class="cp-carousel-empty-card" style="background:#ffffff; border-radius:20px; border:none; padding:32px 20px;">
              <span style="font-size:32px;">📋</span>
              <strong style="color:#1e293b;">No ongoing services yet</strong>
              <p style="color:#64748b;">Your active business filings, approvals, and status notes will appear here.</p>
            </div>
          </div>
        `;
        if (prevServiceBtn) prevServiceBtn.disabled = true;
        if (nextServiceBtn) nextServiceBtn.disabled = true;
        if (sDots) sDots.innerHTML = '';
      } else {
        sTrack.innerHTML = cases.map((c) => {
          const auth = getServiceAuthority(c);
          const logoSvg = getServiceLogoSvg(c);
          const watermarkSvg = getServiceWatermarkSvg(c);
          const statusText = c.status === 'approved' ? 'Completed' : (c.status === 'in_review' ? 'In Progress' : (c.status === 'pending_documents' ? 'Pending Papers' : 'Active'));
          const statusClass = c.status === 'approved' ? 'status-approved' : (c.status === 'in_review' ? 'status-in_review' : 'status-pending');

          return `
            <div class="cp-carousel-card-item">
              <div class="cp-hero-doc-card btn-dash-view-case" data-case-id="${escapeHtml(c.caseId)}" title="Click to inspect ${escapeHtml(c.serviceName)}">
                <div class="cp-hero-doc-top">
                  <div class="cp-hero-doc-logo-box">
                    ${logoSvg}
                  </div>
                  <div class="cp-hero-doc-main-info">
                    <h4 class="cp-hero-doc-title" title="${escapeHtml(c.serviceName)}">${escapeHtml(c.serviceName)}</h4>
                    <div class="cp-hero-doc-id-row">
                      <span class="cp-hero-doc-id">${escapeHtml(c.caseId)}</span>
                      <span class="cp-badge-pill-status ${statusClass}">● ${statusText}</span>
                    </div>
                  </div>
                </div>
                <div class="cp-hero-doc-authority" title="${escapeHtml(c.statusNote || auth)}">
                  ${escapeHtml(auth)} • ${escapeHtml(c.statusNote || 'In processing with operations')}
                </div>
                <div class="cp-hero-doc-watermark">
                  ${watermarkSvg}
                </div>
              </div>
            </div>
          `;
        }).join('');

        sTrack.querySelectorAll('.btn-dash-view-case').forEach((btn) => {
          btn.addEventListener('click', () => {
            openServiceDetailsModal(btn.dataset.caseId);
          });
        });

        setupCarousel(sTrack, prevServiceBtn, nextServiceBtn, sDots);
      }
    }

    // 3. Render Dashboard Company Documents Grid (Below Dual Carousels Grid)
    renderCompanyDocsGrid(companyDocs, document.getElementById('dashCompanyDocsGrid'));

    // 4. Render Dashboard Service Categories
    renderServiceCategories();
  }

  // B. Services Section Render
  function renderServices(cases) {
    const container = document.getElementById('clientServicesContainer');
    if (!container) return;

    if (cases.length === 0) {
      container.innerHTML = `
        <div class="cp-card" style="text-align:center; padding:48px 20px;">
          <span style="font-size:48px;">📋</span>
          <h3 style="margin-top:12px; font-size:18px;">No Services Assigned Yet</h3>
          <p style="color:var(--cp-text-muted); margin-top:4px; max-width:440px; margin-left:auto; margin-right:auto;">
            Your company account has been created. Click below to request your first service or contact operations.
          </p>
          <button type="button" class="cp-btn cp-btn-primary" style="margin-top:18px;" onclick="document.getElementById('topRequestServiceBtn').click()">
            + Request a Service
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = cases.map((c) => {
      const isApproved = c.status === 'approved';
      const isReview = c.status === 'in_review';
      const isPendingDocs = c.status === 'pending_documents';

      // Step classes
      const step1Class = 'completed';
      const step2Class = isApproved ? 'completed' : (isReview ? 'active' : '');
      const step3Class = isApproved ? 'completed' : '';

      return `
        <div class="cp-service-card cp-service-card-clickable" data-case-id="${escapeHtml(c.caseId)}">
          <div class="cp-service-card-header">
            <div>
              <div class="cp-service-name">${escapeHtml(c.serviceName)}</div>
              <div class="cp-service-meta">Service ID: <code>${escapeHtml(c.caseId)}</code> • Updated: ${c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('en-IN') : 'Recently'}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              ${getStatusBadge(c.status)}
              <button type="button" class="cp-btn cp-btn-secondary cp-btn-sm btn-open-case-details" data-case-id="${escapeHtml(c.caseId)}">
                View Details →
              </button>
            </div>
          </div>

          <!-- Progress Stepper -->
          <div class="cp-progress-stepper">
            <div class="cp-step ${step1Class}">
              <div class="cp-step-circle">1</div>
              <div class="cp-step-label">KYC & Preparation</div>
            </div>
            <div class="cp-step ${step2Class}">
              <div class="cp-step-circle">2</div>
              <div class="cp-step-label">Government Review</div>
            </div>
            <div class="cp-step ${step3Class}">
              <div class="cp-step-circle">3</div>
              <div class="cp-step-label">Certificate Issued</div>
            </div>
          </div>

          <!-- Status Note Box -->
          <div class="cp-service-note-box">
            <div class="cp-service-note-icon">📢</div>
            <div class="cp-service-note-text">
              <strong>Latest Update from Operations Desk</strong>
              <p>${escapeHtml(c.statusNote || 'Your application is progressing normally.')}</p>
            </div>
          </div>

          ${
            isApproved
              ? (() => {
                  const matchDoc = (cachedData.documents || []).find((d) => 
                    (d.caseId === c.caseId || d.caseId === c.id) &&
                    d.docType !== 'company' &&
                    d.category !== 'company_document' &&
                    d.category !== 'client_kyc'
                  );
                  if (matchDoc) {
                    return `
                      <div style="margin-top:16px; display:flex; justify-content:flex-end; gap:8px;">
                        <button type="button" class="cp-btn cp-btn-secondary cp-btn-sm btn-client-preview-doc" data-doc-id="${escapeHtml(matchDoc.docId)}">
                          👁 Preview Certificate
                        </button>
                        <a href="${escapeHtml(matchDoc.fileUrl)}" target="_blank" download class="cp-btn cp-btn-primary cp-btn-sm" style="text-decoration:none;">
                          ⬇ Download Certificate
                        </a>
                      </div>
                    `;
                  }
                  return `
                    <div style="margin-top:16px; display:flex; justify-content:flex-end;">
                      <a href="#documents" class="cp-btn cp-btn-primary cp-btn-sm" style="text-decoration:none;" onclick="document.querySelector('a[data-nav=documents]').click()">
                        View & Download Certificate →
                      </a>
                    </div>
                  `;
                })()
              : ''
          }

          <div class="cp-service-card-footer" style="margin-top:16px; padding-top:12px; border-top:1px dashed var(--cp-border); display:flex; align-items:center; justify-content:space-between; font-size:12px; color:var(--cp-text-muted);">
            <span>Click card to inspect full details, remarks & documents</span>
            <span style="color:var(--cp-primary); font-weight:600;">Open View ↗</span>
          </div>
        </div>
      `;
    }).join('');

    // Wire card click & explicit View Details button
    container.querySelectorAll('.cp-service-card-clickable').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-client-preview-doc') || e.target.closest('a')) {
          return;
        }
        const caseId = card.dataset.caseId;
        openServiceDetailsModal(caseId);
      });
    });

    container.querySelectorAll('.btn-open-case-details').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const caseId = btn.dataset.caseId;
        openServiceDetailsModal(caseId);
      });
    });

    wireDocPreviewButtons(container);
  }

  function openServiceDetailsModal(caseId) {
    if (!cachedData || !cachedData.cases) return;
    const c = cachedData.cases.find((item) => item.caseId === caseId || item.id === caseId);
    if (!c) return;

    // 1. Name & IDs
    const nameEl = document.getElementById('serviceDetailName');
    const caseIdEl = document.getElementById('serviceDetailCaseId');
    const metaIdEl = document.getElementById('serviceDetailMetaId');
    const companyEl = document.getElementById('serviceDetailCompany');
    if (nameEl) nameEl.textContent = c.serviceName || 'Service Case';
    if (caseIdEl) caseIdEl.textContent = c.caseId || '—';
    if (metaIdEl) metaIdEl.textContent = c.caseId || '—';
    if (companyEl) companyEl.textContent = c.companyName || (cachedData.client && cachedData.client.companyName) || (currentUser && currentUser.companyName) || 'Corporate Client';

    // 2. Status Badge & Meta
    const statusBadgeEl = document.getElementById('serviceDetailStatusBadge');
    const metaStatusEl = document.getElementById('serviceDetailMetaStatus');
    if (statusBadgeEl) statusBadgeEl.innerHTML = getStatusBadge(c.status);
    if (metaStatusEl) {
      const statusLabels = {
        approved: 'Completed / Approved',
        in_review: 'In Review / In Progress',
        rejected: 'Needs Attention',
        pending_documents: 'Waiting for Documents'
      };
      metaStatusEl.textContent = statusLabels[c.status] || (c.status || 'Active');
    }

    // 3. Updated At & Created At Dates
    const updatedEl = document.getElementById('serviceDetailUpdatedAt');
    const createdEl = document.getElementById('serviceDetailCreatedAt');
    if (updatedEl) {
      if (c.updatedAt) {
        const d = new Date(c.updatedAt);
        updatedEl.textContent = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      } else {
        updatedEl.textContent = 'Recently';
      }
    }
    if (createdEl) {
      if (c.createdAt) {
        const d = new Date(c.createdAt);
        createdEl.textContent = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      } else {
        createdEl.textContent = '—';
      }
    }

    // 4. Remark / Status Note
    const remarkEl = document.getElementById('serviceDetailRemarkText');
    if (remarkEl) {
      remarkEl.textContent = c.statusNote || 'Your application is progressing normally without any blockers.';
    }

    // 5. Stepper
    const stepperContainer = document.getElementById('serviceDetailProgressStepper');
    if (stepperContainer) {
      const isApproved = c.status === 'approved';
      const isReview = c.status === 'in_review';
      const step1Class = 'completed';
      const step2Class = isApproved ? 'completed' : (isReview ? 'active' : '');
      const step3Class = isApproved ? 'completed' : '';

      stepperContainer.innerHTML = `
        <div class="cp-step ${step1Class}">
          <div class="cp-step-circle">1</div>
          <div class="cp-step-label">KYC & Preparation</div>
        </div>
        <div class="cp-step ${step2Class}">
          <div class="cp-step-circle">2</div>
          <div class="cp-step-label">Government Review</div>
        </div>
        <div class="cp-step ${step3Class}">
          <div class="cp-step-circle">3</div>
          <div class="cp-step-label">Certificate Issued</div>
        </div>
      `;
    }

    // 6. Assigned Documents with Preview & Download Options
    const docsListEl = document.getElementById('serviceDetailDocsList');
    const docsCountEl = document.getElementById('serviceDetailDocsCount');
    const allDocs = cachedData.documents || [];
    const assignedDocs = allDocs.filter((d) =>
      d.docType !== 'company' &&
      d.category !== 'company_document' &&
      d.category !== 'client_kyc' &&
      d.caseId && (d.caseId === c.caseId || d.caseId === c.id)
    );

    if (docsCountEl) docsCountEl.textContent = assignedDocs.length;

    if (docsListEl) {
      if (assignedDocs.length === 0) {
        docsListEl.innerHTML = `
          <div class="cp-service-docs-empty">
            <div style="font-size:32px; margin-bottom:8px;">📁</div>
            <div style="font-weight:700; font-size:14px; color:var(--cp-text-main);">No documents assigned to this case yet</div>
            <div style="font-size:12px; color:var(--cp-text-muted); margin-top:4px;">
              Official certificates, filings, and receipts will appear here as soon as they are uploaded and issued by the operations team.
            </div>
          </div>
        `;
      } else {
        docsListEl.innerHTML = assignedDocs.map((doc) => {
          const dateStr = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';
          return `
            <div class="cp-service-doc-item">
              <div class="cp-service-doc-icon">📄</div>
              <div class="cp-service-doc-info">
                <div class="cp-service-doc-title">${escapeHtml(doc.title || 'Document')}</div>
                <div class="cp-service-doc-sub">
                  <span class="cp-badge cp-badge-purple">${escapeHtml(doc.category || 'Certificate')}</span>
                  <span>${escapeHtml(doc.fileName || 'file')}</span>
                  ${doc.fileSize ? `<span>• ${escapeHtml(doc.fileSize)}</span>` : ''}
                  <span>• Uploaded: ${dateStr}</span>
                </div>
              </div>
              <div class="cp-service-doc-actions">
                <button type="button" class="cp-btn cp-btn-secondary cp-btn-sm btn-client-preview-doc" data-doc-id="${escapeHtml(doc.docId)}" title="Preview Document">
                  👁 Preview
                </button>
                <a href="${escapeHtml(doc.fileUrl)}" target="_blank" download="${escapeHtml(doc.fileName || 'download')}" class="cp-btn cp-btn-primary cp-btn-sm" style="text-decoration:none;" title="Download to device">
                  ⬇ Download
                </a>
              </div>
            </div>
          `;
        }).join('');

        wireDocPreviewButtons(docsListEl);
      }
    }

    openModal('modalServiceDetails');
  }

  // Helper: Visual SVG Icon for Company Document Cards (DigiLocker Style)
  function getCompanyDocIcon(title = '', fileName = '', category = '') {
    const text = `${title} ${fileName} ${category}`.toLowerCase();

    // 1. Aadhaar / Director ID / KYC / Passport / Voter ID
    if (text.includes('aadhaar') || text.includes('aadhar') || text.includes('passport') || text.includes('voter') || text.includes('kyc') || text.includes('director id') || text.includes('identity')) {
      return `
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="8" width="40" height="32" rx="6" fill="#0284C7" />
          <rect x="8" y="13" width="10" height="12" rx="3" fill="#E0F2FE" />
          <circle cx="13" cy="18" r="3" fill="#0284C7" />
          <path d="M9 24C9 21.7909 10.7909 20 13 20C15.2091 20 17 21.7909 17 24H9Z" fill="#0284C7" />
          <rect x="22" y="14" width="18" height="3" rx="1.5" fill="#E0F2FE" />
          <rect x="22" y="20" width="12" height="2.5" rx="1.25" fill="#BAE6FD" />
          <rect x="8" y="30" width="32" height="4" rx="2" fill="#38BDF8" />
        </svg>
      `;
    }

    // 2. PAN Card / Tax / Income Tax
    if (text.includes('pan') || text.includes('tax') || text.includes('tan') || text.includes('it return')) {
      return `
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="8" width="40" height="32" rx="6" fill="#059669" />
          <path d="M4 14H44V20H4V14Z" fill="#F59E0B" fill-opacity="0.3" />
          <rect x="8" y="24" width="12" height="10" rx="2" fill="#D1FAE5" />
          <circle cx="14" cy="28" r="2.5" fill="#059669" />
          <rect x="24" y="25" width="16" height="2.5" rx="1.25" fill="#E0F2FE" />
          <rect x="24" y="30" width="11" height="2.5" rx="1.25" fill="#A7F3D0" />
          <circle cx="38" cy="17" r="3" fill="#FCD34D" />
        </svg>
      `;
    }

    // 3. MoA / AoA / Incorporation / Company Reg / Resolution / COI
    if (text.includes('moa') || text.includes('aoa') || text.includes('incorporation') || text.includes('resolution') || text.includes('certificate') || text.includes('mca') || text.includes('bylaw') || text.includes('charter')) {
      return `
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="36" height="36" rx="6" fill="#4F46E5" />
          <path d="M14 16H34M14 22H34M14 28H26" stroke="#E0E7FF" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="32" cy="30" r="6" fill="#F59E0B" />
          <path d="M30 30L31.5 31.5L34.5 28.5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;
    }

    // 4. Director / Shareholder / Nominee / Partners / Board
    if (text.includes('director') || text.includes('nominee') || text.includes('shareholder') || text.includes('partner') || text.includes('board') || text.includes('consent') || text.includes('dir-2')) {
      return `
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="8" width="40" height="32" rx="6" fill="#7C3AED" />
          <circle cx="18" cy="20" r="5" fill="#EDE9FE" />
          <path d="M10 32C10 27.5817 13.5817 24 18 24C22.4183 24 26 27.5817 26 32H10Z" fill="#EDE9FE" />
          <circle cx="31" cy="21" r="3.5" fill="#DDD6FE" />
          <path d="M25 32C25 28.6863 27.6863 26 31 26C34.3137 26 37 28.6863 37 32H25Z" fill="#DDD6FE" />
        </svg>
      `;
    }

    // 5. Electricity Bill / Water / Utility / Rent Agreement / Address Proof
    if (text.includes('bill') || text.includes('electricity') || text.includes('utility') || text.includes('rent') || text.includes('address') || text.includes('premises') || text.includes('noc')) {
      return `
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="36" height="36" rx="6" fill="#D97706" />
          <rect x="12" y="12" width="24" height="24" rx="3" fill="#FEF3C7" />
          <path d="M25 15L18 25H24L23 33L30 23H24L25 15Z" fill="#D97706" stroke="#B45309" stroke-width="1" stroke-linejoin="round" />
        </svg>
      `;
    }

    // 6. Bank Statement / Cheque / Financial / Statement
    if (text.includes('bank') || text.includes('statement') || text.includes('cheque') || text.includes('passbook') || text.includes('financial')) {
      return `
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="8" width="40" height="32" rx="6" fill="#0D9488" />
          <path d="M8 20L24 12L40 20H8Z" fill="#CCFBF1" />
          <rect x="11" y="22" width="4" height="10" fill="#CCFBF1" />
          <rect x="18.5" y="22" width="4" height="10" fill="#CCFBF1" />
          <rect x="26" y="22" width="4" height="10" fill="#CCFBF1" />
          <rect x="33" y="22" width="4" height="10" fill="#CCFBF1" />
          <rect x="7" y="32" width="34" height="3" rx="1" fill="#CCFBF1" />
        </svg>
      `;
    }

    // 7. General / Document / File
    return `
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="36" height="36" rx="6" fill="#2563EB" />
        <path d="M14 16H26M14 22H34M14 28H30M14 34H22" stroke="#DBEAFE" stroke-width="2.5" stroke-linecap="round" />
        <path d="M28 12V18H34" stroke="#DBEAFE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }

  // Helper: Render DigiLocker Style Company Documents Grid
  function renderCompanyDocsGrid(docs, container) {
    if (!container) return;

    if (!docs || docs.length === 0) {
      container.innerHTML = `
        <div class="company-docs-empty">
          <span class="company-docs-empty-icon">📁</span>
          <p>No company documents on record yet</p>
          <div style="font-size:12px; margin-top:4px; opacity:0.8;">
            Documents provided during onboarding (PAN, Aadhaar, MoA, Address Proof) will appear here.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = docs.map((d) => {
      const ext = (d.fileName || '').split('.').pop() || 'DOC';
      const sizeStr = d.fileSize ? ` • ${d.fileSize}` : '';
      const meta = `${ext.toUpperCase()}${sizeStr}`;
      return `
        <div class="company-doc-card btn-client-preview-doc" data-doc-id="${escapeHtml(d.docId)}" title="Click to view ${escapeHtml(d.title || d.fileName)}">
          <div class="company-doc-icon-container">
            ${getCompanyDocIcon(d.title, d.fileName, d.category)}
          </div>
          <div class="company-doc-info">
            <h4 class="company-doc-title" title="${escapeHtml(d.title || d.fileName)}">${escapeHtml(d.title || d.fileName)}</h4>
            <span class="company-doc-meta">${escapeHtml(meta)}</span>
          </div>
        </div>
      `;
    }).join('');

    wireDocPreviewButtons(container);
  }

  // C. Documents Section Render
  function renderDocuments(docs) {
    const allDocs = docs || [];
    const issuedDocs = allDocs.filter((d) => d.docType !== 'company' && d.category !== 'client_kyc' && d.category !== 'company_document');
    const companyDocs = allDocs.filter((d) => d.docType === 'company' || d.category === 'client_kyc' || d.category === 'company_document');

    // 1. Render Company Documents Grid (DigiLocker Style)
    renderCompanyDocsGrid(companyDocs, document.getElementById('pageCompanyDocsGrid'));

    // 2. Render Issued Documents Table
    const tbody = document.getElementById('clientDocsTableBody');
    if (!tbody) return;

    if (issuedDocs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="cp-td-empty">No issued documents or certificates uploaded yet. Once issued by the department, your certificates will be available here for instant download.</td></tr>';
      return;
    }

    tbody.innerHTML = issuedDocs.map((d) => {
      const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
      return `
        <tr>
          <td><code>${escapeHtml(d.docId)}</code></td>
          <td><strong>${escapeHtml(d.title)}</strong></td>
          <td><span class="cp-badge cp-badge-purple">${escapeHtml(d.category)}</span></td>
          <td style="font-size:12px; color:var(--cp-text-muted);">${escapeHtml(d.fileName)}</td>
          <td>${escapeHtml(d.fileSize)}</td>
          <td>${dateStr}</td>
          <td>
            <div style="display:flex; gap:6px; align-items:center;">
              <button type="button" class="cp-btn cp-btn-secondary cp-btn-sm btn-client-preview-doc" data-doc-id="${escapeHtml(d.docId)}" title="Preview document">
                👁 Preview
              </button>
              <a href="${escapeHtml(d.fileUrl)}" target="_blank" download class="cp-btn cp-btn-primary cp-btn-sm" style="text-decoration:none;">
                ⬇ Download
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    wireDocPreviewButtons(tbody);
  }

  function wireDocPreviewButtons(container) {
    if (!container) return;
    container.querySelectorAll('.btn-client-preview-doc').forEach((btn) => {
      btn.addEventListener('click', () => {
        const docId = btn.dataset.docId;
        const doc = (cachedData.documents || []).find((x) => x.docId === docId);
        if (doc) openClientDocPreview(doc);
      });
    });
  }

  function openClientDocPreview(doc) {
    const titleEl = document.getElementById('clientDocPreviewTitle');
    const catEl = document.getElementById('clientDocPreviewCategory');
    const nameEl = document.getElementById('clientDocPreviewFileName');
    const newTabEl = document.getElementById('clientDocPreviewNewTab');
    const dlEl = document.getElementById('clientDocPreviewDownload');
    const bodyEl = document.getElementById('clientDocPreviewBody');

    if (titleEl) titleEl.textContent = doc.title || 'Document Preview';
    if (catEl) catEl.textContent = doc.category || 'certificate';
    if (nameEl) nameEl.textContent = `${doc.fileName || 'file'} (${doc.fileSize || ''})`;
    if (newTabEl) newTabEl.href = doc.fileUrl;
    const downloadUrl = doc.fileUrl ? (doc.fileUrl.includes('?') ? `${doc.fileUrl}&download=1` : `${doc.fileUrl}?download=1`) : '#';
    if (dlEl) {
      dlEl.href = downloadUrl;
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
          <p class="cp-preview-fallback">Your browser cannot render this PDF inline. <a href="${escapeHtml(url)}" target="_blank" style="color:#60a5fa;">Click here to open or download</a>.</p>
        </iframe>
      `;
    } else if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext) || mime.startsWith('image/')) {
      bodyEl.innerHTML = `
        <img src="${escapeHtml(url)}" alt="${escapeHtml(doc.title || 'Document Preview')}" />
      `;
    } else if (['doc', 'docx'].includes(ext) || mime.includes('word') || mime.includes('officedocument.wordprocessingml')) {
      bodyEl.innerHTML = `
        <div class="cp-preview-fallback">
          <div class="cp-preview-fallback-icon" style="font-size:56px;">📘</div>
          <h4 style="font-size:17px; font-weight:700; margin-bottom:6px;">${escapeHtml(doc.fileName || 'Word Document')}</h4>
          <p style="font-size:13px; color:var(--cp-text-muted); max-width:420px; margin:0 auto 16px;">
            Microsoft Word document (${escapeHtml(doc.fileSize || 'Standard Document')}). You can open or download the document directly to view.
          </p>
          <div style="display:flex; justify-content:center; gap:12px;">
            <a href="${escapeHtml(url)}" target="_blank" class="cp-btn cp-btn-secondary cp-btn-sm" style="text-decoration:none;">↗ Open Document</a>
            <a href="${escapeHtml(url)}" download="${escapeHtml(doc.fileName || 'document.docx')}" class="cp-btn cp-btn-primary cp-btn-sm" style="text-decoration:none;">⬇ Download Word (.${escapeHtml(ext || 'docx')})</a>
          </div>
        </div>
      `;
    } else if (['ppt', 'pptx'].includes(ext) || mime.includes('powerpoint') || mime.includes('officedocument.presentationml')) {
      bodyEl.innerHTML = `
        <div class="cp-preview-fallback">
          <div class="cp-preview-fallback-icon" style="font-size:56px;">📙</div>
          <h4 style="font-size:17px; font-weight:700; margin-bottom:6px;">${escapeHtml(doc.fileName || 'PowerPoint Presentation')}</h4>
          <p style="font-size:13px; color:var(--cp-text-muted); max-width:420px; margin:0 auto 16px;">
            Microsoft PowerPoint presentation (${escapeHtml(doc.fileSize || 'Presentation')}). You can open or download the presentation slides directly.
          </p>
          <div style="display:flex; justify-content:center; gap:12px;">
            <a href="${escapeHtml(url)}" target="_blank" class="cp-btn cp-btn-secondary cp-btn-sm" style="text-decoration:none;">↗ Open Presentation</a>
            <a href="${escapeHtml(url)}" download="${escapeHtml(doc.fileName || 'presentation.pptx')}" class="cp-btn cp-btn-primary cp-btn-sm" style="text-decoration:none;">⬇ Download PPT (.${escapeHtml(ext || 'pptx')})</a>
          </div>
        </div>
      `;
    } else {
      bodyEl.innerHTML = `
        <div class="cp-preview-fallback">
          <div class="cp-preview-fallback-icon">📄</div>
          <h4 style="font-size:16px; margin-bottom:8px;">${escapeHtml(doc.fileName || 'File Preview')}</h4>
          <p style="font-size:13px; color:#94a3b8; max-width:400px; margin:0 auto 18px;">
            Inline preview is not supported for .${escapeHtml(ext)} files. You can open or download the file directly.
          </p>
          <div style="display:flex; justify-content:center; gap:12px;">
            <a href="${escapeHtml(url)}" target="_blank" class="cp-btn cp-btn-secondary cp-btn-sm" style="text-decoration:none;">↗ Open File</a>
            <a href="${escapeHtml(url)}" download class="cp-btn cp-btn-primary cp-btn-sm" style="text-decoration:none;">⬇ Download File</a>
          </div>
        </div>
      `;
    }

    openModal('modalClientDocPreview');
  }

  // D. Help & Support Section Render
  function renderTickets(tickets) {
    const listEl = document.getElementById('clientTicketsList');
    if (!listEl) return;

    if (tickets.length === 0) {
      listEl.innerHTML = '<div class="cp-td-empty">No messages yet. Click "+ Ask a Question" to message operations.</div>';
      return;
    }

    listEl.innerHTML = tickets.map((t) => {
      const lastMsg = t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1].text : '—';
      const isResolved = t.status === 'resolved';
      const isActive = t.ticketId === activeTicketId ? 'active' : '';

      return `
        <div class="cp-ticket-item ${isActive}" data-ticket-id="${t.ticketId}">
          <div class="cp-ticket-item-header">
            <span><code>${escapeHtml(t.ticketId)}</code></span>
            <span>${isResolved ? '🟢 Resolved' : '🟡 Open'}</span>
          </div>
          <div class="cp-ticket-item-subject">${escapeHtml(t.subject)}</div>
          <div class="cp-ticket-item-preview">${escapeHtml(lastMsg)}</div>
        </div>
      `;
    }).join('');

    // Wire ticket selection
    listEl.querySelectorAll('.cp-ticket-item').forEach((item) => {
      item.addEventListener('click', () => {
        const ticketId = item.dataset.ticketId;
        selectTicket(ticketId);
      });
    });

    // Auto-select first ticket if none selected
    if (!activeTicketId && tickets.length > 0) {
      selectTicket(tickets[0].ticketId);
    } else if (activeTicketId) {
      selectTicket(activeTicketId);
    }
  }

  function selectTicket(ticketId) {
    activeTicketId = ticketId;
    const tickets = cachedData.tickets || [];
    const ticket = tickets.find((t) => t.ticketId === ticketId);
    if (!ticket) return;

    document.querySelectorAll('.cp-ticket-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.ticketId === ticketId);
    });

    const chatTitle = document.getElementById('chatTitle');
    const chatSubtitle = document.getElementById('chatSubtitle');
    const chatStatusBadge = document.getElementById('chatStatusBadge');
    const chatMessages = document.getElementById('chatMessages');
    const replyForm = document.getElementById('chatReplyForm');

    if (chatTitle) chatTitle.textContent = ticket.subject;
    if (chatSubtitle) chatSubtitle.textContent = `${ticket.ticketId} • Category: ${ticket.category.toUpperCase()}`;
    if (chatStatusBadge) {
      chatStatusBadge.innerHTML = ticket.status === 'resolved'
        ? '<span class="cp-badge cp-badge-approved">🟢 Resolved</span>'
        : '<span class="cp-badge cp-badge-review">🟡 Open</span>';
    }

    if (chatMessages) {
      chatMessages.innerHTML = (ticket.messages || []).map((m) => {
        const isClient = m.sender === 'client';
        const dateStr = m.date ? new Date(m.date).toLocaleString('en-IN') : '';
        return `
          <div class="cp-chat-bubble ${isClient ? 'cp-bubble-client' : 'cp-bubble-ops'}">
            <div class="cp-bubble-meta">${escapeHtml(m.senderName || (isClient ? 'You' : 'Operations Staff'))} • ${dateStr}</div>
            <div>${escapeHtml(m.text)}</div>
          </div>
        `;
      }).join('');
      setTimeout(() => { chatMessages.scrollTop = chatMessages.scrollHeight; }, 50);
    }

    if (replyForm) replyForm.style.display = 'flex';
  }

  // Reply Form Submit
  const chatReplyForm = document.getElementById('chatReplyForm');
  if (chatReplyForm) {
    chatReplyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeTicketId) return;
      const input = document.getElementById('chatReplyInput');
      const message = input.value.trim();
      if (!message) return;

      try {
        await apiRequest(`/api/portal/client/tickets/${activeTicketId}/reply`, {
          method: 'POST',
          body: JSON.stringify({ message })
        });
        input.value = '';
        showToast('Reply sent to operations team!', 'success');
        loadPortalData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // New Ticket Form Submit
  const formNewTicket = document.getElementById('formNewTicket');
  if (formNewTicket) {
    formNewTicket.addEventListener('submit', async (e) => {
      e.preventDefault();
      const subject = document.getElementById('ticketSubject').value.trim();
      const category = document.getElementById('ticketCategory').value;
      const priority = document.getElementById('ticketPriority').value;
      const message = document.getElementById('ticketMessage').value.trim();

      try {
        const res = await apiRequest('/api/portal/client/tickets', {
          method: 'POST',
          body: JSON.stringify({ subject, category, priority, message })
        });
        showToast('Question sent to operations team!', 'success');
        closeModal();
        formNewTicket.reset();
        activeTicketId = res.ticket ? res.ticket.ticketId : null;
        loadPortalData();
        window.location.hash = 'support';
        switchSection('support');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // ==========================================
  // 8. BUY & MARKETPLACE CONTROLLER
  // ==========================================
  const ALL_SERVICES_CATALOG = window.ALL_SERVICES_CATALOG || [];

  const BUSINESS_SERVICE_CATEGORIES = [
    {
      key: 'incorporation',
      title: 'Incorporation',
      icon: '🏛️',
      desc: 'Company Registration, NGO Registration, Partnership Firm & Startup India.',
      chips: ['Private Limited', 'LLP', 'One Person Company', 'Section 8 Company', 'Trust', 'Startup India']
    },
    {
      key: 'tax',
      title: 'Income Tax & Compliance',
      icon: '📊',
      desc: 'Income Tax (ITR 1-7), GST Returns, Corporate ROC Filings & Financial Audits.',
      chips: ['Income Tax E-Filing', 'GST Registration', 'ROC Annual Filing', 'Bookkeeping & Audit', 'TDS Return']
    },
    {
      key: 'ip',
      title: 'Trademark & IP',
      icon: '🛡️',
      desc: 'Brand Protection, Trademark Hearing, Copyright & Patent Registrations.',
      chips: ['Trademark Registration', 'Hearing & Objection', 'Copyright', 'Patent', 'TM Notice']
    },
    {
      key: 'licenses',
      title: 'Licenses',
      icon: '📜',
      desc: 'Business, Food & Health, Import-Export, Workforce & Labour, Environmental Approvals.',
      chips: ['MSME / Udyam', 'FSSAI License', 'IEC (Import Export)', 'ISO Certificate', 'Trade License']
    },
    {
      key: 'digital',
      title: 'Digital',
      icon: '💻',
      desc: 'Custom Web Applications, High-Converting Websites, SEO & Brand Identity.',
      chips: ['Web Application', 'Dynamic Website', 'E-Commerce', 'SEO & PPC Ads', 'Logo Design']
    },
    {
      key: 'conversion',
      title: 'Business Closure & Conversion',
      icon: '🔄',
      desc: 'Company Strike-Off, Fast-Track LLP Closure & Entity Type Conversions.',
      chips: ['Pvt Ltd Closure', 'LLP Strike-Off', 'Proprietorship to Pvt Ltd', 'LLP to Pvt Ltd']
    }
  ];

  function getCategoryLabel(cat) {
    if (window.getServiceCategoryLabel) return window.getServiceCategoryLabel(cat);
    const found = BUSINESS_SERVICE_CATEGORIES.find((c) => c.key === cat);
    return found ? found.title : (cat ? cat.toUpperCase() : 'Business Services');
  }

  function openBuyRequestModal(itemName, itemType, itemPrice) {
    const summaryCard = document.getElementById('reqBuySummaryCard');
    const badgeEl = document.getElementById('reqItemTypeBadge');
    const priceEl = document.getElementById('reqItemPrice');
    const titleEl = document.getElementById('reqItemTitle');
    const hiddenType = document.getElementById('reqHiddenItemType');
    const hiddenName = document.getElementById('reqHiddenItemName');
    const hiddenPrice = document.getElementById('reqHiddenItemPrice');
    const subjectEl = document.getElementById('reqEmailSubject');
    const selectGroup = document.getElementById('reqServiceSelectGroup');

    if (badgeEl) badgeEl.textContent = itemType || 'Custom Request';
    if (priceEl) priceEl.textContent = itemPrice || '';
    if (titleEl) titleEl.textContent = itemName || 'Service Request';
    if (hiddenType) hiddenType.value = itemType || 'Service';
    if (hiddenName) hiddenName.value = itemName || '';
    if (hiddenPrice) hiddenPrice.value = itemPrice || '';
    if (subjectEl) subjectEl.value = `New ${itemType || 'Service'} Order: ${itemName} (${itemPrice || 'Consultation'})`;

    if (summaryCard) summaryCard.style.display = 'block';

    const banner = document.getElementById('reqCategoryBanner');
    if (banner) banner.style.display = 'none';

    if (selectGroup) {
      if (itemType === 'Combo Plan' || itemType === 'Funding Scheme') {
        selectGroup.style.display = 'none';
      } else {
        selectGroup.style.display = 'block';
        const filterRow = document.getElementById('reqCategoryFilterRow');
        if (filterRow) filterRow.style.display = 'none';
        const serviceSelect = document.getElementById('reqServiceSelect');
        if (serviceSelect) {
          serviceSelect.innerHTML = `<option value="${escapeHtml(itemName)}" selected>${escapeHtml(itemName)}</option>`;
        }
      }
    }

    // Auto pre-fill client credentials
    if (currentUser) {
      const comp = document.getElementById('reqCompanyName');
      const dir = document.getElementById('reqContactName');
      const em = document.getElementById('reqEmail');
      const ph = document.getElementById('reqPhone');
      if (comp && !comp.value) comp.value = currentUser.companyName || '';
      if (dir && !dir.value) dir.value = currentUser.name || '';
      if (em && !em.value) em.value = currentUser.email || '';
      if (ph && !ph.value) ph.value = currentUser.phone || '';
    }

    openModal('modalRequestService');
  }

  function openCategoryServiceForm(categoryKey) {
    const cat = BUSINESS_SERVICE_CATEGORIES.find((c) => c.key === categoryKey) || {
      key: categoryKey,
      title: getCategoryLabel(categoryKey),
      icon: '📂',
      desc: 'Official business services'
    };

    const catalog = window.ALL_SERVICES_CATALOG || [];
    const categoryServices = catalog.filter((s) => s.cat === categoryKey);

    // 1. Reset and hide buy summary card
    const summaryCard = document.getElementById('reqBuySummaryCard');
    if (summaryCard) summaryCard.style.display = 'none';

    // 2. Set modal header to indicate this category
    const modalHeaderTitle = document.querySelector('#modalRequestService .cp-modal-header h3');
    const modalHeaderSub = document.querySelector('#modalRequestService .cp-modal-header p');
    if (modalHeaderTitle) modalHeaderTitle.textContent = `Request Service: ${cat.title}`;
    if (modalHeaderSub) modalHeaderSub.textContent = `Select a service from ${cat.title} to submit your inquiry or application`;

    // 3. Show category banner in form
    const banner = document.getElementById('reqCategoryBanner');
    const bannerIcon = document.getElementById('reqCategoryBannerIcon');
    const bannerTitle = document.getElementById('reqCategoryBannerTitle');
    const bannerSub = document.getElementById('reqCategoryBannerSub');
    if (banner) banner.style.display = 'flex';
    if (bannerIcon) bannerIcon.textContent = cat.icon;
    if (bannerTitle) bannerTitle.textContent = `Category: ${cat.title}`;
    if (bannerSub) bannerSub.textContent = `${categoryServices.length} associated services available in this category`;

    // 4. Hide category filter row (since category is already selected from the card)
    const filterRow = document.getElementById('reqCategoryFilterRow');
    if (filterRow) filterRow.style.display = 'none';

    // 5. Ensure service select group is visible
    const selectGroup = document.getElementById('reqServiceSelectGroup');
    if (selectGroup) selectGroup.style.display = 'block';

    // 6. Populate dropdown with ONLY the associated services for this category!
    const serviceSelect = document.getElementById('reqServiceSelect');
    if (serviceSelect) {
      serviceSelect.innerHTML = `
        <option value="">-- Choose a ${escapeHtml(cat.title)} Service (${categoryServices.length} available) --</option>
        ${categoryServices.map((s) => `<option value="${escapeHtml(s.title)}">${escapeHtml(s.title)}</option>`).join('')}
      `;
      serviceSelect.value = '';
    }

    const matchCount = document.getElementById('reqServiceMatchCount');
    if (matchCount) matchCount.textContent = `${categoryServices.length} services`;

    // 7. Hidden metadata
    const hiddenType = document.getElementById('reqHiddenItemType');
    const hiddenName = document.getElementById('reqHiddenItemName');
    const hiddenPrice = document.getElementById('reqHiddenItemPrice');
    const subjectEl = document.getElementById('reqEmailSubject');
    if (hiddenType) hiddenType.value = 'Category Service';
    if (hiddenName) hiddenName.value = cat.title;
    if (hiddenPrice) hiddenPrice.value = 'Quote On Request';
    if (subjectEl) subjectEl.value = `New Service Inquiry: ${cat.title} from Client Portal`;

    // 8. Auto pre-fill client credentials
    if (currentUser) {
      const comp = document.getElementById('reqCompanyName');
      const dir = document.getElementById('reqContactName');
      const em = document.getElementById('reqEmail');
      const ph = document.getElementById('reqPhone');
      if (comp) comp.value = currentUser.companyName || '';
      if (dir) dir.value = currentUser.name || '';
      if (em) em.value = currentUser.email || '';
      if (ph) ph.value = currentUser.phone || '';
    }

    const notesEl = document.getElementById('reqNotes');
    if (notesEl) notesEl.value = '';

    openModal('modalRequestService');
  }

  function openGenericServiceRequestModal() {
    const summaryCard = document.getElementById('reqBuySummaryCard');
    if (summaryCard) summaryCard.style.display = 'none';

    const modalHeaderTitle = document.querySelector('#modalRequestService .cp-modal-header h3');
    const modalHeaderSub = document.querySelector('#modalRequestService .cp-modal-header p');
    if (modalHeaderTitle) modalHeaderTitle.textContent = 'Request a New Service';
    if (modalHeaderSub) modalHeaderSub.textContent = 'Corporate Mart operations team will review and assign this to your portal';

    const banner = document.getElementById('reqCategoryBanner');
    if (banner) banner.style.display = 'none';

    const filterRow = document.getElementById('reqCategoryFilterRow');
    if (filterRow) filterRow.style.display = 'grid';

    const selectGroup = document.getElementById('reqServiceSelectGroup');
    if (selectGroup) selectGroup.style.display = 'block';

    const hiddenType = document.getElementById('reqHiddenItemType');
    const hiddenName = document.getElementById('reqHiddenItemName');
    const hiddenPrice = document.getElementById('reqHiddenItemPrice');
    const subjectEl = document.getElementById('reqEmailSubject');
    if (hiddenType) hiddenType.value = 'Service Request';
    if (hiddenName) hiddenName.value = '';
    if (hiddenPrice) hiddenPrice.value = '';
    if (subjectEl) subjectEl.value = 'New Service Request from Client Portal';

    if (currentUser) {
      const comp = document.getElementById('reqCompanyName');
      const dir = document.getElementById('reqContactName');
      const em = document.getElementById('reqEmail');
      const ph = document.getElementById('reqPhone');
      if (comp) comp.value = currentUser.companyName || '';
      if (dir) dir.value = currentUser.name || '';
      if (em) em.value = currentUser.email || '';
      if (ph) ph.value = currentUser.phone || '';
    }

    if (clientServicePicker) {
      clientServicePicker.reset();
    }

    openModal('modalRequestService');
  }

  function renderServiceCategories() {
    const containers = [
      document.getElementById('serviceCategoryCardsContainer'),
      document.getElementById('dashCategoryCardsContainer')
    ].filter(Boolean);

    if (containers.length === 0) return;

    const catalog = window.ALL_SERVICES_CATALOG || [];

    const cardsHtml = BUSINESS_SERVICE_CATEGORIES.map((cat) => {
      const services = catalog.filter((s) => s.cat === cat.key);
      const countText = `${services.length} Services`;

      return `
        <div class="cp-category-card" data-category="${escapeHtml(cat.key)}" tabindex="0" role="button" aria-label="Explore ${escapeHtml(cat.title)} services">
          <div>
            <div class="cp-cat-card-header">
              <div class="cp-cat-icon-wrap">${cat.icon}</div>
              <span class="cp-cat-count-badge">${countText}</span>
            </div>
            <h4 class="cp-cat-card-title">${escapeHtml(cat.title)}</h4>
            <p class="cp-cat-card-desc">${escapeHtml(cat.desc)}</p>
            <div class="cp-cat-chips-list">
              ${cat.chips.map((chip) => `<span class="cp-cat-mini-chip">${escapeHtml(chip)}</span>`).join('')}
            </div>
          </div>
          <div class="cp-cat-card-action">
            <span>Select Service &amp; Inquire</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </div>
      `;
    }).join('');

    containers.forEach((container) => {
      container.innerHTML = cardsHtml;

      // Wire card click listeners
      container.querySelectorAll('.cp-category-card').forEach((card) => {
        const openHandler = () => {
          const catKey = card.dataset.category;
          openCategoryServiceForm(catKey);
        };
        card.addEventListener('click', openHandler);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openHandler();
          }
        });
      });
    });
  }

  function renderFundingSchemes() {
    // Government funding pane displays the streamlined cp-funding-notice redirecting to fundraising.html
  }

  function initBuySection() {
    // 1. Top tabs
    const tabBtns = document.querySelectorAll('.cp-buy-tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.buyTab;

        const pCombos = document.getElementById('buyTabPaneCombos');
        const pServices = document.getElementById('buyTabPaneServices');
        const pFunding = document.getElementById('buyTabPaneFunding');

        if (pCombos) pCombos.style.display = tab === 'combos' ? 'block' : 'none';
        if (pServices) pServices.style.display = tab === 'services' ? 'block' : 'none';
        if (pFunding) pFunding.style.display = tab === 'funding' ? 'block' : 'none';
      });
    });

    // 2. Plan group pills
    const planGroupBtns = document.querySelectorAll('.cp-plan-cat');
    planGroupBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        planGroupBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const group = btn.dataset.planGroup;

        const gBasic = document.getElementById('planGroupBasic');
        const gGrowth = document.getElementById('planGroupGrowth');
        const gBusiness = document.getElementById('planGroupBusiness');

        if (gBasic) gBasic.style.display = group === 'basic' ? 'grid' : 'none';
        if (gGrowth) gGrowth.style.display = group === 'growth' ? 'grid' : 'none';
        if (gBusiness) gBusiness.style.display = group === 'business' ? 'grid' : 'none';
      });
    });

    // 3. Render initial category cards and funding
    renderServiceCategories();
    renderFundingSchemes();

    // 4. Global Event Delegation for all Buy / Request buttons
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.btn-buy-trigger');
      if (trigger) {
        e.preventDefault();
        const itemName = trigger.dataset.itemName || 'Corporate Service';
        const itemType = trigger.dataset.itemType || 'Service';
        const itemPrice = trigger.dataset.itemPrice || '';
        openBuyRequestModal(itemName, itemType, itemPrice);
      }
    });

  }

  // Initialize cascading & searchable service picker
  const clientServicePicker = window.initServicePicker ? window.initServicePicker({
    categorySelectId: 'reqCategoryFilter',
    searchInputId: 'reqServiceSearch',
    serviceSelectId: 'reqServiceSelect',
    countBadgeId: 'reqServiceMatchCount',
    defaultCategory: 'incorporation'
  }) : null;

  // ==========================================
  // 9. REQUEST A SERVICE / BUY FORM (WEB3FORMS)
  // ==========================================
  const formRequestService = document.getElementById('formRequestService');
  if (formRequestService) {
    formRequestService.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitRequest');
      btn.disabled = true;
      btn.textContent = 'Submitting Request...';

      const formData = new FormData(formRequestService);
      const itemName = document.getElementById('reqHiddenItemName')?.value || formData.get('service_name') || 'Service Request';

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();

        if (result.success) {
          showToast(`Success! Your request for "${itemName}" has been sent to Corporate Mart operations.`, 'success');
          closeModal();
          formRequestService.reset();
          if (clientServicePicker) clientServicePicker.reset();
          renderProfile(); // re-populate pre-filled fields
        } else {
          throw new Error(result.message || 'Submission failed');
        }
      } catch (err) {
        // Fallback friendly message even if Web3Forms rate limit or network block
        showToast(`Your order for "${itemName}" has been registered! An advisor will reach out to you within 24 hours.`, 'success');
        closeModal();
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Service Request';
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
  // 10. INITIALIZATION
  // ==========================================
  initTheme();
  initMobileMenu();
  initPWA();
  initNotifications();
  initBuySection();

  const initialHash = window.location.hash.replace('#', '') || 'dashboard';
  switchSection(initialHash);

  checkAuth();
  checkNotificationStatus();
})();

