/**
 * Corporate Mart - Virtual Assistant Chatbot (Lead Generation Widget)
 * Interactive conversational lead capture inspired by RegisterKaro AI Assistant
 */

(function () {
  "use strict";

  const HELPLINE_PHONE = "7041554148";
  const WHATSAPP_PHONE = "917041554148";
  const ASSISTANT_AVATAR_IMG = "images/ai_female_assistant.jpg";

  let leadData = {
    service: "",
    name: "",
    phone: "",
    email: "",
    details: ""
  };

  let currentStep = "SERVICE"; // SERVICE -> SUB_SERVICE -> NAME -> PHONE -> EMAIL -> DETAILS -> DONE
  let isWidgetOpen = false;

  const SERVICES = [
    { id: "company_reg", label: "🏢 Company Registration (Pvt Ltd, LLP, OPC)", subPrompt: true },
    { id: "gst_tax", label: "📑 GST, Accounting & Tax Filings" },
    { id: "trademark_ip", label: "™️ Trademark & IP Protection" },
    { id: "iso_licenses", label: "📜 ISO & Business Licenses" },
    { id: "startup_funding", label: "💰 Startup Grants & Funding Schemes" },
    { id: "custom_query", label: "💬 Other Legal / Compliance Query" }
  ];

  const COMPANY_TYPES = [
    "Private Limited Company",
    "Limited Liability Partnership (LLP)",
    "One Person Company (OPC)",
    "Section 8 NGO / Non-Profit",
    "Public Limited Company",
    "Not sure yet (Need guidance)"
  ];

  const CITY_CHIPS = [
    "Deciding Soon",
    "Delhi NCR",
    "Mumbai",
    "Bengaluru",
    "Hyderabad",
    "Ahmedabad",
    "Pune",
    "Kolkata"
  ];

  // Helper: Format current time (e.g. 10:45 AM)
  function getCurrentTime() {
    const d = new Date();
    let hours = d.getHours();
    let minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  }

  // Inject Chatbot Markup
  function injectChatbotDOM() {
    if (document.getElementById("cmBotWidget")) return;

    const html = `
      <!-- Floating Virtual Assistant Trigger & Teaser -->
      <div class="cm-bot-launcher" id="cmBotLauncher">
        <div class="cm-bot-teaser" id="cmBotTeaser" role="button" aria-label="Open chat assistant">
          <div class="cm-bot-teaser-avatar">
            <img src="${ASSISTANT_AVATAR_IMG}" alt="Priya - AI Assistant" />
          </div>
          <div class="cm-bot-teaser-text">
            <strong>Priya • Compliance Expert</strong>
            <span>👋 Need help? Chat with me now!</span>
          </div>
          <button type="button" class="cm-bot-teaser-close" id="cmBotTeaserClose" aria-label="Dismiss">&times;</button>
          <div class="cm-bot-teaser-arrow"></div>
        </div>

        <button type="button" class="cm-bot-btn" id="cmBotBtn" aria-label="Toggle Virtual Assistant" title="CorporateMart Virtual Assistant">
          <span class="cm-bot-status-dot"></span>
          <span class="cm-bot-btn-icon-chat">
            <img src="${ASSISTANT_AVATAR_IMG}" alt="CorporateMart Assistant" class="cm-bot-launcher-avatar" />
          </span>
          <span class="cm-bot-btn-icon-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        </button>
      </div>

      <!-- Chatbot Window -->
      <div class="cm-bot-widget" id="cmBotWidget" aria-hidden="true">
        <!-- Header -->
        <div class="cm-bot-header">
          <div class="cm-bot-header-info">
            <div class="cm-bot-avatar">
              <img src="${ASSISTANT_AVATAR_IMG}" alt="Priya - CorporateMart Assistant" class="cm-bot-avatar-img" />
              <span class="cm-bot-avatar-online"></span>
            </div>
            <div class="cm-bot-title-group">
              <h3>Priya • Virtual Assistant</h3>
              <p><span>🟢</span> Online • Verified Compliance Desk</p>
            </div>
          </div>
          <div class="cm-bot-header-actions">
            <button type="button" class="cm-bot-header-btn" id="cmBotRestartBtn" title="Restart Conversation">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
            </button>
            <button type="button" class="cm-bot-header-btn" id="cmBotCloseBtn" title="Close" aria-label="Close Chat">
              &times;
            </button>
          </div>
        </div>

        <!-- Chat Body -->
        <div class="cm-bot-body" id="cmBotBody">
          <div class="cm-bot-date-divider">Today • Real-time Assistance</div>
          <!-- Messages will be injected here -->
        </div>

        <!-- Footer / Input Form -->
        <div class="cm-bot-footer">
          <form class="cm-bot-input-form" id="cmBotForm">
            <input type="text" class="cm-bot-input" id="cmBotInput" placeholder="Choose an option above or type..." autocomplete="off">
            <button type="submit" class="cm-bot-send-btn" id="cmBotSendBtn" aria-label="Send Message">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
          <p class="cm-bot-powered">🔒 100% Confidential • Corporate Mart Legal Services</p>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);
  }

  // Append a message bubble to the chat
  function appendMessage(sender, text, htmlContent = "") {
    const body = document.getElementById("cmBotBody");
    if (!body) return null;

    const row = document.createElement("div");
    row.className = `cm-msg-row ${sender}`;

    const time = getCurrentTime();

    if (sender === "bot") {
      row.innerHTML = `
        <div class="cm-msg-avatar">
          <img src="${ASSISTANT_AVATAR_IMG}" alt="Priya" class="cm-msg-avatar-img" />
        </div>
        <div>
          <div class="cm-msg-bubble">${text || htmlContent}</div>
          <span class="cm-msg-time">${time}</span>
        </div>
      `;
    } else {
      row.innerHTML = `
        <div>
          <div class="cm-msg-bubble">${escapeHtml(text)}</div>
          <span class="cm-msg-time">${time}</span>
        </div>
      `;
    }

    body.appendChild(row);
    scrollChatToBottom();
    return row;
  }

  // Show realistic typing dots
  function showTyping(callback, delay = 600) {
    const body = document.getElementById("cmBotBody");
    if (!body) return;

    const typingRow = document.createElement("div");
    typingRow.className = "cm-msg-row bot cm-typing-row";
    typingRow.innerHTML = `
      <div class="cm-msg-avatar">
        <img src="${ASSISTANT_AVATAR_IMG}" alt="Priya" class="cm-msg-avatar-img" />
      </div>
      <div class="cm-typing-bubble">
        <span class="cm-typing-dot"></span>
        <span class="cm-typing-dot"></span>
        <span class="cm-typing-dot"></span>
      </div>
    `;

    body.appendChild(typingRow);
    scrollChatToBottom();

    setTimeout(() => {
      typingRow.remove();
      if (typeof callback === "function") callback();
    }, delay);
  }

  // Render clickable chips
  function renderChips(chipsList, onSelect) {
    const body = document.getElementById("cmBotBody");
    if (!body) return;

    const container = document.createElement("div");
    container.className = "cm-bot-chips-container";

    chipsList.forEach((item) => {
      const label = typeof item === "string" ? item : item.label;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cm-bot-chip";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        container.querySelectorAll(".cm-bot-chip").forEach((b) => (b.disabled = true));
        btn.classList.add("selected");
        onSelect(item);
      });
      container.appendChild(btn);
    });

    body.appendChild(container);
    scrollChatToBottom();
  }

  function scrollChatToBottom() {
    const body = document.getElementById("cmBotBody");
    if (body) {
      setTimeout(() => {
        body.scrollTop = body.scrollHeight;
      }, 50);
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // -------------------------------------------------------------------------
  // CONVERSATIONAL STATE MACHINE
  // -------------------------------------------------------------------------

  function startConversation() {
    currentStep = "SERVICE";
    leadData = { service: "", name: "", phone: "", email: "", details: "" };

    const body = document.getElementById("cmBotBody");
    if (body) {
      body.innerHTML = '<div class="cm-bot-date-divider">Today • Real-time Assistance</div>';
    }

    const input = document.getElementById("cmBotInput");
    if (input) {
      input.value = "";
      input.placeholder = "Select an option above or type...";
      input.type = "text";
    }

    showTyping(() => {
      appendMessage(
        "bot",
        "Hello! 👋 I'm <strong>Priya</strong>, your Virtual Legal & Compliance Assistant at <strong>Corporate Mart</strong>.<br><br>What business service can I help you with today?"
      );

      renderChips(SERVICES, (selectedService) => {
        leadData.service = selectedService.label.replace(/^[^\w\s]+/, "").trim();
        appendMessage("user", selectedService.label);

        if (selectedService.subPrompt) {
          askSubService();
        } else {
          askName();
        }
      });
    }, 450);
  }

  function askSubService() {
    currentStep = "SUB_SERVICE";
    showTyping(() => {
      appendMessage("bot", "Great choice! Which entity type are you looking to register?");
      renderChips(COMPANY_TYPES, (selectedType) => {
        leadData.service = `Company Registration: ${selectedType}`;
        appendMessage("user", selectedType);
        askName();
      });
    }, 550);
  }

  function askName() {
    currentStep = "NAME";
    const input = document.getElementById("cmBotInput");
    if (input) {
      input.placeholder = "Type your full name...";
      input.type = "text";
      input.focus();
    }

    showTyping(() => {
      appendMessage(
        "bot",
        `Got it! To prepare your free consultation checklist and quotation, <strong>what is your full name?</strong>`
      );
    }, 550);
  }

  function askPhone() {
    currentStep = "PHONE";
    const input = document.getElementById("cmBotInput");
    if (input) {
      input.placeholder = "Enter 10-digit WhatsApp number...";
      input.type = "tel";
      input.focus();
    }

    showTyping(() => {
      appendMessage(
        "bot",
        `Nice to connect, <strong>${escapeHtml(leadData.name)}</strong>! What is your <strong>10-digit mobile or WhatsApp number</strong> so our senior compliance specialist can reach you?`
      );
    }, 500);
  }

  function askEmail() {
    currentStep = "EMAIL";
    const input = document.getElementById("cmBotInput");
    if (input) {
      input.placeholder = "Enter your email address...";
      input.type = "email";
      input.focus();
    }

    showTyping(() => {
      appendMessage(
        "bot",
        `Thank you! What is your <strong>email address</strong> so we can send you the official document checklist and fee estimate?`
      );
    }, 500);
  }

  function askDetails() {
    currentStep = "DETAILS";
    const input = document.getElementById("cmBotInput");
    if (input) {
      input.placeholder = "Company name or city (or tap above)...";
      input.type = "text";
      input.focus();
    }

    showTyping(() => {
      appendMessage(
        "bot",
        `Almost done! Do you already have a <strong>proposed business name</strong> in mind, or which <strong>state/city</strong> are you setting up in?`
      );

      renderChips(CITY_CHIPS, (chip) => {
        leadData.details = chip;
        appendMessage("user", chip);
        submitLeadData();
      });
    }, 500);
  }

  // Final Step: Submit lead payload and show celebratory completion
  async function submitLeadData() {
    currentStep = "DONE";
    const input = document.getElementById("cmBotInput");
    if (input) {
      input.disabled = true;
      input.placeholder = "Inquiry submitted successfully!";
    }
    const sendBtn = document.getElementById("cmBotSendBtn");
    if (sendBtn) sendBtn.disabled = true;

    // Show submitting animation
    showTyping(async () => {
      try {
        localStorage.setItem("corporateMart_leadSubmitted", "true");
        localStorage.setItem("corporateMart_leadName", leadData.name);
        localStorage.setItem("corporateMart_leadPhone", leadData.phone);
        localStorage.setItem("corporateMart_leadEmail", leadData.email);
        localStorage.setItem("corporateMart_leadService", leadData.service);
      } catch (e) {}

      // Submit to Secure Backend Relay (Zero API keys in client-side code)
      try {
        const payload = {
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
          service: leadData.service,
          details: leadData.details || "Not specified",
          source: "Floating Virtual Assistant Chatbot"
        };

        fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        }).catch((err) => console.warn("Chatbot lead submit error:", err));
      } catch (err) {
        console.warn("Submit error:", err);
      }

      const cleanService = encodeURIComponent(leadData.service || "Legal & Compliance Services");
      const cleanName = encodeURIComponent(leadData.name || "Client");
      const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=Hi%20Corporate%20Mart,%20my%20name%20is%20${cleanName}.%20I%20just%20submitted%20a%20request%20for%20*${cleanService}*.%20Please%20guide%20me%20with%20next%20steps.`;

      appendMessage(
        "bot",
        `🎉 <strong>Thank you, ${escapeHtml(leadData.name)}!</strong><br><br>Your inquiry for <strong>${escapeHtml(leadData.service)}</strong> has been registered. Our senior compliance expert will call you on <strong>${escapeHtml(leadData.phone)}</strong> within 15 minutes.`
      );

      // Render direct Action Card
      const body = document.getElementById("cmBotBody");
      if (body) {
        const actionCard = document.createElement("div");
        actionCard.className = "cm-bot-success-card";
        actionCard.innerHTML = `
          <h4><span>✅</span> Priority Request Logged</h4>
          <p>Need urgent assistance or have immediate questions? Connect directly with our desk:</p>
          <div class="cm-bot-cta-grid">
            <a href="${whatsappUrl}" target="_blank" rel="noopener" class="cm-bot-cta-btn cm-bot-cta-whatsapp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.586-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z"/>
              </svg>
              Chat on WhatsApp Now
            </a>
            <a href="tel:${HELPLINE_PHONE}" class="cm-bot-cta-btn cm-bot-cta-call">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.24 1.02l-2.2 2.19z"/>
              </svg>
              Call Expert: ${HELPLINE_PHONE}
            </a>
            <button type="button" class="cm-bot-cta-btn cm-bot-cta-restart" id="cmBotSuccessRestart">
              🔄 Start New Inquiry
            </button>
          </div>
        `;
        body.appendChild(actionCard);

        const restartBtn = actionCard.querySelector("#cmBotSuccessRestart");
        if (restartBtn) {
          restartBtn.addEventListener("click", () => {
            const inputEl = document.getElementById("cmBotInput");
            if (inputEl) inputEl.disabled = false;
            const sendBtnEl = document.getElementById("cmBotSendBtn");
            if (sendBtnEl) sendBtnEl.disabled = false;
            startConversation();
          });
        }

        scrollChatToBottom();
      }
    }, 650);
  }

  // Handle Free-Text Submission from the Input Box
  function handleInputSubmit(e) {
    if (e) e.preventDefault();
    const input = document.getElementById("cmBotInput");
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    input.value = "";

    switch (currentStep) {
      case "SERVICE":
      case "SUB_SERVICE":
        leadData.service = val;
        appendMessage("user", val);
        askName();
        break;

      case "NAME":
        if (val.length < 2) {
          appendMessage("bot", "Please enter your full name so we can address you properly.");
          return;
        }
        leadData.name = val;
        appendMessage("user", val);
        askPhone();
        break;

      case "PHONE": {
        const cleanPhone = val.replace(/\D/g, "");
        if (cleanPhone.length < 10) {
          appendMessage(
            "bot",
            "Please enter a valid 10-digit mobile or WhatsApp number (e.g. 9876543210)."
          );
          return;
        }
        leadData.phone = cleanPhone.slice(-10);
        appendMessage("user", leadData.phone);
        askEmail();
        break;
      }

      case "EMAIL": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          appendMessage("bot", "Please provide a valid email address (e.g. name@company.com).");
          return;
        }
        leadData.email = val.toLowerCase();
        appendMessage("user", val);
        askDetails();
        break;
      }

      case "DETAILS":
        leadData.details = val;
        appendMessage("user", val);
        submitLeadData();
        break;

      case "DONE":
        appendMessage("user", val);
        showTyping(() => {
          appendMessage(
            "bot",
            `Thank you! Your note has been added to your inquiry. Our advisor will discuss this with you on call.`
          );
        }, 500);
        break;
    }
  }

  // -------------------------------------------------------------------------
  // TOGGLE & DISPLAY CONTROLS
  // -------------------------------------------------------------------------

  function openChatWidget() {
    const widget = document.getElementById("cmBotWidget");
    const teaser = document.getElementById("cmBotTeaser");
    if (!widget) return;

    widget.classList.add("is-open");
    widget.setAttribute("aria-hidden", "false");
    document.body.classList.add("cm-bot-active");
    if (teaser) teaser.style.display = "none";
    isWidgetOpen = true;

    // Start conversation if clean
    const body = document.getElementById("cmBotBody");
    if (body && body.querySelectorAll(".cm-msg-row").length === 0) {
      startConversation();
    } else {
      scrollChatToBottom();
      const input = document.getElementById("cmBotInput");
      if (input && !input.disabled) setTimeout(() => input.focus(), 250);
    }
  }

  function closeChatWidget() {
    const widget = document.getElementById("cmBotWidget");
    if (!widget) return;

    widget.classList.remove("is-open");
    widget.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cm-bot-active");
    isWidgetOpen = false;
  }

  function toggleChatWidget() {
    if (isWidgetOpen) {
      closeChatWidget();
    } else {
      openChatWidget();
    }
  }

  // Initialize and wire event listeners
  function initChatbot() {
    injectChatbotDOM();

    const botBtn = document.getElementById("cmBotBtn");
    const teaser = document.getElementById("cmBotTeaser");
    const teaserClose = document.getElementById("cmBotTeaserClose");
    const closeBtn = document.getElementById("cmBotCloseBtn");
    const restartBtn = document.getElementById("cmBotRestartBtn");
    const form = document.getElementById("cmBotForm");

    if (botBtn) botBtn.addEventListener("click", toggleChatWidget);

    if (teaser) {
      teaser.addEventListener("click", (e) => {
        if (e.target === teaserClose || e.target.closest("#cmBotTeaserClose")) return;
        openChatWidget();
      });
    }

    if (teaserClose) {
      teaserClose.addEventListener("click", (e) => {
        e.stopPropagation();
        teaser.style.display = "none";
        localStorage.setItem("cm_bot_teaser_dismissed", "true");
      });
    }

    if (closeBtn) closeBtn.addEventListener("click", closeChatWidget);

    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        const input = document.getElementById("cmBotInput");
        if (input) input.disabled = false;
        const sendBtn = document.getElementById("cmBotSendBtn");
        if (sendBtn) sendBtn.disabled = false;
        startConversation();
      });
    }

    if (form) form.addEventListener("submit", handleInputSubmit);

    // Escape key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isWidgetOpen) {
        closeChatWidget();
      }
    });

    // Auto-pop teaser bubble after 4 seconds if not dismissed
    setTimeout(() => {
      const isDismissed = localStorage.getItem("cm_bot_teaser_dismissed") === "true";
      const teaserEl = document.getElementById("cmBotTeaser");
      if (teaserEl && !isDismissed && !isWidgetOpen) {
        teaserEl.style.display = "flex";
      }
    }, 4000);

    // Wire any existing "chatBtn" or "floatingLeadBtn" elements to open the chatbot
    const existingFloatBtn = document.getElementById("floatingLeadBtn");
    if (existingFloatBtn) {
      // Hide old button in favor of the new assistant launcher
      existingFloatBtn.style.display = "none";
    }

    document.querySelectorAll(".open-cm-chatbot, [data-open-chatbot]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openChatWidget();
      });
    });

    // Expose globally
    window.openCorporateMartChatbot = openChatWidget;
    window.closeCorporateMartChatbot = closeChatWidget;
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChatbot);
  } else {
    initChatbot();
  }
})();
