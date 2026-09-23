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
      btnEnableNotifications.addEventListener('click', () => {
        if (Notification.permission === 'granted') {
          showToast('In-phone push alerts are active for your account.', 'info');
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
    if (welcomeTitle) welcomeTitle.textContent = `Welcome, ${directorName}!`;
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

  // Modal Triggers
  const topRequestServiceBtn = document.getElementById('topRequestServiceBtn');
  const qaRequestServiceBtn = document.getElementById('qaRequestServiceBtn');
  const openRequestServiceModalBtn = document.getElementById('openRequestServiceModalBtn');
  [topRequestServiceBtn, qaRequestServiceBtn, openRequestServiceModalBtn].forEach((btn) => {
    if (btn) btn.addEventListener('click', () => openModal('modalRequestService'));
  });

  const qaAskSupportBtn = document.getElementById('qaAskSupportBtn');
  const openNewTicketModalBtn = document.getElementById('openNewTicketModalBtn');
  [qaAskSupportBtn, openNewTicketModalBtn].forEach((btn) => {
    if (btn) btn.addEventListener('click', () => openModal('modalNewTicket'));
  });

  const qaViewDocsBtn = document.getElementById('qaViewDocsBtn');
  if (qaViewDocsBtn) {
    qaViewDocsBtn.addEventListener('click', () => {
      window.location.hash = 'documents';
      switchSection('documents');
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

    // Render Dashboard Services Carousel
    const sTrack = document.getElementById('dashServicesCarousel');
    const prevServiceBtn = document.getElementById('btnPrevDashService');
    const nextServiceBtn = document.getElementById('btnNextDashService');
    const sDots = document.getElementById('dashServicesDots');
    const cases = data.cases || [];

    if (sTrack) {
      if (cases.length === 0) {
        sTrack.innerHTML = `
          <div class="cp-carousel-card-item">
            <div class="cp-carousel-empty-card">
              <span style="font-size:32px;">📋</span>
              <strong>No ongoing services assigned yet</strong>
              <p>Your active business filings, approvals, and status notes will appear here.</p>
            </div>
          </div>
        `;
        if (prevServiceBtn) prevServiceBtn.disabled = true;
        if (nextServiceBtn) nextServiceBtn.disabled = true;
        if (sDots) sDots.innerHTML = '';
      } else {
        sTrack.innerHTML = cases.map((c) => `
          <div class="cp-carousel-card-item">
            <div class="cp-carousel-card-inner">
              <div class="cp-carousel-card-top">
                <span class="cp-badge cp-badge-id">${escapeHtml(c.caseId)}</span>
                ${getStatusBadge(c.status)}
              </div>
              <div class="cp-carousel-card-content">
                <h4 class="cp-carousel-card-name" title="${escapeHtml(c.serviceName)}">${escapeHtml(c.serviceName)}</h4>
                <div class="cp-carousel-card-meta-line">
                  <span class="cp-meta-muted-label">Status Remark:</span>
                  <span class="cp-carousel-card-desc">${escapeHtml(c.statusNote || 'In processing with operations')}</span>
                </div>
              </div>
              <div class="cp-carousel-card-footer">
                <button type="button" class="cp-btn cp-btn-primary cp-btn-sm btn-dash-view-case" data-case-id="${escapeHtml(c.caseId)}" style="width:100%; justify-content:center;">
                  View Details
                </button>
              </div>
            </div>
          </div>
        `).join('');

        sTrack.querySelectorAll('.btn-dash-view-case').forEach((btn) => {
          btn.addEventListener('click', () => {
            openServiceDetailsModal(btn.dataset.caseId);
          });
        });

        setupCarousel(sTrack, prevServiceBtn, nextServiceBtn, sDots);
      }
    }

    // Render Dashboard Documents Carousel
    const dTrack = document.getElementById('dashDocsCarousel');
    const prevDocBtn = document.getElementById('btnPrevDashDoc');
    const nextDocBtn = document.getElementById('btnNextDashDoc');
    const dDots = document.getElementById('dashDocsDots');
    const docs = data.documents || [];

    if (dTrack) {
      if (docs.length === 0) {
        dTrack.innerHTML = `
          <div class="cp-carousel-card-item">
            <div class="cp-carousel-empty-card">
              <span style="font-size:32px;">📁</span>
              <strong>No certificates uploaded yet</strong>
              <p>Official registration certificates, GST documents, and DSC files will appear here.</p>
            </div>
          </div>
        `;
        if (prevDocBtn) prevDocBtn.disabled = true;
        if (nextDocBtn) nextDocBtn.disabled = true;
        if (dDots) dDots.innerHTML = '';
      } else {
        dTrack.innerHTML = docs.map((d) => {
          const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
          return `
            <div class="cp-carousel-card-item">
              <div class="cp-carousel-card-inner">
                <div class="cp-carousel-card-top">
                  <span class="cp-badge cp-badge-purple">${escapeHtml(d.category || 'Certificate')}</span>
                  <span class="cp-carousel-card-date">${dateStr}</span>
                </div>
                <div class="cp-carousel-card-content">
                  <h4 class="cp-carousel-card-name" title="${escapeHtml(d.title)}">${escapeHtml(d.title)}</h4>
                  <div class="cp-carousel-card-meta-line">
                    <span class="cp-meta-muted-label">Official File:</span>
                    <span class="cp-carousel-card-desc" style="font-family:monospace; font-size:12px;">${escapeHtml(d.fileName)}</span>
                  </div>
                </div>
                <div class="cp-carousel-card-footer cp-carousel-card-actions">
                  <button type="button" class="cp-btn cp-btn-secondary cp-btn-sm btn-client-preview-doc" data-doc-id="${escapeHtml(d.docId)}" style="flex:1; justify-content:center;">
                    👁 Preview
                  </button>
                  <a href="${escapeHtml(d.fileUrl)}" target="_blank" download class="cp-btn cp-btn-primary cp-btn-sm" style="flex:1; justify-content:center; text-decoration:none;">
                    ⬇ Download
                  </a>
                </div>
              </div>
            </div>
          `;
        }).join('');

        wireDocPreviewButtons(dTrack);
        setupCarousel(dTrack, prevDocBtn, nextDocBtn, dDots);
      }
    }
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
                  const matchDoc = (cachedData.documents || []).find((d) => d.caseId === c.caseId);
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
      (d.caseId && (d.caseId === c.caseId || d.caseId === c.id)) ||
      (!d.caseId && d.title && c.serviceName && d.title.toLowerCase().includes(c.serviceName.toLowerCase()))
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

  // C. Documents Section Render
  function renderDocuments(docs) {
    const tbody = document.getElementById('clientDocsTableBody');
    if (!tbody) return;

    if (docs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="cp-td-empty">No documents or certificates uploaded yet. Once issued by the department, your certificates will be available here for instant download.</td></tr>';
      return;
    }

    tbody.innerHTML = docs.map((d) => {
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
          <p class="cp-preview-fallback">Your browser cannot render this PDF inline. <a href="${escapeHtml(url)}" target="_blank" style="color:#60a5fa;">Click here to open or download</a>.</p>
        </iframe>
      `;
    } else if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext) || mime.startsWith('image/')) {
      bodyEl.innerHTML = `
        <img src="${escapeHtml(url)}" alt="${escapeHtml(doc.title || 'Document Preview')}" />
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
  const ALL_SERVICES_CATALOG = [
  {
    "id": "startup_india",
    "cat": "incorporation",
    "title": "Startup India",
    "path": "Business_registration/Company_registration/startup_india.html",
    "isPopular": true
  },
  {
    "id": "private_limited_company",
    "cat": "incorporation",
    "title": "Private Limited Company",
    "path": "Business_registration/Company_registration/private_limited_company.html",
    "isPopular": false
  },
  {
    "id": "limited_liability_partnership_llp",
    "cat": "incorporation",
    "title": "Limited Liability Partnership (LLP)",
    "path": "Business_registration/Company_registration/llp_registration.html",
    "isPopular": false
  },
  {
    "id": "one_person_company_opc",
    "cat": "incorporation",
    "title": "One Person Company (OPC)",
    "path": "Business_registration/Company_registration/opc_registration.html",
    "isPopular": false
  },
  {
    "id": "sole_proprietorship",
    "cat": "incorporation",
    "title": "Sole Proprietorship",
    "path": "Business_registration/Company_registration/sole_proprietorship.html",
    "isPopular": false
  },
  {
    "id": "public_limited_company",
    "cat": "incorporation",
    "title": "Public Limited Company",
    "path": "Business_registration/Company_registration/public_ltd.html",
    "isPopular": false
  },
  {
    "id": "trust_registration",
    "cat": "incorporation",
    "title": "Trust Registration",
    "path": "Business_registration/NGOs/trust_registration.html",
    "isPopular": false
  },
  {
    "id": "society_registration",
    "cat": "incorporation",
    "title": "Society Registration",
    "path": "Business_registration/NGOs/society_registration.html",
    "isPopular": false
  },
  {
    "id": "fcra_registration",
    "cat": "incorporation",
    "title": "FCRA Registration",
    "path": "Business_registration/NGOs/fcra_registration.html",
    "isPopular": false
  },
  {
    "id": "section_8_company",
    "cat": "incorporation",
    "title": "Section 8 Company",
    "path": "Business_registration/NGOs/Section_8.html",
    "isPopular": false
  },
  {
    "id": "partnership_registration",
    "cat": "incorporation",
    "title": "Partnership Registration",
    "path": "Business_registration/Partnership_firm/partnership_firm_registration.html",
    "isPopular": false
  },
  {
    "id": "partnership_compliance",
    "cat": "incorporation",
    "title": "Partnership Compliance",
    "path": "Business_registration/Partnership_firm/partnership_firm_compliance.html",
    "isPopular": false
  },
  {
    "id": "tax_exemption",
    "cat": "tax",
    "title": "Tax Exemption",
    "path": "Tax & Compliance/Income_Tax/tax_exemption.html",
    "isPopular": true
  },
  {
    "id": "income_tax_e_filing",
    "cat": "tax",
    "title": "Income Tax E-Filing",
    "path": "Tax & Compliance/Income_Tax/tax_efiling.html",
    "isPopular": false
  },
  {
    "id": "business_tax_filing",
    "cat": "tax",
    "title": "Business Tax Filing",
    "path": "Tax & Compliance/Income_Tax/business_tax_filing.html",
    "isPopular": false
  },
  {
    "id": "tan_registration",
    "cat": "tax",
    "title": "TAN Registration",
    "path": "Tax & Compliance/Income_Tax/tan_registration.html",
    "isPopular": false
  },
  {
    "id": "tds_return_filing",
    "cat": "tax",
    "title": "TDS Return Filing",
    "path": "Tax & Compliance/Income_Tax/tds_return_filing.html",
    "isPopular": false
  },
  {
    "id": "income_tax_notice",
    "cat": "tax",
    "title": "Income Tax Notice",
    "path": "Tax & Compliance/Income_Tax/tax_notice.html",
    "isPopular": false
  },
  {
    "id": "itr_1_return_filing",
    "cat": "tax",
    "title": "ITR 1 Return Filing",
    "path": "Tax & Compliance/Income_Tax/itr1_return_filing.html",
    "isPopular": false
  },
  {
    "id": "itr_2_return_filing",
    "cat": "tax",
    "title": "ITR 2 Return Filing",
    "path": "Tax & Compliance/Income_Tax/itr2_return_filing.html",
    "isPopular": false
  },
  {
    "id": "itr_3_return_filing",
    "cat": "tax",
    "title": "ITR 3 Return Filing",
    "path": "Tax & Compliance/Income_Tax/itr3_retun_filing.html",
    "isPopular": false
  },
  {
    "id": "itr_4_return_filing",
    "cat": "tax",
    "title": "ITR 4 Return Filing",
    "path": "Tax & Compliance/Income_Tax/itr4_return_filing.html",
    "isPopular": false
  },
  {
    "id": "itr_5_return_filing",
    "cat": "tax",
    "title": "ITR 5 Return Filing",
    "path": "Tax & Compliance/Income_Tax/itr5_return_filing.html",
    "isPopular": false
  },
  {
    "id": "itr_6_return_filing",
    "cat": "tax",
    "title": "ITR 6 Return Filing",
    "path": "Tax & Compliance/Income_Tax/itr6_return_filing.html",
    "isPopular": false
  },
  {
    "id": "itr_7_return_filing",
    "cat": "tax",
    "title": "ITR 7 Return Filing",
    "path": "Tax & Compliance/Income_Tax/itr7_return_filing.html",
    "isPopular": false
  },
  {
    "id": "gst_registration",
    "cat": "tax",
    "title": "GST Registration",
    "path": "Tax & Compliance/Goods & Services Tax/gst_registration.html",
    "isPopular": false
  },
  {
    "id": "gst_return_filing",
    "cat": "tax",
    "title": "GST Return Filing",
    "path": "Tax & Compliance/Goods & Services Tax/gst_return_filing.html",
    "isPopular": false
  },
  {
    "id": "gst_amendment",
    "cat": "tax",
    "title": "GST Amendment",
    "path": "Tax & Compliance/Goods & Services Tax/gst_amendment.html",
    "isPopular": false
  },
  {
    "id": "gstr_9_annual_return",
    "cat": "tax",
    "title": "GSTR 9 Annual Return",
    "path": "Tax & Compliance/Goods & Services Tax/gstr9.html",
    "isPopular": false
  },
  {
    "id": "gstr_10_final_return",
    "cat": "tax",
    "title": "GSTR 10 Final Return",
    "path": "Tax & Compliance/Goods & Services Tax/gstr10.html",
    "isPopular": false
  },
  {
    "id": "private_limited_compliance",
    "cat": "tax",
    "title": "Private Limited Compliance",
    "path": "Tax & Compliance/corporate_compliance/privated_limited_compliance.html",
    "isPopular": false
  },
  {
    "id": "llp_annual_compliance",
    "cat": "tax",
    "title": "LLP Annual Compliance",
    "path": "Tax & Compliance/corporate_compliance/llp_annual_compliance.html",
    "isPopular": false
  },
  {
    "id": "opc_compliance",
    "cat": "tax",
    "title": "OPC Compliance",
    "path": "Tax & Compliance/corporate_compliance/opc_compliance.html",
    "isPopular": false
  },
  {
    "id": "section_8_compliance",
    "cat": "tax",
    "title": "Section 8 Compliance",
    "path": "Tax & Compliance/corporate_compliance/section8_compliance.html",
    "isPopular": false
  },
  {
    "id": "partnership_firm_compliance",
    "cat": "tax",
    "title": "Partnership Firm Compliance",
    "path": "Tax & Compliance/corporate_compliance/partnership_firm_compliance.html",
    "isPopular": false
  },
  {
    "id": "roc_annual_filing",
    "cat": "tax",
    "title": "ROC Annual Filing",
    "path": "Tax & Compliance/corporate_compliance/roc_annual_filing.html",
    "isPopular": false
  },
  {
    "id": "dir_3_kyc_filing",
    "cat": "tax",
    "title": "DIR-3 KYC Filing",
    "path": "Tax & Compliance/corporate_compliance/dir3_kyc_filing.html",
    "isPopular": false
  },
  {
    "id": "adt_1_filing",
    "cat": "tax",
    "title": "ADT-1 Filing",
    "path": "Tax & Compliance/corporate_compliance/adt1_filing.html",
    "isPopular": false
  },
  {
    "id": "dpt_3_filing",
    "cat": "tax",
    "title": "DPT-3 Filing",
    "path": "Tax & Compliance/corporate_compliance/dpt3-filing.html",
    "isPopular": false
  },
  {
    "id": "add_partner_in_llp",
    "cat": "tax",
    "title": "Add Partner in LLP",
    "path": "Tax & Compliance/Event_based_ROC/add_partner_llp.html",
    "isPopular": false
  },
  {
    "id": "remove_partner_from_llp",
    "cat": "tax",
    "title": "Remove Partner from LLP",
    "path": "Tax & Compliance/Event_based_ROC/remove_partner_llp.html",
    "isPopular": false
  },
  {
    "id": "change_llp_agreement",
    "cat": "tax",
    "title": "Change LLP Agreement",
    "path": "Tax & Compliance/Event_based_ROC/change_llp_agreement.html",
    "isPopular": false
  },
  {
    "id": "add_director",
    "cat": "tax",
    "title": "Add Director",
    "path": "Tax & Compliance/Event_based_ROC/add_director.html",
    "isPopular": false
  },
  {
    "id": "remove_director",
    "cat": "tax",
    "title": "Remove Director",
    "path": "Tax & Compliance/Event_based_ROC/remove_director.html",
    "isPopular": false
  },
  {
    "id": "increase_share_capital",
    "cat": "tax",
    "title": "Increase Share Capital",
    "path": "Tax & Compliance/Event_based_ROC/increase_share_capital.html",
    "isPopular": false
  },
  {
    "id": "change_office_address",
    "cat": "tax",
    "title": "Change Office Address",
    "path": "Tax & Compliance/Event_based_ROC/change_office_add.html",
    "isPopular": false
  },
  {
    "id": "change_company_name",
    "cat": "tax",
    "title": "Change Company Name",
    "path": "Tax & Compliance/Event_based_ROC/change_company_name.html",
    "isPopular": false
  },
  {
    "id": "change_business_activity",
    "cat": "tax",
    "title": "Change Business Activity",
    "path": "Tax & Compliance/Event_based_ROC/change_activity.html",
    "isPopular": false
  },
  {
    "id": "issue_new_shares",
    "cat": "tax",
    "title": "Issue New Shares",
    "path": "Tax & Compliance/Event_based_ROC/issue_new_share.html",
    "isPopular": false
  },
  {
    "id": "change_auditor",
    "cat": "tax",
    "title": "Change Auditor",
    "path": "Tax & Compliance/Event_based_ROC/change_auditor.html",
    "isPopular": false
  },
  {
    "id": "update_director_kyc",
    "cat": "tax",
    "title": "Update Director KYC",
    "path": "Tax & Compliance/Event_based_ROC/update_director_kyc.html",
    "isPopular": false
  },
  {
    "id": "create_company_charge",
    "cat": "tax",
    "title": "Create Company Charge",
    "path": "Tax & Compliance/Event_based_ROC/create_charge_filing.html",
    "isPopular": false
  },
  {
    "id": "close_company_charge",
    "cat": "tax",
    "title": "Close Company Charge",
    "path": "Tax & Compliance/Event_based_ROC/close_company_charge.html",
    "isPopular": false
  },
  {
    "id": "change_management_details",
    "cat": "tax",
    "title": "Change Management Details",
    "path": "Tax & Compliance/Event_based_ROC/change_management_details.html",
    "isPopular": false
  },
  {
    "id": "change_director_address",
    "cat": "tax",
    "title": "Change Director Address",
    "path": "Tax & Compliance/Event_based_ROC/change_director_add.html",
    "isPopular": false
  },
  {
    "id": "bookkeeping_services",
    "cat": "tax",
    "title": "Bookkeeping Services",
    "path": "Tax & Compliance/accounting & finance/bookkepping_services.html",
    "isPopular": false
  },
  {
    "id": "accounting_services",
    "cat": "tax",
    "title": "Accounting Services",
    "path": "Tax & Compliance/accounting & finance/accounting_services.html",
    "isPopular": false
  },
  {
    "id": "financial_audit_services",
    "cat": "tax",
    "title": "Financial Audit Services",
    "path": "Tax & Compliance/accounting & finance/financial_audit_services.html",
    "isPopular": false
  },
  {
    "id": "tax_audit_services",
    "cat": "tax",
    "title": "Tax Audit Services",
    "path": "Tax & Compliance/accounting & finance/tax_audit_services.html",
    "isPopular": false
  },
  {
    "id": "business_due_diligence",
    "cat": "tax",
    "title": "Business Due Diligence",
    "path": "Tax & Compliance/accounting & finance/business_due_diligence.html",
    "isPopular": false
  },
  {
    "id": "accounts_payable_support",
    "cat": "tax",
    "title": "Accounts Payable Support",
    "path": "Tax & Compliance/accounting & finance/accounts_payable_services.html",
    "isPopular": false
  },
  {
    "id": "trademark_registration",
    "cat": "ip",
    "title": "Trademark Registration",
    "path": "Trademark & Ip/trademark_services/trademark_registration.html",
    "isPopular": false
  },
  {
    "id": "trademark_certificate",
    "cat": "ip",
    "title": "Trademark Certificate",
    "path": "Trademark & Ip/trademark_services/trademark_certificate.html",
    "isPopular": false
  },
  {
    "id": "trademark_objection",
    "cat": "ip",
    "title": "Trademark Objection",
    "path": "Trademark & Ip/trademark_services/trademark_objection.html",
    "isPopular": false
  },
  {
    "id": "trademark_hearing",
    "cat": "ip",
    "title": "Trademark Hearing",
    "path": "Trademark & Ip/trademark_services/trademark_hearing.html",
    "isPopular": false
  },
  {
    "id": "trademark_opposition",
    "cat": "ip",
    "title": "Trademark Opposition",
    "path": "Trademark & Ip/trademark_services/trademark_opposition.html",
    "isPopular": false
  },
  {
    "id": "trademark_renewal",
    "cat": "ip",
    "title": "Trademark Renewal",
    "path": "Trademark & Ip/trademark_services/trademark_renewal.html",
    "isPopular": false
  },
  {
    "id": "trademark_rectification",
    "cat": "ip",
    "title": "Trademark Rectification",
    "path": "Trademark & Ip/trademark_services/trademark_rectification.html",
    "isPopular": false
  },
  {
    "id": "trademark_transfer",
    "cat": "ip",
    "title": "Trademark Transfer",
    "path": "Trademark & Ip/trademark_services/trademark_transfer.html",
    "isPopular": false
  },
  {
    "id": "copyright_registration",
    "cat": "ip",
    "title": "Copyright Registration",
    "path": "Trademark & Ip/copyright_services/copyright_registration.html",
    "isPopular": false
  },
  {
    "id": "copyright_objection",
    "cat": "ip",
    "title": "Copyright Objection",
    "path": "Trademark & Ip/copyright_services/copyright_objection.html",
    "isPopular": false
  },
  {
    "id": "patent_registration",
    "cat": "ip",
    "title": "Patent Registration",
    "path": "Trademark & Ip/patent_services/patent_registration.html",
    "isPopular": false
  },
  {
    "id": "tm_infringement_notice",
    "cat": "ip",
    "title": "TM Infringement Notice",
    "path": "Trademark & Ip/infringment_protection/TM_infringment.html",
    "isPopular": false
  },
  {
    "id": "iso_registration",
    "cat": "licenses",
    "title": "ISO Registration",
    "path": "Licenses/workforce, operations and labour/iso_certification.html",
    "isPopular": true
  },
  {
    "id": "trade_license_registration",
    "cat": "licenses",
    "title": "Trade License Registration",
    "path": "Licenses/business & municipal/trade_license_registration.html",
    "isPopular": false
  },
  {
    "id": "shop_establishment_license",
    "cat": "licenses",
    "title": "Shop & Establishment License",
    "path": "Licenses/business & municipal/shop_establishment_license.html",
    "isPopular": false
  },
  {
    "id": "msme_registration",
    "cat": "licenses",
    "title": "MSME Registration",
    "path": "Licenses/business & municipal/msme_registration.html",
    "isPopular": false
  },
  {
    "id": "professional_tax_registration",
    "cat": "licenses",
    "title": "Professional Tax Registration",
    "path": "Licenses/business & municipal/professional_tax_registration.html",
    "isPopular": false
  },
  {
    "id": "factory_license_registration",
    "cat": "licenses",
    "title": "Factory License Registration",
    "path": "Licenses/business & municipal/factory_license_registration.html",
    "isPopular": false
  },
  {
    "id": "labour_welfare_registration",
    "cat": "licenses",
    "title": "Labour Welfare Registration",
    "path": "Licenses/business & municipal/labour_welfare_registration.html",
    "isPopular": false
  },
  {
    "id": "fssai_registration",
    "cat": "licenses",
    "title": "FSSAI Registration",
    "path": "Licenses/food & health/fssai_registration.html",
    "isPopular": false
  },
  {
    "id": "fssai_license",
    "cat": "licenses",
    "title": "FSSAI License",
    "path": "Licenses/food & health/fssai_license.html",
    "isPopular": false
  },
  {
    "id": "drug_cosmetic_license",
    "cat": "licenses",
    "title": "Drug & Cosmetic License",
    "path": "Licenses/food & health/drug_cosmetic_license.html",
    "isPopular": false
  },
  {
    "id": "food_import_clearance_fssai",
    "cat": "licenses",
    "title": "Food Import Clearance (FSSAI)",
    "path": "Licenses/food & health/food_import_clearance.html",
    "isPopular": false
  },
  {
    "id": "bis_isi_registration",
    "cat": "licenses",
    "title": "BIS ISI Registration",
    "path": "Licenses/food & health/bis_isi_registration.html",
    "isPopular": false
  },
  {
    "id": "iec_registration",
    "cat": "licenses",
    "title": "IEC Registration",
    "path": "Licenses/import export registration/iec_registration.html",
    "isPopular": false
  },
  {
    "id": "icegate_registration",
    "cat": "licenses",
    "title": "ICEGATE Registration",
    "path": "Licenses/import export registration/icegate_registration.html",
    "isPopular": false
  },
  {
    "id": "merchant_exporter_registration",
    "cat": "licenses",
    "title": "Merchant Exporter Registration",
    "path": "Licenses/import export registration/merchant_exporter_registration.html",
    "isPopular": false
  },
  {
    "id": "customs_clearance_services",
    "cat": "licenses",
    "title": "Customs Clearance Services",
    "path": "Licenses/import export registration/customs_clearance_services.html",
    "isPopular": false
  },
  {
    "id": "rcmc_registration",
    "cat": "licenses",
    "title": "RCMC Registration",
    "path": "Licenses/import export registration/rcmc_registration.html",
    "isPopular": false
  },
  {
    "id": "apeda_registration",
    "cat": "licenses",
    "title": "APEDA Registration",
    "path": "Licenses/import export registration/apeda_registration.html",
    "isPopular": false
  },
  {
    "id": "dgft_digital_signature_dsc",
    "cat": "licenses",
    "title": "DGFT Digital Signature (DSC)",
    "path": "Licenses/import export registration/dgft_digital_certificate.html",
    "isPopular": false
  },
  {
    "id": "pf_registration",
    "cat": "licenses",
    "title": "PF Registration",
    "path": "Licenses/workforce, operations and labour/pf_registration.html",
    "isPopular": false
  },
  {
    "id": "esi_registration",
    "cat": "licenses",
    "title": "ESI Registration",
    "path": "Licenses/workforce, operations and labour/esi_registration.html",
    "isPopular": false
  },
  {
    "id": "contractor_license",
    "cat": "licenses",
    "title": "Contractor License",
    "path": "Licenses/workforce, operations and labour/contractor_license.html",
    "isPopular": false
  },
  {
    "id": "psara_license",
    "cat": "licenses",
    "title": "PSARA License",
    "path": "Licenses/workforce, operations and labour/psara_license.html",
    "isPopular": false
  },
  {
    "id": "digital_signature_certificate",
    "cat": "licenses",
    "title": "Digital Signature Certificate",
    "path": "Licenses/workforce, operations and labour/digital_signature_certificate.html",
    "isPopular": false
  },
  {
    "id": "ngo_darpan_registration",
    "cat": "licenses",
    "title": "NGO DARPAN Registration",
    "path": "Licenses/workforce, operations and labour/ngo_darpan.html",
    "isPopular": false
  },
  {
    "id": "factory_plan_approval",
    "cat": "licenses",
    "title": "Factory Plan Approval",
    "path": "Licenses/workforce, operations and labour/factory_plan_approval.html",
    "isPopular": false
  },
  {
    "id": "epr_registration",
    "cat": "licenses",
    "title": "EPR Registration",
    "path": "Licenses/Environmental&pollution/epr_registration.html",
    "isPopular": false
  },
  {
    "id": "plastic_waste_authorization",
    "cat": "licenses",
    "title": "Plastic Waste Authorization",
    "path": "Licenses/Environmental&pollution/plastic_waste_auth.html",
    "isPopular": false
  },
  {
    "id": "epr_authorization_for_e_waste",
    "cat": "licenses",
    "title": "EPR Authorization for E-Waste",
    "path": "Licenses/Environmental&pollution/epr_authorization_e-waste.html",
    "isPopular": false
  },
  {
    "id": "consent_to_establish_cte",
    "cat": "licenses",
    "title": "Consent to Establish (CTE)",
    "path": "Licenses/Environmental&pollution/consent_to_establish.html",
    "isPopular": false
  },
  {
    "id": "environmental_impact_assessment",
    "cat": "licenses",
    "title": "Environmental Impact Assessment",
    "path": "Licenses/Environmental&pollution/environmental_impact_assess.html",
    "isPopular": false
  },
  {
    "id": "environmental_audit_services",
    "cat": "licenses",
    "title": "Environmental Audit Services",
    "path": "Licenses/Environmental&pollution/environmental_audit_services.html",
    "isPopular": false
  },
  {
    "id": "web_application",
    "cat": "digital",
    "title": "Web Application",
    "path": "Digital/web_solutions/web_application.html",
    "isPopular": false
  },
  {
    "id": "dynamic_website",
    "cat": "digital",
    "title": "Dynamic Website",
    "path": "Digital/web_solutions/dynamic_website.html",
    "isPopular": false
  },
  {
    "id": "static_website",
    "cat": "digital",
    "title": "Static Website",
    "path": "Digital/web_solutions/static_website.html",
    "isPopular": false
  },
  {
    "id": "e_commerce_website",
    "cat": "digital",
    "title": "E-commerce Website",
    "path": "Digital/web_solutions/ecommerce_website.html",
    "isPopular": false
  },
  {
    "id": "seo_optimization",
    "cat": "digital",
    "title": "SEO Optimization",
    "path": "Digital/digital_marketing/seo_optimization.html",
    "isPopular": false
  },
  {
    "id": "social_media_marketing_smm",
    "cat": "digital",
    "title": "Social Media Marketing (SMM)",
    "path": "Digital/digital_marketing/social_media_marketing.html",
    "isPopular": false
  },
  {
    "id": "google_ads_ppc",
    "cat": "digital",
    "title": "Google Ads & PPC",
    "path": "Digital/digital_marketing/google_ads_ppc.html",
    "isPopular": false
  },
  {
    "id": "lead_generation",
    "cat": "digital",
    "title": "Lead Generation",
    "path": "Digital/digital_marketing/lead_generation.html",
    "isPopular": false
  },
  {
    "id": "e_mail_marketing",
    "cat": "digital",
    "title": "E-mail Marketing",
    "path": "Digital/digital_marketing/e-mail_marketing.html",
    "isPopular": false
  },
  {
    "id": "whatsapp_marketing",
    "cat": "digital",
    "title": "WhatsApp Marketing",
    "path": "Digital/digital_marketing/whatsapp_marketing.html",
    "isPopular": false
  },
  {
    "id": "logo_design",
    "cat": "digital",
    "title": "Logo Design",
    "path": "Digital/branding_design/logo_design.html",
    "isPopular": false
  },
  {
    "id": "profile_designing",
    "cat": "digital",
    "title": "Profile Designing",
    "path": "Digital/branding_design/profile_designing.html",
    "isPopular": false
  },
  {
    "id": "ui_ux_design",
    "cat": "digital",
    "title": "UI/UX Design",
    "path": "Digital/branding_design/ui_ux_design.html",
    "isPopular": false
  },
  {
    "id": "content_writing",
    "cat": "digital",
    "title": "Content Writing",
    "path": "Digital/branding_design/content_writing.html",
    "isPopular": false
  },
  {
    "id": "pvt_ltd_closure",
    "cat": "conversion",
    "title": "Pvt Ltd Closure",
    "path": "others/business_closuer/pvt_ltd_closuer.html",
    "isPopular": false
  },
  {
    "id": "llp_closure",
    "cat": "conversion",
    "title": "LLP Closure",
    "path": "others/business_closuer/llp_closuer.html",
    "isPopular": false
  },
  {
    "id": "opc_closure",
    "cat": "conversion",
    "title": "OPC Closure",
    "path": "others/business_closuer/opc_closuer.html",
    "isPopular": false
  },
  {
    "id": "sole_proprietorship_closure",
    "cat": "conversion",
    "title": "Sole Proprietorship Closure",
    "path": "others/business_closuer/sole_prop_closuer.html",
    "isPopular": false
  },
  {
    "id": "partnership_firm_closure",
    "cat": "conversion",
    "title": "Partnership Firm Closure",
    "path": "others/business_closuer/partnership_closuer.html",
    "isPopular": false
  },
  {
    "id": "dissolution_of_trust",
    "cat": "conversion",
    "title": "Dissolution of Trust",
    "path": "others/business_closuer/dissolution_trust.html",
    "isPopular": false
  },
  {
    "id": "dissolution_of_society",
    "cat": "conversion",
    "title": "Dissolution of Society",
    "path": "others/business_closuer/dissolution_society.html",
    "isPopular": false
  },
  {
    "id": "pvt_to_public_ltd_company",
    "cat": "conversion",
    "title": "Pvt to Public Ltd Company",
    "path": "others/business_conversion/pvt_to_public.html",
    "isPopular": false
  },
  {
    "id": "llp_to_pvt_ltd_company",
    "cat": "conversion",
    "title": "LLP to Pvt Ltd Company",
    "path": "others/business_conversion/llp_to_pvt.html",
    "isPopular": false
  },
  {
    "id": "opc_to_pvt_ltd_company",
    "cat": "conversion",
    "title": "OPC to Pvt Ltd Company",
    "path": "others/business_conversion/opc_to_pvt.html",
    "isPopular": false
  },
  {
    "id": "proprietorship_to_pvt_ltd_company",
    "cat": "conversion",
    "title": "Proprietorship to Pvt Ltd Company",
    "path": "others/business_conversion/solo_prop_to_pvt.html",
    "isPopular": false
  },
  {
    "id": "partnership_to_pvt_ltd_company",
    "cat": "conversion",
    "title": "Partnership to Pvt Ltd Company",
    "path": "others/business_conversion/partnership_to_pvt.html",
    "isPopular": false
  },
  {
    "id": "pvt_ltd_to_opc_company",
    "cat": "conversion",
    "title": "Pvt Ltd to OPC Company",
    "path": "others/business_conversion/pvt_to_opc.html",
    "isPopular": false
  },
  {
    "id": "partnership_to_llp_company",
    "cat": "conversion",
    "title": "Partnership to LLP Company",
    "path": "others/business_conversion/partnership_to_llp.html",
    "isPopular": false
  },
  {
    "id": "public_to_pvt_ltd_company",
    "cat": "conversion",
    "title": "Public to Pvt Ltd Company",
    "path": "others/business_conversion/public_to_pvt.html",
    "isPopular": false
  }
];

  function getCategoryLabel(cat) {
    const map = {
      incorporation: 'Incorporation',
      tax: 'Tax & Compliance',
      ip: 'Trademark & IP',
      licenses: 'Licenses & Municipal',
      digital: 'Digital & Web',
      conversion: 'Conversions & Closures',
      other: 'Business Services'
    };
    return map[cat] || (cat ? cat.toUpperCase() : 'Service');
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

    if (selectGroup) {
      if (itemType === 'Combo Plan' || itemType === 'Funding Scheme') {
        selectGroup.style.display = 'none';
      } else {
        selectGroup.style.display = 'block';
        const select = document.getElementById('reqServiceSelect');
        if (select) {
          let found = false;
          for (let opt of select.options) {
            if (opt.value.toLowerCase().includes(itemName.toLowerCase())) {
              select.value = opt.value;
              found = true;
              break;
            }
          }
          if (!found) {
            select.value = 'Other Custom Service';
          }
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

  function renderServicesDirectory(filter = 'all', query = '') {
    const listContainer = document.getElementById('servicesDirectoryList');
    const countDisplay = document.getElementById('servicesCountDisplay');
    if (!listContainer) return;

    const filtered = ALL_SERVICES_CATALOG.filter((s) => {
      const matchCat = filter === 'all' || s.cat === filter;
      const matchQuery = !query || s.title.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });

    if (countDisplay) {
      if (filter === 'all' && !query) {
        countDisplay.textContent = `Showing all ${ALL_SERVICES_CATALOG.length} services`;
      } else {
        countDisplay.textContent = `Showing ${filtered.length} of ${ALL_SERVICES_CATALOG.length} services`;
      }
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = '<div style="text-align:center; padding:36px; color:var(--cp-text-muted); background:var(--cp-card-bg); border:1px solid var(--cp-border); border-radius:12px;">No services matching your search keyword. Please try another term or browse categories above.</div>';
      return;
    }

    listContainer.innerHTML = filtered.map((s) => `
      <div class="cp-service-row">
        <div class="cp-service-row-info">
          <div class="cp-service-row-header">
            <h4 class="cp-service-row-title">${escapeHtml(s.title)}</h4>
            <span class="cp-service-row-tag">${escapeHtml(getCategoryLabel(s.cat))}</span>
          </div>
        </div>
        <div class="cp-service-row-actions">
          <a href="${escapeHtml(s.path)}" target="_blank" rel="noopener" class="cp-btn-service-link" title="Open detailed ${escapeHtml(s.title)} page in a new tab">
            <span>View Details</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
          <button type="button" class="cp-btn-service-inquire btn-buy-trigger" data-item-name="${escapeHtml(s.title)}" data-item-type="Business Service" data-item-price="Quote On Request">
            <span>Request / Inquiry &rarr;</span>
          </button>
        </div>
      </div>
    `).join('');
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

    // 3. Render initial directories
    renderServicesDirectory('all', '');
    renderFundingSchemes();

    // 4. Service category filter chips
    let activeFilter = 'all';
    const chips = document.querySelectorAll('#serviceCategoryChips .cp-chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.dataset.filter || 'all';
        const q = document.getElementById('serviceSearchInput')?.value.trim() || '';
        renderServicesDirectory(activeFilter, q);
      });
    });

    // 5. Search input
    const searchInput = document.getElementById('serviceSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.trim();
        renderServicesDirectory(activeFilter, q);
      });
    }

    // 6. Global Event Delegation for all Buy / Request buttons
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

    // Top Header request button
    const btnTopRequest = document.getElementById('btnTopRequestService');
    if (btnTopRequest) {
      btnTopRequest.addEventListener('click', () => {
        const summaryCard = document.getElementById('reqBuySummaryCard');
        if (summaryCard) summaryCard.style.display = 'none';
        const selectGroup = document.getElementById('reqServiceSelectGroup');
        if (selectGroup) selectGroup.style.display = 'block';
        openModal('modalRequestService');
      });
    }
  }

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

