/**
 * CorporateMart - AI Business Setup Architect (Pure Dynamic LLM Engine)
 * Strictly generates dynamic compliance blueprints, entity structures,
 * mandatory licenses, trademark classes, and subsidies exclusively via live LLM.
 * No predefined or static server fallbacks.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Re-reads server/.env dynamically so environment changes
 * take effect immediately without requiring manual server restarts.
 */
function refreshEnv() {
  try {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
      // Clear out previously set keys if they were emptied in .env
      const trackedKeys = ['GROQ_API_KEY', 'GROQ_MODEL', 'GEMINI_API_KEY', 'GEMINI_MODEL', 'HF_TOKEN', 'HF_MODEL', 'OPENROUTER_API_KEY', 'OPENAI_API_KEY'];
      trackedKeys.forEach(k => {
        if (!envConfig[k] || !envConfig[k].trim()) {
          delete process.env[k];
        } else {
          process.env[k] = envConfig[k].trim();
        }
      });
    }
  } catch (err) {
    console.warn("⚠️ [AI PLANNER] Could not refresh .env:", err.message);
  }
}

/**
 * Detects configured LLM provider from environment variables
 */
function getLLMConfig() {
  refreshEnv();

  // 1. Groq Cloud (Ultra-fast, 100% Free Developer Tier)
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    let rawModel = (process.env.GROQ_MODEL || "openai/gpt-oss-120b").trim();
    // Auto-map deprecated or non-existent model names on Groq to active gpt-oss-120b
    if (rawModel.includes("llama-3.3-70b") || rawModel.includes("llama-3.1-8b")) {
      rawModel = "openai/gpt-oss-120b";
    }

    return {
      provider: "Groq",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY.trim(),
      model: rawModel,
      isGroq: true
    };
  }

  // 2. Google Gemini (100% Free Tier via Google AI Studio)
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return {
      provider: "Google Gemini",
      endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey: process.env.GEMINI_API_KEY.trim(),
      model: (process.env.GEMINI_MODEL || "gemini-1.5-flash").trim()
    };
  }

  // 3. OpenRouter (Free models available)
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim()) {
    return {
      provider: "OpenRouter",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY.trim(),
      model: (process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free").trim()
    };
  }

  // 4. OpenAI / Custom OpenAI-compatible endpoint
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
    return {
      provider: "OpenAI",
      endpoint: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions").trim(),
      apiKey: process.env.OPENAI_API_KEY.trim(),
      model: (process.env.OPENAI_MODEL || "gpt-4o-mini").trim()
    };
  }

  // 5. Hugging Face Router (Requires pre-paid credits on account)
  if (process.env.HF_TOKEN && process.env.HF_TOKEN.trim()) {
    return {
      provider: "Hugging Face",
      endpoint: "https://router.huggingface.co/v1/chat/completions",
      apiKey: process.env.HF_TOKEN.trim(),
      model: (process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct").trim()
    };
  }

  return null;
}

/**
 * Robustly parses and repairs JSON from raw LLM output
 */
function extractJSON(text) {
  if (!text || typeof text !== "string") return null;
  let cleaned = text.trim();

  // Strip markdown code fences if wrapped (```json ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        // Strip trailing commas before closing braces
        const repaired = candidate.replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(repaired);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Normalizes output schema so frontend can reliably render cards & PDF
 */
function normalizeBlueprint(raw, query) {
  const structureType = (raw.recommendedStructure && raw.recommendedStructure.type)
    || (raw.structure && raw.structure.type)
    || raw.recommendedStructure
    || raw.structure
    || "Private Limited Company";

  const structureRationale = (raw.recommendedStructure && raw.recommendedStructure.rationale)
    || (raw.structure && raw.structure.rationale)
    || "Provides limited liability protection, tax efficiency, and qualifies for venture equity & institutional banking.";

  const structureBadge = (raw.recommendedStructure && raw.recommendedStructure.badge)
    || (raw.structure && raw.structure.badge)
    || "Optimal Entity Choice";

  return {
    businessTitle: raw.businessTitle || raw.sectorName || `${query} Setup Plan`,
    sectorName: raw.sectorName || "Custom Venture",
    targetState: raw.targetState || raw.stateName || "India (Pan-India)",
    timeline: raw.timeline || "7–12 Business Days",
    teamStructure: raw.teamStructure || raw.teamModel || "Co-Founders / Multi-Director",
    recommendedStructure: {
      type: structureType,
      badge: structureBadge,
      rationale: structureRationale
    },
    mandatoryLicences: Array.isArray(raw.mandatoryLicences) ? raw.mandatoryLicences.map(lic => ({
      name: lic.name || "Statutory Registration",
      authority: lic.authority || "Government Authority",
      tag: lic.tag || "Mandatory",
      desc: lic.desc || ""
    })) : [],
    trademark: {
      name: (raw.trademark && raw.trademark.name) || "Brand & Trademark Shield",
      classes: (raw.trademark && raw.trademark.classes) || "Relevant Trademark Classes",
      desc: (raw.trademark && raw.trademark.desc) || "Protects commercial name, logo, and digital brand from copycats."
    },
    subsidies: Array.isArray(raw.subsidies) ? raw.subsidies.map(sub => ({
      name: sub.name || "Government Scheme",
      benefit: sub.benefit || sub.desc || ""
    })) : [],
    compliance: Array.isArray(raw.compliance) ? raw.compliance : [
      "Annual ROC Statutory Filings & Audit",
      "Monthly GST Returns (GSTR-1, GSTR-3B)",
      "Annual Director KYC Verification"
    ],
    aiInsight: raw.aiInsight || "Ensure intellectual property and company incorporation are initiated in parallel to lock priority rights."
  };
}

/**
 * Strictly generates dynamic business setup plans exclusively via LLM.
 * Zero static or predefined fallbacks.
 */
async function generatePlanWithLLM({ query, state, teamCount, sector }) {
  const config = getLLMConfig();

  if (!config) {
    const errorMsg = "No active LLM API key detected in server/.env.\n\n" +
      "To enable 100% dynamic AI business plans, please add your GROQ_API_KEY in server/.env.";
    console.error(`❌ [AI PLANNER] ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
      provider: null
    };
  }

  const systemPrompt = `You are CorporateMart's Senior Corporate Law & Licensing Specialist for India.
Your mission is to construct a completely customized, legally sound, and comprehensive business setup blueprint under Indian Law (Companies Act 2013, GST Act, FSSAI Act, Indian Trademark Classes, MSME Act, State Shop & Commercial Establishment Acts, pollution clearances, and Central/State subsidies).

DO NOT give generic cookie-cutter answers. Tailor all licenses, entity type, trademark classes, timelines, subsidies, and compliance obligations strictly to the user's specific business idea, scale, and location described in their prompt.

You must return ONLY a valid, raw JSON object (no markdown wrapping, no introductory text, no conversational filler).
The JSON MUST strictly conform to this exact schema:
{
  "businessTitle": "Punchy, descriptive venture title (e.g. 'Cloud Kitchen & Artisanal Bakery' or 'Drone Manufacturing Unit')",
  "sectorName": "Industry sector name",
  "targetState": "Indian State/City mentioned, or 'India (Pan-India)'",
  "timeline": "Realistic setup duration in business days (e.g. '7–12 Business Days')",
  "teamStructure": "Solo Founder or Multi-Founder / Co-Founders",
  "recommendedStructure": {
    "type": "Specific entity (e.g. Private Limited Company, Limited Liability Partnership, or OPC)",
    "badge": "Short badge (e.g. 'Recommended for Venture Capital' or 'Optimal for Food Brands')",
    "rationale": "Clear 2-sentence legal & business rationale explaining why this exact entity fits this venture."
  },
  "mandatoryLicences": [
    {
      "name": "Statutory License Name (e.g. FSSAI State Food License, CTE Pollution Consent)",
      "authority": "Exact Government Department / Authority",
      "tag": "Mandatory or Crucial or State Clearance",
      "desc": "Precise explanation of why this license is mandatory and what it covers."
    }
  ],
  "trademark": {
    "name": "Brand Name & IP Protection",
    "classes": "Specific Indian Trademark Classes (e.g. 'Class 43 & Class 30')",
    "desc": "Explanation of what brand assets and classifications are covered."
  },
  "subsidies": [
    {
      "name": "Specific Central / State Subsidy or Scheme (e.g. PM FME Scheme, Startup India 80-IAC, PMEGP)",
      "benefit": "Detailed financial grant %, loan subsidy limit, or tax exemption benefit."
    }
  ],
  "compliance": [
    "Specific post-launch filing / audit requirement 1",
    "Specific post-launch filing / audit requirement 2",
    "Specific post-launch filing / audit requirement 3"
  ],
  "aiInsight": "A high-value strategic or legal insight specifically tailored to this exact business model and state."
}`;

  const userPrompt = `Entrepreneur Prompt: "${query}".
State/Location preference: "${state || "Detect from prompt"}".
Team size/founders: "${teamCount ? (teamCount > 1 ? "2+ founders" : "Solo") : "Detect from prompt"}".
Sector focus: "${sector || "Infer from prompt"}".

Generate the complete tailored Indian business setup blueprint in pure JSON.`;

  const controller = new AbortController();
  const timeoutMs = 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log(`🤖 [AI PLANNER] Calling live LLM provider '${config.provider}' (${config.model}) for prompt: "${query}"...`);

    const requestBody = {
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 3500
    };

    // If Groq or OpenAI, enforce JSON mode for 100% reliable parsing
    if (config.provider === "Groq" || config.provider === "OpenAI") {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let parsedErr = errText;
      try {
        const j = JSON.parse(errText);
        if (j.error && j.error.message) parsedErr = j.error.message;
        else if (j.error) parsedErr = typeof j.error === "string" ? j.error : JSON.stringify(j.error);
      } catch {
        // use raw errText
      }
      console.error(`⚠️ [AI PLANNER] ${config.provider} returned HTTP ${response.status}: ${parsedErr}`);
      throw new Error(`${config.provider} API Error (HTTP ${response.status}): ${parsedErr}`);
    }

    const data = await response.json();
    const rawContent = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

    if (!rawContent) {
      throw new Error(`Empty response content received from ${config.provider} LLM.`);
    }

    const parsed = extractJSON(rawContent);
    if (!parsed) {
      console.error("Raw LLM output could not be parsed as JSON:", rawContent.slice(0, 300));
      throw new Error("The LLM responded, but output did not contain valid JSON format.");
    }

    const normalized = normalizeBlueprint(parsed, query);
    console.log(`✅ [AI PLANNER] Successfully generated dynamic plan via ${config.provider} (${config.model})!`);

    return {
      success: true,
      source: `${config.provider} AI`,
      model: config.model,
      plan: normalized
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`❌ [AI PLANNER] Failed to generate plan via ${config.provider}:`, err.message);
    return {
      success: false,
      error: err.message,
      provider: config.provider,
      model: config.model
    };
  }
}

/**
 * Dynamically answers follow-up questions from the user using the live LLM
 * with full context of their business setup blueprint.
 */
async function answerFollowUpWithLLM({ message, activeBlueprint, chatHistory }) {
  const config = getLLMConfig();

  if (!config) {
    return {
      success: false,
      error: "No active LLM API key configured in server/.env."
    };
  }

  const blueprintContext = activeBlueprint ? JSON.stringify({
    title: activeBlueprint.businessTitle || activeBlueprint.sectorName,
    state: activeBlueprint.targetState,
    structure: activeBlueprint.recommendedStructure ? activeBlueprint.recommendedStructure.type : "",
    licenses: (activeBlueprint.mandatoryLicences || []).map(l => l.name),
    trademark: activeBlueprint.trademark ? activeBlueprint.trademark.classes : "",
    timeline: activeBlueprint.timeline
  }) : "No specific blueprint loaded yet.";

  const systemPrompt = `You are CorporateMart's Senior Corporate Legal Specialist advising an entrepreneur.
Context of the business they are planning:
${blueprintContext}

Answer the entrepreneur's question with precise, actionable, legally sound guidance under Indian Law (Companies Act 2013, GST, MCA, DPIIT, MSME, State Shop Act, BMC, Municipal Acts, etc.).
Keep your reply concise (under 140 words), structured with clear markdown bullet points, bold keywords, and a direct answer.
Never give vague answers. Mention real Indian statutory forms, acts, or procedures where relevant.`;

  const messages = [
    { role: "system", content: systemPrompt }
  ];

  if (Array.isArray(chatHistory)) {
    chatHistory.slice(-4).forEach(item => {
      if (item && item.role && item.content) {
        messages.push({
          role: item.role === "bot" ? "assistant" : "user",
          content: String(item.content).slice(0, 500)
        });
      }
    });
  }

  messages.push({ role: "user", content: message });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        max_tokens: 2500
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`${config.provider} API Error (HTTP ${response.status}): ${errText.slice(0, 150)}`);
    }

    const data = await response.json();
    const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

    if (!reply) throw new Error("Empty response from LLM");

    return {
      success: true,
      reply: reply.trim(),
      provider: config.provider
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`❌ [AI PLANNER] Chat follow-up failed via ${config.provider}:`, err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  generatePlanWithLLM,
  generatePlanWithHuggingFace: generatePlanWithLLM,
  answerFollowUpWithLLM,
  getLLMConfig
};
