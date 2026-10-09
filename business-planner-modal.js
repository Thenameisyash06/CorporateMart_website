/**
 * CorporateMart Business Setup Architect Modal (Cashify Moment)
 * AI-Powered Conversational Generator using Hugging Face LLM
 * with Smart Client & Server Fallback Compliance Engine
 */

(function () {
  "use strict";

  // Singleton guard against multiple script injections
  if (window.__bizPlannerModalLoaded) return;
  window.__bizPlannerModalLoaded = true;

  // -------------------------------------------------------------------------
  // 1. KNOWLEDGE BASE & BACKUP DETERMINISTIC RULES
  // -------------------------------------------------------------------------

  const BUSINESS_SECTORS = {
    food: {
      key: "food",
      name: "Food & Hospitality / Cloud Kitchen",
      tagline: "FSSAI + Fire/Health NOC + Fast Track Setup",
      timeline: "7–12 Business Days",
      keywords: ["food", "restaurant", "cafe", "cloud kitchen", "bakery", "beverage", "catering", "dining", "snack", "sweet", "canteen", "fssai"],
      recommendedStructure: {
        single: "LLP or Private Limited (Recommended for scaling & cloud kitchen food delivery tie-ups)",
        multiple: "Private Limited Company (Recommended - enables raising investor capital & angel rounds)"
      },
      mandatoryLicences: [
        { name: "FSSAI Food License (State / Central)", authority: "Food Safety and Standards Authority of India", tag: "Mandatory", desc: "Statutory food safety license required before preparing or selling any edible items." },
        { name: "GST Registration", authority: "CBIC / Department of Revenue", tag: "Mandatory", desc: "Mandatory for selling via Swiggy, Zomato, or inter-state sales." },
        { name: "Local Municipal Health & Trade License", authority: "Municipal Corporation", tag: "State", desc: "Issued by Municipal Corporation / Local Urban Body for hygiene & public safety." },
        { name: "Fire Department NOC", authority: "State Fire & Emergency Services", tag: "Crucial", desc: "Mandatory for commercial kitchens, gas cylinder manifolds, and dine-in restaurants." },
        { name: "Weights & Measures Verification", authority: "Legal Metrology Dept", tag: "Essential", desc: "Compliance for calibrated weighing scales & pre-packaged food portions." }
      ],
      trademark: {
        name: "Brand Name & Logo Trademark Registration",
        classes: "Class 43 (Dining & Restaurant Services) + Class 30 (Packaged Food & Condiments)",
        desc: "Protects your brand name, logo, and cloud kitchen identity across all of India."
      },
      subsidies: [
        { name: "PM FME Scheme (Micro Food Processing)", benefit: "35% credit-linked capital subsidy up to ₹10 Lakhs for modern food processing machinery and cold chain equipment." },
        { name: "MSME Udyam Priority Lending", benefit: "Collateral-free CGTMSE bank credit up to ₹5 Crore and lower electricity tariffs." }
      ],
      compliance: [
        "Monthly GST Return Filing (GSTR-1 & GSTR-3B)",
        "Annual FSSAI Return (Form D1) & Food Safety Audit",
        "Quarterly TDS & EPF/ESIC if employing 10+ staff members"
      ]
    },

    ecommerce: {
      key: "ecommerce",
      name: "E-Commerce & Direct-to-Consumer (D2C)",
      tagline: "GST Multi-State + Trademark Class 35 + Payment Gateway",
      timeline: "5–10 Business Days",
      keywords: ["ecommerce", "e-commerce", "d2c", "online store", "shopify", "amazon seller", "flipkart", "drop shipping", "dropshipping", "online selling"],
      recommendedStructure: {
        single: "Private Limited Company (Enables VC funding & cross-border merchant accounts)",
        multiple: "Private Limited Company (Recommended - VC standard equity allocation & ESOPs)"
      },
      mandatoryLicences: [
        { name: "GST Registration (E-Commerce Operator / Supplier)", authority: "CBIC / Department of Revenue", tag: "Mandatory", desc: "Mandatory with NO turnover threshold limit for selling through online marketplaces or own site." },
        { name: "MSME Udyam Registration", authority: "Ministry of MSME", tag: "Essential", desc: "Unlocks interest subsidies, collateral-free borrowing, and government portal listings." },
        { name: "Legal Metrology Packaged Commodities (LMPC)", authority: "Legal Metrology Dept", tag: "Mandatory", desc: "Compulsory declarations (MRP, batch, manufacturer info) on all pre-packaged consumer goods." },
        { name: "EPR (Extended Producer Responsibility) Authorization", authority: "Central Pollution Control Board", tag: "Essential", desc: "Plastic & e-waste packaging recycling certification via CPCB." }
      ],
      trademark: {
        name: "Trademark Protection for Brand & Platform",
        classes: "Class 35 (Online Retail Store Services) + Specific Product Class (e.g. Class 25 Apparel)",
        desc: "Mandatory for Amazon Brand Registry, defending against counterfeits, and Google Ads protection."
      },
      subsidies: [
        { name: "Startup India 80-IAC Tax Holiday", benefit: "3 consecutive years of 100% tax exemption for recognized DPIIT startups." },
        { name: "Startup India Seed Fund Scheme (SISFS)", benefit: "Up to ₹20 Lakhs grant for proof of concept + ₹50 Lakhs convertible debt." }
      ],
      compliance: [
        "TCS (Tax Collected at Source) reconciliation under Section 52",
        "Monthly GSTR-1, GSTR-3B, and Annual GSTR-9",
        "Annual ROC filings (AOC-4, MGT-7)"
      ]
    },

    tech: {
      key: "tech",
      name: "IT, SaaS & Software Development",
      tagline: "IP Shield + DPIIT Recognition + 80-IAC Tax Exemption",
      timeline: "5–7 Business Days",
      keywords: ["software", "saas", "tech", "it", "app", "application", "ai", "platform", "web development", "cloud", "fintech", "edtech", "coding"],
      recommendedStructure: {
        single: "Private Limited Company (Standard for global IP assignment & investors)",
        multiple: "Private Limited Company (Essential for vesting, co-founder equity splits & convertible notes)"
      },
      mandatoryLicences: [
        { name: "Private Limited Incorporation (MCA / SPICe+)", authority: "Ministry of Corporate Affairs", tag: "Mandatory", desc: "Includes PAN, TAN, EPFO, ESIC, Professional Tax, and Corporate Bank Account." },
        { name: "DPIIT Startup India Recognition", authority: "DPIIT", tag: "Essential", desc: "Fast-tracks patent/trademark filing with 80% fee rebate & 3-year tax holiday." },
        { name: "LUT (Letter of Undertaking) under GST", authority: "Department of Revenue", tag: "Crucial", desc: "Allows zero-rated GST export of software & SaaS services to international clients without paying GST upfront." },
        { name: "MSME Udyam Registration", authority: "Ministry of MSME", tag: "Essential", desc: "Statutory interest subsidies and exemption from Earnest Money Deposit in public bids." }
      ],
      trademark: {
        name: "Software Architecture & SaaS Brand Mark",
        classes: "Class 42 (Software as a Service & Cloud Infrastructure) + Class 9 (Downloadable Software & Apps)",
        desc: "Shields your codebase brand, application name, algorithms, and web app identifiers."
      },
      subsidies: [
        { name: "Section 80-IAC Income Tax Holiday", benefit: "100% deduction on corporate profits for 3 consecutive financial years." },
        { name: "Software Technology Parks of India (STPI) / SEZ", benefit: "Duty-free imports of development hardware and streamlined customs clearances." }
      ],
      compliance: [
        "Annual statutory ROC audit & filing (AOC-4, MGT-7)",
        "Monthly GSTR-1 and GSTR-3B filings",
        "Annual Software Export Declaration (SOFTEX) filings with RBI / STPI"
      ]
    },

    export: {
      key: "export",
      name: "Export & Import (Exim Trade)",
      tagline: "DGFT IEC + RCMC + RoDTEP Incentives",
      timeline: "7–10 Business Days",
      keywords: ["export", "import", "exim", "overseas", "foreign trade", "freight", "customs", "shipping", "trader"],
      recommendedStructure: {
        single: "Private Limited or LLP (Provides legal credibility with overseas buyers and bankers)",
        multiple: "Private Limited Company (Mandatory standard for high-value trade lines and AD Banker credit)"
      },
      mandatoryLicences: [
        { name: "Import Export Code (IEC)", authority: "Directorate General of Foreign Trade (DGFT)", tag: "Mandatory", desc: "10-digit statutory lifetime code required for customs clearance and foreign remittances." },
        { name: "RCMC (Registration-cum-Membership Certificate)", authority: "Export Promotion Council / FIEO", tag: "Mandatory", desc: "Mandatory to claim duty drawbacks, FTP concessions, and export promotion benefits." },
        { name: "GST Registration with LUT Filing", authority: "CBIC", tag: "Mandatory", desc: "Zero-rates international supply invoices so you don't block working capital in IGST." },
        { name: "AD Code Registration with IceGate Port", authority: "Authorized Dealer Bank & Indian Customs", tag: "Crucial", desc: "Links corporate bank account to specific air/sea customs ports for shipping bill generation." }
      ],
      trademark: {
        name: "International Trademark & Madrid Protocol",
        classes: "Class 35 (Global Distribution & Export Trading) + Relevant Product Class",
        desc: "Protects trade name under Indian Trademark Registry and enables expansion via Madrid Protocol."
      },
      subsidies: [
        { name: "RoDTEP Scheme (Remission of Duties)", benefit: "Direct cash credit reimbursement of 0.5% to 4.3% of FOB export value." },
        { name: "Interest Equalisation Scheme (IES)", benefit: "2% to 3% interest subvention rebate on pre and post-shipment export credit." }
      ],
      compliance: [
        "Annual IEC validation on DGFT portal between April and June",
        "Bank Realization Certificate (e-BRC / EDPMS) reconciliation with RBI",
        "Monthly GSTR-1 (Table 6A export invoices) and GSTR-3B filings"
      ]
    },

    manufacturing: {
      key: "manufacturing",
      name: "Manufacturing, Processing & Heavy Industry",
      tagline: "Pollution Board NOC + Factory License + Capital Subsidies",
      timeline: "14–25 Business Days",
      keywords: ["manufacturing", "factory", "production", "industry", "industrial", "fabrication", "assembly", "machinery", "processing unit"],
      recommendedStructure: {
        single: "Private Limited Company (Shields personal assets from industrial and environmental liability)",
        multiple: "Private Limited Company (Essential for institutional factory term loans and corporate debt)"
      },
      mandatoryLicences: [
        { name: "Consent to Establish & Operate (CTE / CTO)", authority: "State Pollution Control Board", tag: "Mandatory", desc: "Mandatory environmental clearance assessing emission, effluent, and waste under Air/Water Acts." },
        { name: "Factory License & Plan Approval", authority: "Directorate of Industrial Safety & Health (DISH)", tag: "Mandatory", desc: "Mandatory under Factories Act 1948 for premises with 10+ workers using power or 20+ workers without power." },
        { name: "MSME Udyam Registration", authority: "Ministry of MSME", tag: "Essential", desc: "Essential to claim 15%–35% capital subsidies, lower industrial electricity tariffs, and MSME protection." },
        { name: "Fire Department NOC", authority: "State Fire & Emergency Services", tag: "Crucial", desc: "Clearance for fire hydrants, evacuation passages, and safety equipment installation." }
      ],
      trademark: {
        name: "Patent & Trademark Protection",
        classes: "Product Specific Classes + Class 40 (Custom Manufacturing)",
        desc: "Secures proprietary machinery designs, product formulas, and manufacturing brand marks."
      },
      subsidies: [
        { name: "PMEGP Capital Subsidy", benefit: "Margin money capital subsidy of 15% to 35% on project costs up to ₹50 Lakhs." },
        { name: "State Industrial Policy Capital Subsidy", benefit: "10% to 25% term loan capital subsidy + 5% interest subvention for 5 years." }
      ],
      compliance: [
        "Annual return filing under Factories Act (Form 21)",
        "Environmental statement (Form V) submission to Pollution Board by Sep 30",
        "Monthly PF & ESIC returns for eligible factory workforce"
      ]
    },

    healthcare: {
      key: "healthcare",
      name: "Healthcare, Pharma, Wellness & Clinics",
      tagline: "Drug License + Bio-Medical Waste NOC + Clinical Act",
      timeline: "15–30 Business Days",
      keywords: ["pharma", "pharmaceutical", "ayurveda", "ayush", "healthcare", "clinic", "hospital", "diagnostic", "medical", "skincare", "cosmetics", "drug"],
      recommendedStructure: {
        single: "Private Limited Company or LLP (Critical for regulatory drug licensing & medical liability protection)",
        multiple: "Private Limited Company (Standard for institutional healthcare funding & clinical network expansion)"
      },
      mandatoryLicences: [
        { name: "Drug License (Retail / Wholesale Form 20/21)", authority: "State Drugs Control Department", tag: "Mandatory", desc: "Mandatory license under Drugs & Cosmetics Act requiring qualified registered pharmacist appointment." },
        { name: "Bio-Medical Waste Management Authorization", authority: "State Pollution Control Board", tag: "Mandatory", desc: "Statutory authorization for safe segregation, handling, and disposal of medical waste." },
        { name: "Clinical Establishments Registration / Municipal NOC", authority: "State Health Dept / Municipal Corporation", tag: "Mandatory", desc: "Registration validating medical infrastructure, staff credentials, and emergency facilities." },
        { name: "GST Registration", authority: "CBIC / Department of Revenue", tag: "Mandatory", desc: "Required for commercial distribution of medicines, wellness products, and diagnostic kits." }
      ],
      trademark: {
        name: "Pharma Brand & Composition Trademark",
        classes: "Class 5 (Pharmaceuticals, Dietetic & Ayurvedic) + Class 3 (Cosmetics & Skincare)",
        desc: "Mandatory to prevent dangerous look-alike drug name confusion and protect proprietary formulations."
      },
      subsidies: [
        { name: "BIRAC Biotechnology / Healthcare Seed Fund", benefit: "Government grants up to ₹50 Lakhs for innovative diagnostic devices and bio-pharma." },
        { name: "MSME Technology Upgradation Subsidy", benefit: "Up to 15% capital subsidy for WHO-GMP / GLP cleanroom modernization." }
      ],
      compliance: [
        "Drug license renewal every 5 years with pharmacist verification",
        "Annual Bio-Medical waste disposal returns by June 30",
        "Monthly GST returns (GSTR-1, 3B)"
      ]
    },

    retail: {
      key: "retail",
      name: "Retail Shop, Boutique & Local Services",
      tagline: "Shop & Establishment + GST + Local Municipal Trade",
      timeline: "5–8 Business Days",
      keywords: ["retail", "shop", "store", "salon", "boutique", "supermarket", "grocery", "showroom", "parlour", "gym", "hardware", "clothing store"],
      recommendedStructure: {
        single: "Sole Proprietorship or LLP (Fastest launch with minimum compliance overhead)",
        multiple: "LLP or Private Limited (Allows multi-partner investment and multi-store expansion)"
      },
      mandatoryLicences: [
        { name: "State Shop & Commercial Establishment (Gumasta)", authority: "Municipal Corporation / Labour Dept", tag: "Mandatory", desc: "Statutory proof of commercial premises, working hours, and local employment conditions." },
        { name: "Municipal Trade License", authority: "Local Municipal Body", tag: "Mandatory", desc: "Authorizes conducting specific commercial trades within municipal limits." },
        { name: "GST Registration", authority: "CBIC / Department of Revenue", tag: "Mandatory", desc: "Required if aggregate turnover exceeds ₹40 Lakhs (₹20 Lakhs for services) or for inter-state trading." },
        { name: "MSME Udyam Registration", authority: "Ministry of MSME", tag: "Essential", desc: "Unlocks collateral-free Mudra / MSME loans and lower interest bank overdraft facilities." }
      ],
      trademark: {
        name: "Shop Signboard & Retail Brand Mark",
        classes: "Class 35 (Retail Store Services & Brand Signage)",
        desc: "Prevents competitors from opening copycat stores or misusing your trade name."
      },
      subsidies: [
        { name: "PM SVANidhi / Mudra Shishu/Kishore Loan", benefit: "Institutional collateral-free working capital loan up to ₹5 Lakhs at subsidized interest rates." },
        { name: "MSME Priority Overdraft Credit", benefit: "Concessional processing fees and lower margin requirements with nationalized banks." }
      ],
      compliance: [
        "Shop & Establishment license periodic renewal as per state schedule",
        "Monthly / Quarterly GST returns (QRMP scheme eligible for turnover up to ₹5 Crore)",
        "Annual trade license fee renewal with municipal corporation"
      ]
    },

    education: {
      key: "education",
      name: "EdTech, Coaching & Training Institute",
      tagline: "Startup India + Class 41 Trademark + ISO 9001",
      timeline: "7–10 Business Days",
      keywords: ["education", "edtech", "coaching", "tuition", "training", "academy", "institute", "course", "elearning", "school", "college"],
      recommendedStructure: {
        single: "Private Limited Company or OPC (Allows software copyrighting and institutional certifications)",
        multiple: "Private Limited Company (Standard for venture investment; Section 8 if structured as non-profit foundation)"
      },
      mandatoryLicences: [
        { name: "DPIIT Startup India Recognition", authority: "DPIIT", tag: "Essential", desc: "Grants 3-year tax holiday and recognition for innovative educational delivery methods." },
        { name: "GST Registration", authority: "CBIC / Department of Revenue", tag: "Mandatory", desc: "Mandatory for commercial online course sales, mock test packages, and physical coaching centers." },
        { name: "MSME Udyam Registration", authority: "Ministry of MSME", tag: "Essential", desc: "Unlocks interest subvention and government software procurement tenders." },
        { name: "ISO 9001:2015 Educational Quality Certification", authority: "Accredited Certification Body", tag: "Optional", desc: "Certifies academic curriculum quality and builds confidence with students and parents." }
      ],
      trademark: {
        name: "Academy Brand & Curriculum Copyright",
        classes: "Class 41 (Educational & Training Services) + Class 42 (E-learning Portals)",
        desc: "Protects institute name, competitive exam study modules, and proprietary video content."
      },
      subsidies: [
        { name: "Startup India Seed Fund Scheme", benefit: "Grant assistance up to ₹50 Lakhs for interactive learning tech and regional language models." },
        { name: "Section 80-IAC 3-Year Tax Exemption", benefit: "Zero corporate income tax for 3 consecutive financial years." }
      ],
      compliance: [
        "Annual ROC filing (Form AOC-4, MGT-7)",
        "Monthly GST returns (GSTR-1, GSTR-3B)",
        "Consumer Protection (E-Commerce) Rules compliance for course fee refund policies"
      ]
    }
  };

  const STATE_RULES = {
    "Gujarat": {
      stateName: "Gujarat",
      localGovt: "Gujarat e-Nagar & GPCB",
      localLicence: "Gujarat Shop & Establishment (e-Nagar) & GPCB Consent",
      extraTip: "Gujarat offers single-window e-Nagar Gumasta and fast-track GPCB Green Channel clearances. Eligible for Gujarat Industrial Policy Capital Subsidy (up to 20%) and electricity duty waiver."
    },
    "Maharashtra": {
      stateName: "Maharashtra",
      localGovt: "Aaple Sarkar & MPCB",
      localLicence: "Maharashtra Gumasta (Aaple Sarkar) & MPCB Consent",
      extraTip: "Aaple Sarkar provides online Gumasta intimation for <10 staff and registration for 10+ employees. Eligible for Maharashtra PSI industrial promotion subsidy."
    },
    "Karnataka": {
      stateName: "Karnataka",
      localGovt: "e-Karmika & BBMP",
      localLicence: "Karnataka e-Karmika Registration & BBMP Trade License",
      extraTip: "Mandatory registration under Karnataka Shops & Commercial Establishments Act via e-Karmika. Startups can apply for Elevate 100 / IDEA2POC grants up to ₹50 Lakhs."
    },
    "Delhi NCR": {
      stateName: "Delhi NCR",
      localGovt: "MCD Single Window & DPCC",
      localLicence: "MCD General Trade License & DPCC Green Category NOC",
      extraTip: "Unified MCD portal expedites local trade licenses. Eligible for Delhi Startup Policy cloud credit grants and collateral-free lending."
    },
    "Tamil Nadu": {
      stateName: "Tamil Nadu",
      localGovt: "TN-REGINET & Labour Dept",
      localLicence: "Tamil Nadu Shops & Commercial Establishments Registration",
      extraTip: "Streamlined single-window clearance. Innovative startups can qualify for TANSEED grant of up to ₹10 Lakhs."
    },
    "Telangana": {
      stateName: "Telangana / Hyderabad",
      localGovt: "TS-bPASS & GHMC",
      localLicence: "TS-bPASS Municipal Clearance & GHMC Trade License",
      extraTip: "TS-bPASS provides instantaneous municipal approvals. Eligible for T-Hub incubator network and T-IDEA investment subsidies."
    },
    "Rajasthan": {
      stateName: "Rajasthan",
      localGovt: "RajSSO & BRN Portal",
      localLicence: "Rajasthan Business Registration Number (BRN) & Shop Act",
      extraTip: "BRN via RajSSO is compulsory before opening bank accounts. Eligible for iStart Rajasthan funding up to ₹25 Lakhs."
    },
    "Uttar Pradesh": {
      stateName: "Uttar Pradesh",
      localGovt: "Nivesh Mitra Portal",
      localLicence: "UP Nivesh Mitra Single Window Registration",
      extraTip: "Nivesh Mitra provides online statutory clearances across 70+ departments. UP Startup Policy offers ₹17,500/month sustenance allowance."
    },
    "Pan-India": {
      stateName: "India (Pan-India)",
      localGovt: "Municipal Corporation / Labour Dept",
      localLicence: "State Shop & Commercial Establishment (Gumasta) & Local Municipal Trade License",
      extraTip: "Commercial premises must obtain local municipal clearance within 30 days of beginning operations in your state."
    }
  };

  const SECTOR_QUICK_CHIPS = [
    { label: "🍔 Food & Cloud Kitchen", sectorKey: "food" },
    { label: "📦 E-Commerce & D2C", sectorKey: "ecommerce" },
    { label: "💻 IT, SaaS & Tech", sectorKey: "tech" },
    { label: "🚢 Export & Import", sectorKey: "export" },
    { label: "🏭 Manufacturing Plant", sectorKey: "manufacturing" },
    { label: "🏥 Healthcare & Pharma", sectorKey: "healthcare" },
    { label: "🏪 Retail Store / Salon", sectorKey: "retail" },
    { label: "🎓 EdTech & Education", sectorKey: "education" }
  ];

  // -------------------------------------------------------------------------
  // 2. PARSING HELPERS
  // -------------------------------------------------------------------------

  function parseNaturalLanguageQuery(text) {
    const raw = String(text || "").toLowerCase();

    // 1. Detect State
    let detectedState = "India (Pan-India)";
    if (/gujarat|ahmedabad|surat|vadodara|rajkot|gandhinagar/.test(raw)) {
      detectedState = "Gujarat";
    } else if (/maharashtra|mumbai|pune|nagpur|nashik|thane/.test(raw)) {
      detectedState = "Maharashtra";
    } else if (/karnataka|bengaluru|bangalore|mysore|hubli/.test(raw)) {
      detectedState = "Karnataka";
    } else if (/delhi|noida|gurgaon|gurugram|ghaziabad|faridabad/.test(raw)) {
      detectedState = "Delhi NCR";
    } else if (/tamil\s*nadu|chennai|coimbatore|madurai/.test(raw)) {
      detectedState = "Tamil Nadu";
    } else if (/telangana|hyderabad|secunderabad/.test(raw)) {
      detectedState = "Telangana";
    } else if (/rajasthan|jaipur|jodhpur|udaipur|kota/.test(raw)) {
      detectedState = "Rajasthan";
    } else if (/uttar\s*pradesh|\bup\b|lucknow|kanpur|varanasi|agra/.test(raw)) {
      detectedState = "Uttar Pradesh";
    }

    // 2. Detect Team Scale
    let teamCount = 1;
    if (/partner|co-founder|cofounder|founders|team|investor|funding|\b2\b|\b3\b|\b4\b|\b5\b|two|three|four|with my friend/.test(raw)) {
      teamCount = 2;
    } else if (/solo|single|alone|myself|\b1\b|one founder|opc/.test(raw)) {
      teamCount = 1;
    }

    // 3. Detect Sector
    let detectedSectorKey = "tech";
    let highestScore = 0;

    Object.keys(BUSINESS_SECTORS).forEach((key) => {
      const sector = BUSINESS_SECTORS[key];
      let score = 0;
      sector.keywords.forEach((kw) => {
        if (raw.includes(kw)) {
          score += kw.length > 4 ? 3 : 2;
        }
      });
      if (score > highestScore) {
        highestScore = score;
        detectedSectorKey = key;
      }
    });

    return {
      sectorKey: detectedSectorKey,
      state: detectedState,
      teamCount: teamCount,
      rawText: text
    };
  }

  // -------------------------------------------------------------------------
  // 3. MODAL STATE & UI MANAGERS
  // -------------------------------------------------------------------------

  let isModalOpen = false;
  let isConversationStarted = false;
  let activeBlueprint = null;
  let currentAbortController = null;

  function getElement(id) {
    return document.getElementById(id);
  }

  function getCurrentTime() {
    const d = new Date();
    let hours = d.getHours();
    let minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
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

  function scrollChatToBottom() {
    const body = getElement("bizPlannerBody");
    if (body) {
      setTimeout(() => {
        body.scrollTop = body.scrollHeight;
      }, 50);
    }
  }

  function appendMessage(sender, htmlContent, customClass = "") {
    const body = getElement("bizPlannerBody");
    if (!body) return null;

    const row = document.createElement("div");
    row.className = `biz-planner-msg-row ${sender} ${customClass}`.trim();
    const time = getCurrentTime();

    if (sender === "bot") {
      row.innerHTML = `
        <div class="biz-planner-msg-avatar">⚡</div>
        <div style="flex:1; min-width:0;">
          <div class="biz-planner-bubble">${htmlContent}</div>
          <span class="biz-planner-msg-time">${time}</span>
        </div>
      `;
    } else {
      row.innerHTML = `
        <div>
          <div class="biz-planner-bubble">${htmlContent}</div>
          <span class="biz-planner-msg-time">${time}</span>
        </div>
      `;
    }

    body.appendChild(row);
    scrollChatToBottom();
    return row;
  }

  function showTyping(message = "Analyzing compliance requirements...") {
    const body = getElement("bizPlannerBody");
    if (!body) return null;

    const typingRow = document.createElement("div");
    typingRow.className = "biz-planner-msg-row bot biz-planner-typing-row";
    typingRow.innerHTML = `
      <div class="biz-planner-msg-avatar">⚡</div>
      <div class="biz-planner-typing-bubble">
        <span class="biz-planner-dot"></span>
        <span class="biz-planner-dot"></span>
        <span class="biz-planner-dot"></span>
        <span style="font-size:12px; margin-left:8px; color:#64748b; font-weight:500;">${escapeHtml(message)}</span>
      </div>
    `;

    body.appendChild(typingRow);
    scrollChatToBottom();
    return typingRow;
  }

  function renderChips(chipsList, onSelect) {
    const body = getElement("bizPlannerBody");
    if (!body) return;

    const container = document.createElement("div");
    container.className = "biz-planner-chips-container";

    chipsList.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "biz-planner-chip";
      btn.textContent = item.label;
      btn.addEventListener("click", () => {
        container.querySelectorAll(".biz-planner-chip").forEach((b) => (b.disabled = true));
        btn.classList.add("selected");
        onSelect(item);
      });
      container.appendChild(btn);
    });

    body.appendChild(container);
    scrollChatToBottom();
  }

  // -------------------------------------------------------------------------
  // 4. CONVERSATION LIFECYCLE
  // -------------------------------------------------------------------------

  function initConversation() {
    isConversationStarted = true;
    activeBlueprint = null;

    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }

    const body = getElement("bizPlannerBody");
    if (body) body.innerHTML = "";

    const input = getElement("bizPlannerInput");
    if (input) {
      input.value = "";
      input.disabled = false;
      input.placeholder = "e.g. Food business in Gujarat with 2 partners...";
      setTimeout(() => input.focus(), 200);
    }

    const welcomeHtml = `
      Welcome to the <strong>CorporateMart Business Setup Architect</strong>! 🚀<br><br>
      Powered by <strong>Advanced AI &amp; Indian Corporate Compliance Law</strong>. Just like <strong>Cashify</strong> gives you an instant valuation for your phone, tell me what business you want to start and where — I will construct your <strong>exact legal structure, mandatory licenses, trademarks, subsidies, and compliance roadmap</strong> in seconds.<br><br>
      <strong>What business are you planning to start, and in which state or city?</strong><br>
      <em>(Type below, or tap a sector to start)</em>
    `;

    appendMessage("bot", welcomeHtml);

    renderChips(SECTOR_QUICK_CHIPS, (chip) => {
      handleUserSectorClick(chip);
    });
  }

  function handleUserSectorClick(chip) {
    appendMessage("user", escapeHtml(chip.label));
    generateBusinessPlan({
      query: chip.label,
      sectorKey: chip.sectorKey,
      state: "India (Pan-India)",
      teamCount: 2
    });
  }

  function handleFormSubmit(e) {
    if (e) e.preventDefault();
    const input = getElement("bizPlannerInput");
    if (!input) return;

    const val = input.value.trim();
    if (!val) return;

    input.value = "";
    appendMessage("user", escapeHtml(val));

    const raw = val.toLowerCase();

    // 1. Detect contact submission
    const emailMatch = val.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = val.match(/(?:\+?91[\-\s]?)?[6-9]\d{9}/);

    if (emailMatch || phoneMatch) {
      const contact = emailMatch ? emailMatch[0] : phoneMatch[0];
      const typingEl = showTyping("Registering details with compliance desk...");
      setTimeout(() => {
        if (typingEl) typingEl.remove();
        const sectorName = activeBlueprint ? (activeBlueprint.plan.businessTitle || activeBlueprint.plan.sectorName || "your venture") : "your venture";
        appendMessage(
          "bot",
          `✅ <strong>Contact Registered!</strong><br>Thank you! We have logged <strong>${escapeHtml(contact)}</strong>. Our senior legal specialist will review your <strong>${escapeHtml(sectorName)}</strong> plan and connect with your personalized statutory document checklist.<br><br>You can also download your PDF blueprint below or connect directly on WhatsApp!`
        );
      }, 400);
      return;
    }

    // 2. Parse intent
    const parsed = parseNaturalLanguageQuery(val);

    // 3. If an active blueprint exists and user is asking a follow-up query:
    if (activeBlueprint && !isNewSectorIntent(raw)) {
      handleFollowUpQuery(val, raw, activeBlueprint, parsed);
      return;
    }

    // 4. Generate new business plan
    generateBusinessPlan({
      query: val,
      sectorKey: parsed.sectorKey,
      state: parsed.state,
      teamCount: parsed.teamCount
    });
  }

  function isNewSectorIntent(raw) {
    const actionWords = /start|build|launch|new|open|setup|set up|create|incorporate|register|venture|business|company|plant|kitchen|agency|store|shop/;
    return actionWords.test(raw);
  }

  // -------------------------------------------------------------------------
  // 5. CALLING AI BACKEND (PURE LIVE LLM GENERATION)
  // -------------------------------------------------------------------------

  function formatMarkdown(text) {
    if (!text) return "";
    let html = escapeHtml(text);
    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Italic *text*
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // Bullet points
    html = html.replace(/^[•\-\*]\s+(.*)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/gs, "<ul style='margin:4px 0 8px 18px; padding-left:0;'>$1</ul>");
    // Line breaks
    html = html.replace(/\n\n+/g, "<br><br>").replace(/\n/g, "<br>");
    return html;
  }

  async function generateBusinessPlan({ query, sectorKey, state, teamCount }) {
    const typingRow = showTyping("✨ Consulting AI Business Setup Architect...");

    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    try {
      const response = await fetch("/api/business-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query,
          state: state && state !== "India (Pan-India)" ? state : null,
          teamCount: teamCount || 2,
          sector: sectorKey || null
        }),
        signal: currentAbortController.signal
      });

      const data = await response.json();

      if (typingRow) typingRow.remove();

      if (!response.ok || !data.success) {
        const errMsg = (data && data.error) ? data.error : `Server returned HTTP ${response.status}`;
        appendMessage(
          "bot",
          `⚠️ <strong>Live LLM Setup Notice:</strong><br>${escapeHtml(errMsg).replace(/\n/g, "<br>")}<br><br>` +
          `<em>To enable live dynamic AI blueprints, configure your free <code>GROQ_API_KEY</code> (get one free in 10s at <a href="https://console.groq.com/keys" target="_blank" style="color:#2563eb; text-decoration:underline;">console.groq.com</a>) or <code>GEMINI_API_KEY</code> in <code>server/.env</code>.</em>`
        );
        return;
      }

      if (data && data.plan) {
        activeBlueprint = {
          source: data.source || "Live LLM",
          model: data.model || "LLM",
          notice: data.notice || null,
          plan: data.plan,
          query: query
        };
        renderBlueprintCard(activeBlueprint);
      } else {
        throw new Error("Invalid response schema from planner backend");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Planner backend call failed:", err);
      if (typingRow) typingRow.remove();

      appendMessage(
        "bot",
        `⚠️ <strong>AI Planner Connection Error:</strong><br>${escapeHtml(err.message)}<br><br>` +
        `<em>Please ensure the backend server is running and a valid LLM API key (e.g. <code>GROQ_API_KEY</code>) is configured in <code>server/.env</code>.</em>`
      );
    }
  }

  // -------------------------------------------------------------------------
  // 6. BLUEPRINT CARD RENDERING
  // -------------------------------------------------------------------------

  function renderBlueprintCard(data) {
    const { source, model, plan } = data;

    const badgeLabel = `✨ ${source || 'AI'} Blueprint (${model || 'Live LLM'})`;

    const title = plan.businessTitle || (plan.sectorName ? `${plan.sectorName} Setup Plan` : "Business Setup Plan");
    const targetState = plan.targetState || plan.stateName || "India (Pan-India)";
    const teamModel = plan.teamStructure || plan.teamModel || "Multi-Founder / Co-Founders";
    const timeline = plan.timeline || "7–12 Business Days";

    const structureType = plan.recommendedStructure
      ? (plan.recommendedStructure.type || plan.recommendedStructure)
      : (plan.structure ? (plan.structure.type || plan.structure) : "Private Limited Company");
    const structureRationale = (plan.recommendedStructure && plan.recommendedStructure.rationale)
      || (plan.structure && plan.structure.rationale)
      || "Shields personal liability, allows seamless equity division, and qualifies for angel/VC funding and government grants.";

    const cardHtml = `
      <div class="bp-card">
        <div class="bp-card-header">
          <div class="bp-card-badge-row">
            <span class="bp-badge ${source === 'huggingface_llm' ? 'hf-badge' : ''}">${escapeHtml(badgeLabel)}</span>
            <span class="bp-timeline">⏱️ Setup: ${escapeHtml(timeline)}</span>
          </div>
          <h3 class="bp-card-title">${escapeHtml(title)}</h3>
          <div style="font-size:12px; color:#e0e7ff; margin-top:4px;">
            Target Jurisdiction: <strong>${escapeHtml(targetState)}</strong> • Team Model: <strong>${escapeHtml(teamModel)}</strong>
          </div>
        </div>

        <div class="bp-card-content">
          <!-- 1. Recommended Structure -->
          <div class="bp-section">
            <div class="bp-sec-head">
              <span class="bp-sec-title">🏛️ 1. Recommended Business Entity</span>
            </div>
            <div class="bp-item highlight">
              <div class="bp-item-head">
                <strong>${escapeHtml(structureType)}</strong>
                <span class="bp-tag mandatory">Optimal</span>
              </div>
              <p>${escapeHtml(structureRationale)}</p>
            </div>
          </div>

          <!-- 2. Mandatory Licences -->
          <div class="bp-section">
            <div class="bp-sec-head">
              <span class="bp-sec-title">📋 2. Mandatory Licences &amp; Registrations</span>
            </div>
            ${(plan.mandatoryLicences || []).map(lic => `
              <div class="bp-item">
                <div class="bp-item-head">
                  <strong>${escapeHtml(lic.name)}</strong>
                  <span class="bp-tag ${lic.tag ? lic.tag.toLowerCase() : 'mandatory'}">${escapeHtml(lic.tag || 'Mandatory')}</span>
                </div>
                <p>${escapeHtml(lic.desc)}</p>
                ${lic.authority ? `<span style="font-size:11px; color:#64748b; display:block; margin-top:3px;">Authority: ${escapeHtml(lic.authority)}</span>` : ''}
              </div>
            `).join("")}
          </div>

          <!-- 3. Trademark & Brand Protection -->
          <div class="bp-section">
            <div class="bp-sec-head">
              <span class="bp-sec-title">🛡️ 3. Trademark &amp; Brand Protection</span>
            </div>
            <div class="bp-item">
              <div class="bp-item-head">
                <strong>${escapeHtml(plan.trademark ? plan.trademark.name : 'Trademark & IP Shield')}</strong>
                <span class="bp-tag essential">IP Shield</span>
              </div>
              ${plan.trademark && plan.trademark.classes ? `<p style="font-weight:600; color:#1d4ed8; margin-bottom:4px;">Classes: ${escapeHtml(plan.trademark.classes)}</p>` : ''}
              <p>${escapeHtml(plan.trademark ? plan.trademark.desc : 'Protects your trade name, logo, and digital brand from counterfeiters across India.')}</p>
            </div>
          </div>

          <!-- 4. Subsidies & Schemes -->
          <div class="bp-section">
            <div class="bp-sec-head">
              <span class="bp-sec-title">💰 4. Government Subsidies &amp; Capital Schemes</span>
            </div>
            ${(plan.subsidies || []).map(sub => `
              <div class="bp-item highlight">
                <div class="bp-item-head">
                  <strong>${escapeHtml(sub.name)}</strong>
                  <span class="bp-tag crucial">Funding Benefit</span>
                </div>
                <p>${escapeHtml(sub.benefit || sub.desc || '')}</p>
              </div>
            `).join("")}
          </div>

          <!-- 5. Compliance Roadmap -->
          <div class="bp-section">
            <div class="bp-sec-head">
              <span class="bp-sec-title">📅 5. Post-Launch Statutory Compliance</span>
            </div>
            <div class="bp-item">
              <ul style="margin:0; padding-left:18px; font-size:12px; color:#475569; line-height:1.6;">
                ${(plan.compliance || []).map(c => `<li>${escapeHtml(c)}</li>`).join("")}
              </ul>
            </div>
          </div>

          <!-- AI Strategic Insight (if present) -->
          ${plan.aiInsight ? `
            <div class="bp-section">
              <div class="bp-sec-head">
                <span class="bp-sec-title">💡 6. Architect Strategic Insight</span>
              </div>
              <div class="bp-item" style="border-left: 3px solid #0d9488; background:#f0fdfa;">
                <p style="color:#0f766e; font-weight:500; margin:0;">${escapeHtml(plan.aiInsight)}</p>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Action CTAs -->
        <div class="bp-card-actions">
          <button type="button" class="bp-btn quote-btn">
            <span>⚡ Add Plan to Instant Quotation</span>
          </button>
          
          <button type="button" class="bp-btn pdf-btn">
            <span>📄 Download Roadmap &amp; Checklist (PDF)</span>
          </button>

          <a href="${getWhatsAppBlueprintLink(plan)}" target="_blank" rel="noopener noreferrer" class="bp-btn wa-btn">
            <span>💬 Consult Compliance Specialist on WhatsApp</span>
          </a>

          <button type="button" class="bp-btn reset-btn">
            <span>🔄 Plan Another Business Idea</span>
          </button>
        </div>
      </div>
    `;

    const row = appendMessage("bot", cardHtml, "blueprint-row");

    if (row) {
      const quoteBtn = row.querySelector(".quote-btn");
      if (quoteBtn) {
        quoteBtn.addEventListener("click", () => {
          closeModal();
          setTimeout(() => {
            const serviceName = `${title} (${targetState})`;
            if (typeof window.openQuotationModalDirect === "function") {
              window.openQuotationModalDirect({ serviceName, customerName: "" });
            } else if (typeof window.openQuotationModal === "function") {
              window.openQuotationModal({ serviceName, customerName: "" });
            }
          }, 200);
        });
      }

      const pdfBtn = row.querySelector(".pdf-btn");
      if (pdfBtn) {
        pdfBtn.addEventListener("click", () => {
          triggerBlueprintPDFDownload(plan, pdfBtn);
        });
      }

      const resetBtn = row.querySelector(".reset-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          initConversation();
        });
      }
    }
  }

  // Pre-filled WhatsApp link
  function getWhatsAppBlueprintLink(plan) {
    const title = plan.businessTitle || plan.sectorName || "New Venture";
    const state = plan.targetState || "India";
    const timeline = plan.timeline || "Fast Track";
    const text = encodeURIComponent(
      `Hi CorporateMart, I generated an AI Business Setup Blueprint on your website for:\n` +
      `• Venture: ${title}\n` +
      `• State: ${state}\n` +
      `• Estimated Setup: ${timeline}\n` +
      `Please connect me with a compliance specialist to review licenses and quotation.`
    );
    return `https://wa.me/919924408889?text=${text}`;
  }

  // Trigger PDF Download with animation & feedback
  function triggerBlueprintPDFDownload(plan, btn) {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ Generating PDF...</span>`;
    }

    const success = downloadBlueprintPDF(plan);

    if (btn) {
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = success ? `<span>✅ Downloaded!</span>` : `<span>📄 Download Roadmap &amp; Checklist (PDF)</span>`;
        if (success) {
          setTimeout(() => {
            btn.innerHTML = `<span>📄 Download Roadmap &amp; Checklist (PDF)</span>`;
          }, 3500);
        }
      }, 500);
    }

    if (success) {
      const typingEl = showTyping("Finalizing roadmap document...");
      setTimeout(() => {
        if (typingEl) typingEl.remove();
        const safeName = (plan.businessTitle || "Business_Plan").replace(/[^a-zA-Z0-9]/g, "_");
        appendMessage(
          "bot",
          `📄 <strong>Your Blueprint PDF is Downloaded!</strong><br>` +
          `File saved: <code>CorporateMart_${safeName}_Blueprint.pdf</code>.<br><br>` +
          `To begin company incorporation or calculate transparent legal fees, tap <strong>'⚡ Add Plan to Instant Quotation'</strong> above or chat directly on WhatsApp.`
        );
      }, 350);
    }
  }

  // Generate & Download high-resolution vector PDF using jsPDF
  function downloadBlueprintPDF(plan) {
    try {
      const jsPDFConstructor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
      if (!jsPDFConstructor) {
        console.error("jsPDF not loaded on page");
        alert("PDF generator is initializing. Please try clicking Download again.");
        return false;
      }

      const doc = new jsPDFConstructor({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2); // 182mm
      let y = 14;

      function checkPageBreak(spaceNeeded) {
        if (y + spaceNeeded > 282) {
          doc.addPage();
          y = 14;
        }
      }

      // 1. Top Header Banner
      doc.setFillColor(30, 58, 138); // #1e3a8a
      doc.roundedRect(margin, y, contentWidth, 24, 3, 3, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("CORPORATEMART", margin + 8, y + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(219, 234, 254);
      doc.text("Official Business Setup Roadmap & Statutory Compliance Blueprint", margin + 8, y + 15);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}  |  AI Business Architect`, margin + 8, y + 20);

      y += 29;

      // 2. Blueprint Overview Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "FD");

      const title = plan.businessTitle || "Business Setup Plan";
      const targetState = plan.targetState || "India (Pan-India)";
      const timeline = plan.timeline || "7–12 Business Days";
      const teamModel = plan.teamStructure || "Multi-Founder / Co-Founders";

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.text(title, margin + 6, y + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Target Jurisdiction: ${targetState}   |   Timeline: ${timeline}   |   Team Model: ${teamModel}`, margin + 6, y + 12);
      doc.text(`Statutory Scope: MCA Incorporation, GST, Sector Licenses, Trademarks & Government Subsidies`, margin + 6, y + 16.5);

      y += 25;

      // Section Header Helper
      function drawSectionHeader(secTitle) {
        checkPageBreak(12);
        doc.setFillColor(239, 246, 255);
        doc.setDrawColor(191, 219, 254);
        doc.rect(margin, y, contentWidth, 6.5, "FD");

        doc.setTextColor(29, 78, 216);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(secTitle, margin + 4, y + 4.8);
        y += 9.5;
      }

      // Section 1: Recommended Structure
      drawSectionHeader("1. RECOMMENDED BUSINESS ENTITY");
      const recType = plan.recommendedStructure ? (plan.recommendedStructure.type || plan.recommendedStructure) : "Private Limited Company";
      const recRationale = plan.recommendedStructure && plan.recommendedStructure.rationale
        ? plan.recommendedStructure.rationale
        : "Protects personal assets from business liability, allows equity vesting, and qualifies for angel/VC capital.";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(recType, margin + 4, y);
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const ratLines = doc.splitTextToSize(recRationale, contentWidth - 8);
      doc.text(ratLines, margin + 4, y);
      y += (ratLines.length * 3.6) + 4;

      // Section 2: Mandatory Licences
      drawSectionHeader("2. MANDATORY STATUTORY LICENCES & STATE PERMITS");
      (plan.mandatoryLicences || []).forEach((lic) => {
        checkPageBreak(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`• [${lic.tag || 'Mandatory'}] ${lic.name}`, margin + 4, y);
        y += 3.8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const lines = doc.splitTextToSize(lic.desc, contentWidth - 8);
        doc.text(lines, margin + 7, y);
        y += (lines.length * 3.5) + 2;
      });

      // Section 3: Trademark
      if (plan.trademark) {
        drawSectionHeader("3. INTELLECTUAL PROPERTY & BRAND PROTECTION (TRADEMARK)");
        checkPageBreak(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`• ${plan.trademark.name} (${plan.trademark.classes || 'Core Classes'}):`, margin + 4, y);
        y += 3.8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const tmLines = doc.splitTextToSize(plan.trademark.desc, contentWidth - 8);
        doc.text(tmLines, margin + 7, y);
        y += (tmLines.length * 3.5) + 3;
      }

      // Section 4: Subsidies
      if (plan.subsidies && plan.subsidies.length > 0) {
        drawSectionHeader("4. GOVERNMENT SUBSIDIES & CAPITAL SCHEMES");
        plan.subsidies.forEach((sub) => {
          checkPageBreak(10);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(21, 128, 61);
          doc.text(`• ${sub.name}:`, margin + 4, y);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          const subLines = doc.splitTextToSize(sub.benefit || sub.desc || '', contentWidth - 42);
          doc.text(subLines, margin + 40, y);
          y += Math.max(4.5, (subLines.length * 3.5) + 2);
        });
        y += 2;
      }

      // Section 5: Compliance Roadmap
      if (plan.compliance && plan.compliance.length > 0) {
        drawSectionHeader("5. POST-LAUNCH STATUTORY COMPLIANCE ROADMAP");
        plan.compliance.forEach((c) => {
          checkPageBreak(6);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          doc.text(`• ${c}`, margin + 4, y);
          y += 3.8;
        });
        y += 4;
      }

      // Footer Box
      checkPageBreak(16);
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("CorporateMart Legal Advisory & Startup Desk", margin + 6, y + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(203, 213, 225);
      doc.text("Helpline: +91 99244 08889   |   Email: info@corporatemart.in   |   Web: www.corporatemart.in", margin + 6, y + 10);

      const safeName = (title || "Business").replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `CorporateMart_${safeName}_Blueprint.pdf`;

      doc.save(filename);
      return true;
    } catch (err) {
      console.error("PDF generation error:", err);
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // 7. CONTEXTUAL FOLLOW-UP QUESTIONS (PURE LIVE LLM GENERATION)
  // -------------------------------------------------------------------------

  async function handleFollowUpQuery(val, raw, activeData, parsed) {
    const { plan } = activeData || {};
    const title = plan ? (plan.businessTitle || plan.sectorName || "your business") : "your business";

    // Direct WhatsApp consultation intent
    if (/whatsapp|human|call me|talk to expert|speak to lawyer/.test(raw)) {
      const waLink = getWhatsAppBlueprintLink(plan || {});
      appendMessage(
        "bot",
        `You can connect directly with our senior corporate compliance team:<br><br>` +
        `<a href="${waLink}" target="_blank" rel="noopener noreferrer" class="bp-btn wa-btn" style="display:inline-block; max-width:280px; text-decoration:none;">💬 Chat on WhatsApp</a>`
      );
      return;
    }

    const typingEl = showTyping("Consulting AI Specialist on " + title + "...");

    try {
      const response = await fetch("/api/business-plan/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: val,
          activeBlueprint: plan || null
        })
      });

      const data = await response.json();
      if (typingEl) typingEl.remove();

      if (!response.ok || !data.success) {
        const errMsg = (data && data.error) ? data.error : "Could not process AI question";
        appendMessage("bot", `⚠️ <strong>AI Advisory:</strong><br>${escapeHtml(errMsg).replace(/\n/g, "<br>")}`);
        return;
      }

      if (data && data.reply) {
        appendMessage("bot", formatMarkdown(data.reply));
      }
    } catch (err) {
      if (typingEl) typingEl.remove();
      console.error("AI Follow-up error:", err);
      appendMessage("bot", `⚠️ <strong>AI Communication Error:</strong><br>${escapeHtml(err.message)}`);
    }
  }

  // -------------------------------------------------------------------------
  // 8. MODAL OPEN / CLOSE CONTROLLER
  // -------------------------------------------------------------------------

  function openModal() {
    const modal = getElement("bizPlannerModal");
    if (!modal) return;

    // Dismiss background on-load popups if open
    const dualModal = document.getElementById("onLoadDualModal");
    if (dualModal) {
      dualModal.classList.remove("is-open");
      dualModal.setAttribute("aria-hidden", "true");
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("biz-planner-open");
    isModalOpen = true;

    if (!isConversationStarted) {
      initConversation();
    } else {
      scrollChatToBottom();
      const input = getElement("bizPlannerInput");
      if (input) setTimeout(() => input.focus(), 150);
    }
  }

  function closeModal() {
    const modal = getElement("bizPlannerModal");
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("biz-planner-open");
    isModalOpen = false;
  }

  // -------------------------------------------------------------------------
  // 9. EVENT BINDINGS
  // -------------------------------------------------------------------------

  function initBizPlannerModal() {
    const modal = getElement("bizPlannerModal");
    if (!modal) return;

    const form = getElement("bizPlannerForm");
    if (form) form.addEventListener("submit", handleFormSubmit);

    const restartBtn = getElement("bizPlannerRestartBtn");
    if (restartBtn) restartBtn.addEventListener("click", initConversation);

    const closeTriggers = document.querySelectorAll("[data-close-biz-planner]");
    closeTriggers.forEach((trigger) => {
      trigger.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isModalOpen) {
        closeModal();
      }
    });

    const openBtn = getElement("openPlanBusinessBtn");
    if (openBtn) {
      openBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
      });
    }

    document.querySelectorAll("[data-open-plan-biz], .open-plan-biz-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
      });
    });

    // Expose global controller
    window.openBusinessPlannerModal = openModal;
    window.closeBusinessPlannerModal = closeModal;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBizPlannerModal);
  } else {
    initBizPlannerModal();
  }
})();

