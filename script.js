/* =====================================================
   IDEAFORGE AI — script.js
   Real AI-powered Business Idea Generator
   Uses Anthropic Claude API (claude-sonnet-4-20250514)
   ===================================================== */

// ─── STATE ──────────────────────────────────────────
let ideaCount  = 3;
let detailLevel = 'detailed';
let currentIdeas = [];
let savedIdeas   = [];
let lastFormData = null;

// ─── INIT ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSaved();
  checkApiKey();
  updateSavedCount();
});

// ─── API KEY MANAGEMENT ──────────────────────────────
function checkApiKey() {
  const key = localStorage.getItem('ideaforge_api_key');
  if (key && key.startsWith('sk-ant')) {
    closeGate();
  }
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) {
    showToast('⚠️ Please enter your API key');
    return;
  }
  if (!key.startsWith('sk-ant')) {
    showToast('⚠️ API key should start with "sk-ant"');
    return;
  }
  localStorage.setItem('ideaforge_api_key', key);
  closeGate();
  showToast('✅ API key saved! Welcome to IdeaForge.');
}

function closeGate() {
  const overlay = document.getElementById('gateOverlay');
  overlay.style.transition = 'opacity 0.5s ease';
  overlay.style.opacity = '0';
  setTimeout(() => { overlay.style.display = 'none'; }, 500);
}

function resetApiKey() {
  if (!confirm('Reset your API key? You\'ll need to enter it again.')) return;
  localStorage.removeItem('ideaforge_api_key');
  const overlay = document.getElementById('gateOverlay');
  overlay.style.display = 'flex';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.4s ease';
  document.getElementById('apiKeyInput').value = '';
  setTimeout(() => { overlay.style.opacity = '1'; }, 10);
}

function toggleKeyVisibility() {
  const input = document.getElementById('apiKeyInput');
  const btn   = document.getElementById('keyToggle');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

// Allow Enter key on API input
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement?.id === 'apiKeyInput') {
    saveApiKey();
  }
});

// ─── PILL SELECTORS ──────────────────────────────────
function setCount(btn) {
  document.querySelectorAll('[data-count]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ideaCount = parseInt(btn.dataset.count);
}

function setDetail(btn) {
  document.querySelectorAll('[data-detail]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  detailLevel = btn.dataset.detail;
}

// ─── FORM HELPERS ────────────────────────────────────
function clearForm() {
  ['industry', 'country', 'audience', 'budget', 'skills', 'model', 'insight'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  hideAll();
  showToast('Form cleared');
}

function getFormData() {
  return {
    industry:  document.getElementById('industry').value.trim(),
    country:   document.getElementById('country').value.trim(),
    audience:  document.getElementById('audience').value.trim(),
    budget:    document.getElementById('budget').value.trim(),
    skills:    document.getElementById('skills').value.trim(),
    model:     document.getElementById('model').value.trim(),
    insight:   document.getElementById('insight').value.trim(),
    count:     ideaCount,
    detail:    detailLevel
  };
}

function validateForm(data) {
  if (!data.industry) { showToast('⚠️ Please enter an Industry / Niche'); return false; }
  if (!data.country)  { showToast('⚠️ Please enter a Target Market'); return false; }
  if (!data.audience) { showToast('⚠️ Please enter Target Customers'); return false; }
  return true;
}

// ─── MAIN GENERATE ───────────────────────────────────
async function generateIdeas() {
  const apiKey = localStorage.getItem('ideaforge_api_key');
  if (!apiKey) {
    checkApiKey();
    showToast('⚠️ Please set your API key first');
    return;
  }

  const data = getFormData();
  if (!validateForm(data)) return;
  lastFormData = data;

  hideAll();
  showLoading();
  animateLoadingBar();

  try {
    const prompt = buildPrompt(data);
    const result = await callClaude(apiKey, prompt);
    const ideas  = parseIdeas(result);

    if (!ideas || ideas.length === 0) {
      throw new Error('Claude returned no ideas. Please try again with more specific inputs.');
    }

    currentIdeas = ideas;
    hideAll();
    renderResults(ideas);
  } catch (err) {
    hideAll();
    showError(err.message);
  }
}

function regenerate() {
  if (lastFormData) generateIdeas();
}

// ─── PROMPT BUILDER ──────────────────────────────────
function buildPrompt(d) {
  const detailInstructions = {
    concise:   'Keep each idea concise. concept: 1-2 sentences. action_steps: 3 brief steps.',
    detailed:  'Be thorough. concept: 3-4 sentences. action_steps: 5 clear steps. Include real market insight.',
    'deep-dive': 'Be extremely detailed and analytical. concept: 5-6 sentences. action_steps: 7 specific actionable steps. Include market data estimates, competitor landscape, monetization breakdown.'
  };

  return `You are a world-class startup strategist and business consultant with deep knowledge of emerging markets, especially ${d.country}. You specialize in zero-to-one business building.

Generate exactly ${d.count} highly specific, original, and actionable business ideas based on this profile:

FOUNDER PROFILE:
- Industry / Niche: ${d.industry}
- Target Market: ${d.country}
- Target Customers: ${d.audience}
${d.budget   ? `- Available Budget: ${d.budget}` : ''}
${d.skills   ? `- Founder Skills: ${d.skills}` : ''}
${d.model    ? `- Preferred Business Model: ${d.model}` : ''}
${d.insight  ? `- Founder's Key Insight: ${d.insight}` : ''}

INSTRUCTIONS:
- Ideas must be SPECIFIC to the market (${d.country}), NOT generic global ideas
- Ideas should be realistic, actionable, and well-matched to the founder's skills and budget
- Avoid overused startup clichés. Be innovative but grounded
- ${detailInstructions[d.detail] || detailInstructions.detailed}
- Each idea must have a unique, memorable brand name (not just a description)

Respond ONLY with a valid JSON object, no preamble, no markdown, no extra text. Strict JSON format:

{
  "ideas": [
    {
      "name": "Brand name of the business",
      "tagline": "One punchy sentence tagline (max 12 words)",
      "concept": "Full concept explanation",
      "problem_solved": "The specific pain point this addresses",
      "revenue_model": "How this business makes money (be specific: pricing, tiers, etc)",
      "startup_cost": "Realistic cost estimate with currency for ${d.country}",
      "market_opportunity": "Size/scale of the opportunity in ${d.country}",
      "competitive_advantage": "Why this wins in this specific market",
      "action_steps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
      "risk_level": "Low" or "Medium" or "High",
      "time_to_revenue": "Realistic estimate (e.g. 2-4 weeks, 3-6 months)",
      "why_now": "Why this is the right time to start this business"
    }
  ]
}`;
}

// ─── API CALL ─────────────────────────────────────────
async function callClaude(apiKey, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':         'application/json',
      'x-api-key':            apiKey,
      'anthropic-version':    '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    let errMsg = `API error (${response.status})`;
    try {
      const errData = await response.json();
      if (errData.error?.message) {
        if (response.status === 401) errMsg = 'Invalid API key. Please reset and try again.';
        else if (response.status === 429) errMsg = 'Rate limit reached. Please wait a moment and try again.';
        else if (response.status === 529) errMsg = 'Claude is overloaded right now. Please try again in a few seconds.';
        else errMsg = errData.error.message;
      }
    } catch(_) {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Claude. Please try again.');
  return rawText;
}

// ─── JSON PARSER ─────────────────────────────────────
function parseIdeas(rawText) {
  // Strip markdown fences if present
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.ideas && Array.isArray(parsed.ideas)) return parsed.ideas;
  } catch (_) {}

  // Try to extract JSON object from text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.ideas && Array.isArray(parsed.ideas)) return parsed.ideas;
    } catch (_) {}
  }

  throw new Error('Could not parse Claude\'s response. Try again with clearer inputs.');
}

// ─── RENDER RESULTS ──────────────────────────────────
function renderResults(ideas) {
  const grid   = document.getElementById('ideasGrid');
  const section = document.getElementById('resultsSection');

  grid.innerHTML = '';
  ideas.forEach((idea, i) => {
    const saved   = isIdeaSaved(idea.name);
    const riskCls = getRiskClass(idea.risk_level);

    const card = document.createElement('div');
    card.className = 'idea-card';
    card.innerHTML = `
      <div class="card-number">Idea ${i + 1} of ${ideas.length}</div>
      <div class="card-name">${escHtml(idea.name)}</div>
      <div class="card-tagline">"${escHtml(idea.tagline)}"</div>
      <div class="card-concept">${escHtml(idea.concept)}</div>
      <div class="card-stats">
        <div class="stat-chip">
          <div class="stat-label">💰 Startup Cost</div>
          <div class="stat-value">${escHtml(idea.startup_cost || 'See details')}</div>
        </div>
        <div class="stat-chip">
          <div class="stat-label">⏱ Time to Revenue</div>
          <div class="stat-value">${escHtml(idea.time_to_revenue || 'See details')}</div>
        </div>
      </div>
      <div class="card-footer">
        <div>
          <span class="risk-badge ${riskCls}">● ${idea.risk_level || 'Medium'} Risk</span>
        </div>
        <div class="card-actions">
          <button class="card-btn ${saved ? 'saved' : ''}" onclick="event.stopPropagation(); toggleSave(${i})" id="saveBtn-${i}" title="${saved ? 'Unsave' : 'Save idea'}">
            ${saved ? '🔖' : '🔖'}
          </button>
          <button class="card-btn" onclick="event.stopPropagation(); copyIdea(${i})" title="Copy to clipboard">📋</button>
        </div>
      </div>
      <div class="expand-hint">Click to view full details →</div>
    `;

    card.addEventListener('click', () => openModal(i));
    grid.appendChild(card);
  });

  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── MODAL ───────────────────────────────────────────
function openModal(index) {
  const idea   = currentIdeas[index];
  const saved  = isIdeaSaved(idea.name);
  const riskCls = getRiskClass(idea.risk_level);

  const stepsHTML = (idea.action_steps || []).map((step, i) =>
    `<li class="action-step"><span class="step-num">${i + 1}</span><span>${escHtml(step)}</span></li>`
  ).join('');

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-number">Idea ${index + 1}</div>
    <div class="modal-name">${escHtml(idea.name)}</div>
    <div class="modal-tagline">"${escHtml(idea.tagline)}"</div>

    <div class="modal-stats-grid">
      <div class="modal-stat">
        <div class="modal-stat-label">💰 Startup Cost</div>
        <div class="modal-stat-value">${escHtml(idea.startup_cost || '—')}</div>
      </div>
      <div class="modal-stat">
        <div class="modal-stat-label">⏱ Time to Revenue</div>
        <div class="modal-stat-value">${escHtml(idea.time_to_revenue || '—')}</div>
      </div>
      <div class="modal-stat">
        <div class="modal-stat-label">🎯 Risk Level</div>
        <div class="modal-stat-value"><span class="risk-badge ${riskCls}" style="font-size:12px;">● ${idea.risk_level || 'Medium'}</span></div>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">🚀 The Concept</div>
      <p class="modal-text">${escHtml(idea.concept)}</p>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">🔥 Problem Solved</div>
      <p class="modal-text">${escHtml(idea.problem_solved || '—')}</p>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">💵 Revenue Model</div>
      <p class="modal-text">${escHtml(idea.revenue_model || '—')}</p>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">📊 Market Opportunity</div>
      <p class="modal-text">${escHtml(idea.market_opportunity || '—')}</p>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">🛡 Competitive Advantage</div>
      <p class="modal-text">${escHtml(idea.competitive_advantage || '—')}</p>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">⏰ Why Now</div>
      <p class="modal-text">${escHtml(idea.why_now || '—')}</p>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">📋 Action Steps</div>
      <ul class="action-steps">${stepsHTML}</ul>
    </div>

    <div class="modal-footer">
      <button class="btn-primary" onclick="toggleSave(${index}); updateModalSaveBtn(${index})" id="modalSaveBtn">
        ${saved ? '🔖 Unsave Idea' : '🔖 Save Idea'}
      </button>
      <button class="btn-ghost" onclick="copyIdea(${index})">📋 Copy</button>
      <button class="btn-ghost" onclick="exportSingleIdea(${index})">📥 Export</button>
    </div>
  `;

  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay') && !e.target.classList.contains('modal-close')) return;
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function updateModalSaveBtn(index) {
  const idea  = currentIdeas[index];
  const saved = isIdeaSaved(idea.name);
  const btn   = document.getElementById('modalSaveBtn');
  if (btn) btn.textContent = saved ? '🔖 Unsave Idea' : '🔖 Save Idea';
}

// ESC to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal({ target: document.getElementById('modalOverlay') });
    closeSaved();
  }
});

// ─── SAVE / UNSAVE ────────────────────────────────────
function isIdeaSaved(name) {
  return savedIdeas.some(i => i.name === name);
}

function toggleSave(index) {
  const idea  = currentIdeas[index];
  const saved = isIdeaSaved(idea.name);

  if (saved) {
    savedIdeas = savedIdeas.filter(i => i.name !== idea.name);
    showToast('Idea removed from saved');
  } else {
    savedIdeas.push({ ...idea, savedAt: new Date().toLocaleString() });
    showToast('🔖 Idea saved!');
  }

  persistSaved();
  updateSavedCount();
  refreshSaveBtn(index);
  renderSavedList();
}

function refreshSaveBtn(index) {
  const idea  = currentIdeas[index];
  const saved = isIdeaSaved(idea.name);
  const btn   = document.getElementById(`saveBtn-${index}`);
  if (btn) {
    btn.classList.toggle('saved', saved);
    btn.title = saved ? 'Unsave' : 'Save idea';
  }
}

function persistSaved() {
  localStorage.setItem('ideaforge_saved', JSON.stringify(savedIdeas));
}

function loadSaved() {
  try {
    const raw = localStorage.getItem('ideaforge_saved');
    savedIdeas = raw ? JSON.parse(raw) : [];
  } catch (_) {
    savedIdeas = [];
  }
}

function updateSavedCount() {
  const el = document.getElementById('savedCount');
  if (el) el.textContent = savedIdeas.length;
}

// ─── SAVED PANEL ─────────────────────────────────────
function openSaved() {
  renderSavedList();
  document.getElementById('savedPanel').classList.add('open');
  document.getElementById('savedOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSaved(e) {
  if (e && e.target !== document.getElementById('savedOverlay')) return;
  document.getElementById('savedPanel').classList.remove('open');
  document.getElementById('savedOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderSavedList() {
  const list    = document.getElementById('savedList');
  const empty   = document.getElementById('savedEmpty');
  const footer  = document.getElementById('savedFooter');

  if (savedIdeas.length === 0) {
    list.innerHTML   = '';
    empty.style.display  = 'block';
    footer.style.display = 'none';
    return;
  }

  empty.style.display  = 'none';
  footer.style.display = 'flex';

  list.innerHTML = savedIdeas.map((idea, i) => `
    <div class="saved-item">
      <div class="saved-item-name">${escHtml(idea.name)}</div>
      <div class="saved-item-tagline">"${escHtml(idea.tagline || '')}"</div>
      <div class="saved-item-meta">
        <span class="risk-badge ${getRiskClass(idea.risk_level)}" style="font-size:10px;padding:2px 8px;">● ${idea.risk_level || 'Medium'} Risk</span>
        &nbsp;·&nbsp; Saved ${idea.savedAt || ''}
      </div>
      <button class="saved-item-remove" onclick="removeSaved(${i})" title="Remove">✕</button>
    </div>
  `).join('');
}

function removeSaved(index) {
  savedIdeas.splice(index, 1);
  persistSaved();
  updateSavedCount();
  renderSavedList();
  showToast('Removed from saved');
}

function clearSaved() {
  if (!confirm(`Clear all ${savedIdeas.length} saved ideas?`)) return;
  savedIdeas = [];
  persistSaved();
  updateSavedCount();
  renderSavedList();
  showToast('All saved ideas cleared');
}

// ─── COPY & EXPORT ────────────────────────────────────
function ideaToText(idea, index) {
  const steps = (idea.action_steps || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n');
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDEA ${index + 1}: ${idea.name}
"${idea.tagline}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Concept:
${idea.concept}

🔥 Problem Solved:
${idea.problem_solved || '—'}

💵 Revenue Model:
${idea.revenue_model || '—'}

📊 Market Opportunity:
${idea.market_opportunity || '—'}

🛡 Competitive Advantage:
${idea.competitive_advantage || '—'}

⏰ Why Now:
${idea.why_now || '—'}

💰 Startup Cost: ${idea.startup_cost || '—'}
⏱ Time to Revenue: ${idea.time_to_revenue || '—'}
🎯 Risk Level: ${idea.risk_level || '—'}

📋 Action Steps:
${steps}
`;
}

function copyIdea(index) {
  const idea = currentIdeas[index];
  const text = ideaToText(idea, index);
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Idea copied to clipboard!');
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('📋 Idea copied!');
  });
}

function exportIdeas() {
  if (currentIdeas.length === 0) { showToast('No ideas to export'); return; }
  const header  = `IDEAFORGE AI — Business Ideas Report\nGenerated: ${new Date().toLocaleString()}\n${'═'.repeat(50)}\n\n`;
  const content = currentIdeas.map((idea, i) => ideaToText(idea, i)).join('\n\n');
  downloadText(header + content, 'ideaforge-business-ideas.txt');
  showToast('📥 Ideas exported!');
}

function exportSingleIdea(index) {
  const idea   = currentIdeas[index];
  const header = `IDEAFORGE AI — ${idea.name}\nGenerated: ${new Date().toLocaleString()}\n${'═'.repeat(50)}\n\n`;
  downloadText(header + ideaToText(idea, index), `ideaforge-${idea.name.replace(/\s+/g, '-').toLowerCase()}.txt`);
  showToast('📥 Exported!');
}

function exportSaved() {
  if (savedIdeas.length === 0) { showToast('No saved ideas to export'); return; }
  const header  = `IDEAFORGE AI — Saved Business Ideas\nExported: ${new Date().toLocaleString()}\n${'═'.repeat(50)}\n\n`;
  const content = savedIdeas.map((idea, i) => ideaToText(idea, i)).join('\n\n');
  downloadText(header + content, 'ideaforge-saved-ideas.txt');
  showToast('📥 Saved ideas exported!');
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── LOADING STATE ────────────────────────────────────
const loadingMessages = [
  'Analyzing market opportunities in your sector…',
  'Identifying underserved customer segments…',
  'Mapping competitive landscape…',
  'Crafting revenue model strategies…',
  'Calculating startup cost estimates…',
  'Building actionable go-to-market steps…',
  'Stress-testing ideas for your budget…',
  'Finalizing your personalized business ideas…'
];

let loadingMsgInterval = null;
let loadingBarTimeout  = null;

function showLoading() {
  document.getElementById('loadingSection').style.display = 'flex';
  document.getElementById('generateBtn').disabled = true;

  let msgIdx = 0;
  const msgEl = document.getElementById('loadingMsg');
  msgEl.textContent = loadingMessages[0];

  loadingMsgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    msgEl.style.opacity = '0';
    setTimeout(() => {
      msgEl.textContent = loadingMessages[msgIdx];
      msgEl.style.transition = 'opacity 0.3s ease';
      msgEl.style.opacity    = '1';
    }, 200);
  }, 2200);
}

function animateLoadingBar() {
  let progress = 0;
  const fill   = document.getElementById('loadingFill');
  const step   = () => {
    progress += Math.random() * 8 + 2;
    if (progress > 92) progress = 92; // Hold near end until complete
    fill.style.width = `${progress}%`;
    if (progress < 92) {
      loadingBarTimeout = setTimeout(step, 400 + Math.random() * 300);
    }
  };
  step();
}

function hideLoading() {
  const fill = document.getElementById('loadingFill');
  if (fill) fill.style.width = '100%';
  clearInterval(loadingMsgInterval);
  clearTimeout(loadingBarTimeout);

  setTimeout(() => {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('generateBtn').disabled = false;
    if (fill) fill.style.width = '0%';
  }, 400);
}

function hideAll() {
  hideLoading();
  document.getElementById('resultsSection').style.display = 'none';
  document.getElementById('errorSection').style.display   = 'none';
}

function showError(msg) {
  document.getElementById('errorMsg').textContent = msg || 'Unknown error occurred.';
  document.getElementById('errorSection').style.display  = 'flex';
  document.getElementById('generateBtn').disabled = false;
  document.getElementById('errorSection').scrollIntoView({ behavior: 'smooth' });
}

// ─── UTILITIES ───────────────────────────────────────
function getRiskClass(level) {
  if (!level) return 'risk-medium';
  const l = level.toLowerCase();
  if (l === 'low')  return 'risk-low';
  if (l === 'high') return 'risk-high';
  return 'risk-medium';
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3000);
}
