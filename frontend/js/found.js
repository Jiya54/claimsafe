const BASE = 'http://localhost:5000';

const form        = document.getElementById('foundForm');
const submitBtn   = document.getElementById('submitBtn');
const geolocateBtn = document.getElementById('geolocateBtn');
const successAlert = document.getElementById('successAlert');
const errorAlert  = document.getElementById('errorAlert');
const errorMsg    = document.getElementById('errorMsg');

const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');

// ─── Geolocation ──────────────────────────────────────────────────────────────
geolocateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    errorMsg.textContent = 'Geolocation is not supported by your browser.';
    showAlert('error');
    return;
  }

  geolocateBtn.disabled = true;
  geolocateBtn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:0.5rem;vertical-align:middle"></span> Getting location…';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      latitudeInput.value = latitude.toFixed(4);
      longitudeInput.value = longitude.toFixed(4);
      geolocateBtn.disabled = false;
      geolocateBtn.innerHTML = '📍 Use My Current Location';
    },
    (error) => {
      let msg = 'Unable to get your location.';
      if (error.code === error.PERMISSION_DENIED) {
        msg = 'Location permission denied. Please enable it in your browser settings.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        msg = 'Location information is unavailable.';
      } else if (error.code === error.TIMEOUT) {
        msg = 'The request to get user location timed out.';
      }
      errorMsg.textContent = msg;
      showAlert('error');
      geolocateBtn.disabled = false;
      geolocateBtn.innerHTML = '📍 Use My Current Location';
    }
  );
});

// ─── Form Submission ──────────────────────────────────────────────────────────
function showAlert(type) {
  successAlert.classList.remove('show');
  errorAlert.classList.remove('show');
  (type === 'success' ? successAlert : errorAlert).classList.add('show');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title        = document.getElementById('title').value.trim();
  const description  = document.getElementById('description').value.trim();
  const secretQuestion = document.getElementById('secretQuestion').value.trim();
  const secretAnswer = document.getElementById('secretAnswer').value.trim();
  const imageFile    = document.getElementById('itemImage').files[0];
  const latitude     = document.getElementById('latitude').value.trim();
  const longitude    = document.getElementById('longitude').value.trim();

  // Validation
  if (!title || !description || !secretQuestion || !secretAnswer) {
    errorMsg.textContent = 'Please fill in all required fields.';
    showAlert('error');
    return;
  }

  if (!imageFile) {
    errorMsg.textContent = 'Please upload an image of the item.';
    showAlert('error');
    return;
  }

  if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
    errorMsg.textContent = 'Please provide valid coordinates or use geolocation.';
    showAlert('error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Submitting…';
  errorAlert.classList.remove('show');

  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('secretQuestion', secretQuestion);
    formData.append('secretAnswer', secretAnswer);
    formData.append('image', imageFile);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);

    const res = await fetch(`${BASE}/api/items`, {
      method: 'POST',
      body: formData
      // Note: Don't set Content-Type header - browser will set it automatically with boundary
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Server error (${res.status})`);
    }

    showAlert('success');
    form.reset();
    latitudeInput.value = '';
    longitudeInput.value = '';

    // Optionally redirect after 2 seconds
    setTimeout(() => {
      window.location.href = 'claim.html';
    }, 2000);

  } catch (err) {
    errorMsg.textContent = err.message || 'Could not reach the server.';
    showAlert('error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Submit Report';
  }
});