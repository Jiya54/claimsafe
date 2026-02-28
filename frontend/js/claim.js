const BASE = 'https://claimsafe-backend.onrender.com';

const grid         = document.getElementById('itemsGrid');
const stLoading    = document.getElementById('stateLoading');
const stError      = document.getElementById('stateError');
const stEmpty      = document.getElementById('stateEmpty');
const modal        = document.getElementById('claimModal');
const modalError   = document.getElementById('modalError');
const modalErrorMsg = document.getElementById('modalErrorMsg');
const submitBtn    = document.getElementById('submitClaim');
const cancelBtn    = document.getElementById('cancelClaim');
const closeBtn     = document.getElementById('closeModal');

let activeItemId = null;

// ─── State helpers ────────────────────────────────────────────────────────────
function showState(name) {
  stLoading.style.display = name === 'loading' ? 'block' : 'none';
  stError.style.display   = name === 'error'   ? 'block' : 'none';
  stEmpty.style.display   = name === 'empty'   ? 'block' : 'none';
  grid.style.display      = name === 'grid'    ? 'grid'  : 'none';
}

// ─── Load Items ───────────────────────────────────────────────────────────────
async function loadItems() {
  showState('loading');
  try {
    const res = await fetch(`${BASE}/api/items`);
    if (!res.ok) throw new Error();
    const items = await res.json();

    if (!items.length) { showState('empty'); return; }

    grid.innerHTML = items.map(renderCard).join('');
    grid.querySelectorAll('.verify-btn').forEach(btn =>
      btn.addEventListener('click', () => openModal(btn.dataset.id))
    );
    showState('grid');

  } catch {
    showState('error');
  }
}

// ─── Card template ────────────────────────────────────────────────────────────
function renderCard(item) {
  const id = item._id || item.id || '';
  return `
    <div class="card item-card enter shadow-lg rounded-lg overflow-hidden bg-white border border-gray-200">
      <!-- Image -->
      <img src="${BASE}/uploads/${item.image}" alt="${item.title}" class="w-full h-48 object-cover">
      
      <!-- Content -->
      <div class="p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="badge badge-indigo">Found</span>
          <span class="text-sm text-gray-400">#${id.slice(-5) || 'N/A'}</span>
        </div>
        <div class="text-lg font-semibold mb-1">${esc(item.title)}</div>
        <div class="text-gray-600 text-sm mb-4">${esc(item.description)}</div>
        <button class="btn btn-primary verify-btn w-full py-2 text-sm" data-id="${id}">
          Verify Ownership →
        </button>
      </div>
    </div>`;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(id) {
  activeItemId = id;
  
  // Fetch the secret question first
  fetchAndShowQuestion(id);
  
  modal.classList.add('open');
  setTimeout(() => document.getElementById('claimerAnswer').focus(), 80);
}
function closeModal() {
  modal.classList.remove('open');
  activeItemId = null;
}
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// ─── Fetch Secret Question ────────────────────────────────────────────────
async function fetchAndShowQuestion(itemId) {
  try {
    const res = await fetch(`${BASE}/api/items/${itemId}/question`);
    
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.message || 'Could not fetch question');
    }

    const data = await res.json();
    document.getElementById('secretQuestion').textContent = data.secretQuestion || 'Question not available';
    document.getElementById('claimerAnswer').value = '';
    modalError.classList.remove('show');

  } catch (err) {
    modalErrorMsg.textContent = err.message || 'Failed to load question.';
    modalError.classList.add('show');
  }
}

// ─── Submit Claim ─────────────────────────────────────────────────────────────
submitBtn.addEventListener('click', async () => {
  const answer = document.getElementById('claimerAnswer').value.trim();
  if (!answer) {
    modalErrorMsg.textContent = 'Please enter an answer.';
    modalError.classList.add('show');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Verifying…';
  modalError.classList.remove('show');

  try {
    const res = await fetch(`${BASE}/api/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: activeItemId, claimerAnswer: answer }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.message || `Server error (${res.status})`);
    }

    const data = await res.json();
    const score = data.confidence ?? 0;

    sessionStorage.setItem('cs_itemId', activeItemId);
    sessionStorage.setItem('cs_score',  score);

    window.location.href = 'verify.html';

  } catch (err) {
    modalErrorMsg.textContent = err.message || 'Could not submit claim.';
    modalError.classList.add('show');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Verify →';
  }
});

function esc(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(s || ''));
  return d.innerHTML;
}

loadItems();