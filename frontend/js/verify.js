const BASE = 'https://claimsafe-backend.onrender.com';

const noData      = document.getElementById('noData');
const resultWrap  = document.getElementById('resultWrap');

const ringFill    = document.getElementById('ringFill');
const progressFill= document.getElementById('progressFill');
const scoreNum    = document.getElementById('scoreNum');

const verdictStrip = document.getElementById('verdictStrip');
const verdictIcon  = document.getElementById('verdictIcon');
const verdictTitle = document.getElementById('verdictTitle');
const verdictSub   = document.getElementById('verdictSub');

const locationSection = document.getElementById('locationSection');
const revealBtn    = document.getElementById('revealBtn');
const locationCard = document.getElementById('locationCard');
const locationError= document.getElementById('locationError');
const locationErrMsg=document.getElementById('locationErrorMsg');
const latVal       = document.getElementById('latVal');
const lngVal       = document.getElementById('lngVal');
const mapsLink     = document.getElementById('mapsLink');

const claimsSection = document.getElementById('claimsSection');
const claimsList   = document.getElementById('claimsList');

// ─── Read Session ─────────────────────────────────────────────────────────────
const itemId = sessionStorage.getItem('cs_itemId');
const score  = parseFloat(sessionStorage.getItem('cs_score'));

if (!itemId || isNaN(score)) {
  noData.style.display = 'block';
} else {
  renderResult(score);
  fetchAndDisplayClaims();
}

// ─── Render Result ────────────────────────────────────────────────────────────
function renderResult(s) {
  const pct   = Math.min(Math.max(s, 0), 100);
  const pass  = s >= 60;
  const circ  = 2 * Math.PI * 50; // 314.16

  resultWrap.style.display = 'block';

  // Animate score number
  let cur = 0; const target = Math.round(s);
  const interval = setInterval(() => {
    cur = Math.min(cur + Math.ceil(target / 35), target);
    scoreNum.textContent = cur;
    if (cur >= target) clearInterval(interval);
  }, 28);

  // Ring & progress (slight delay for drama)
  setTimeout(() => {
    const offset = circ - (pct / 100) * circ;
    ringFill.style.strokeDashoffset = offset;
    ringFill.style.stroke = pass ? '#059669' : '#dc2626';

    progressFill.style.width = `${pct}%`;
    progressFill.style.background = pass
      ? 'linear-gradient(90deg, #34d399, #059669)'
      : 'linear-gradient(90deg, #f87171, #dc2626)';

    scoreNum.style.color = pass ? '#059669' : '#dc2626';
  }, 150);

  // Verdict
  if (pass) {
    verdictStrip.className = 'verdict-strip verdict-pass';
    verdictIcon.textContent  = '✅';
    verdictTitle.textContent = 'High Confidence — Likely the Owner';
    verdictSub.textContent   = `Score ${Math.round(s)}/100 clears the 60-point threshold.`;
    locationSection.style.display = 'block';
    revealBtn.style.display = 'block'; // Enable location reveal
  } else {
    verdictStrip.className = 'verdict-strip verdict-fail';
    verdictIcon.textContent  = '❌';
    verdictTitle.textContent = 'Verification Failed';
    verdictSub.textContent   = `Score ${Math.round(s)}/100 — below the required 60 points.`;
    locationSection.style.display = 'none'; // Hide location section for low confidence
  }
}

// ─── Fetch & Display Ranked Claims ────────────────────────────────────────────
async function fetchAndDisplayClaims() {
  try {
    const res = await fetch(`${BASE}/api/claims/${itemId}`);
    if (!res.ok) throw new Error('Failed to fetch claims');

    const claims = await res.json();
    if (!claims || claims.length === 0) return;

    claimsSection.style.display = 'block';
    claimsList.innerHTML = claims.map((claim, idx) => {
      const score = claim.confidenceScore || 0;
      const rank = idx + 1;
      const answerPreview = claim.claimerAnswer ? claim.claimerAnswer.substring(0, 50) : 'N/A';
      const hasMore = claim.claimerAnswer && claim.claimerAnswer.length > 50 ? '...' : '';
      return `
        <div class="claim-item">
          <div class="claim-rank">#${rank}</div>
          <div class="claim-confidence">${score}%</div>
          <div class="claim-desc">${esc(answerPreview)}${hasMore}</div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Could not load claims:', err);
  }
}

function esc(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(s || ''));
  return d.innerHTML;
}

// ─── Reveal Location ──────────────────────────────────────────────────────────
revealBtn.addEventListener('click', async () => {
  revealBtn.disabled = true;
  revealBtn.innerHTML = '<span class="spinner"></span> Fetching…';
  locationError.classList.remove('show');

  try {
    const res = await fetch(`${BASE}/api/claims/${itemId}/location`);

    if (res.status === 403) {
      throw new Error('No valid claim with sufficient confidence yet.');
    }

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.message || `Server error (${res.status})`);
    }

    const data = await res.json();
    const lat = data.latitude ?? data.location?.latitude ?? null;
    const lng = data.longitude ?? data.location?.longitude ?? null;

    if (lat === null || lng === null) throw new Error('Location missing in response');

    latVal.textContent = parseFloat(lat).toFixed(6);
    lngVal.textContent = parseFloat(lng).toFixed(6);
    mapsLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
    locationCard.style.display = 'block';
    revealBtn.style.display    = 'none';

  } catch (err) {
    locationErrMsg.textContent = err.message || 'Could not fetch location.';
    locationError.classList.add('show');
    revealBtn.disabled = false;
    revealBtn.innerHTML = '📍 Reveal Location';
  }
});