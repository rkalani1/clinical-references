// DOM Elements
const sliderNPi = document.getElementById('slider-npi');
const sliderCV = document.getElementById('slider-cv');
const sliderSize = document.getElementById('slider-size');
const sliderChange = document.getElementById('slider-change');
const sliderDiff = document.getElementById('slider-diff');

const valNPi = document.getElementById('val-npi');
const valCV = document.getElementById('val-cv');
const valSize = document.getElementById('val-size');
const valChange = document.getElementById('val-change');
const valDiff = document.getElementById('val-diff');

const pupilLeft = document.getElementById('pupil-left');
const pupilRight = document.getElementById('pupil-right');
const leftDisplaySize = document.getElementById('left-display-size');
const rightDisplaySize = document.getElementById('right-display-size');

const btnStimulate = document.getElementById('btn-stimulate');
const interpreterCard = document.getElementById('interpreter-card');
const clinicalStatusBadge = document.getElementById('clinical-status-badge');
const riskBar = document.getElementById('risk-bar');
const interpreterText = document.getElementById('interpreter-text');
const actionSteps = document.getElementById('action-steps');

const predictionIch = document.getElementById('prediction-ich');
const predictionStroke = document.getElementById('prediction-stroke');

// Switch View (Dashboard vs Print)
function switchView(view, saveToStorage = true) {
  const dashboardView = document.getElementById('dashboard-view');
  const printView = document.getElementById('print-view');
  const btnDashboard = document.getElementById('toggle-dashboard');
  const btnPrint = document.getElementById('toggle-print');

  if (view === 'dashboard') {
    dashboardView.classList.add('active');
    printView.classList.remove('active');
    btnDashboard.classList.add('active');
    btnPrint.classList.remove('active');
  } else if (view === 'print') {
    printView.classList.add('active');
    dashboardView.classList.remove('active');
    btnPrint.classList.add('active');
    btnDashboard.classList.remove('active');
  }

  if (saveToStorage) {
    localStorage.setItem('preferredView', view);
  }
}

// Update Sliders and Interpret
function updateSliders() {
  const npi = parseFloat(sliderNPi.value);
  const cv = parseFloat(sliderCV.value);
  const size = parseFloat(sliderSize.value);
  const change = parseInt(sliderChange.value);
  const diff = parseFloat(sliderDiff.value);

  // Update label text
  valNPi.textContent = npi.toFixed(1);
  valCV.textContent = cv.toFixed(1) + ' mm/s';
  valSize.textContent = size.toFixed(1) + ' mm';
  valChange.textContent = change + '%';
  valDiff.textContent = diff.toFixed(1);

  // Calculate eye-specific sizes
  // Left eye is ipsilateral (lesion), right eye is contralateral (normal/healthy)
  const leftInitial = size;
  // If there's asymmetry, contralateral pupil might be smaller or larger (anisocoria)
  // Typically, compression causes ipsilateral pupil dilation relative to contralateral.
  // So contralateral (right) size = ipsilateral (left) size - diff (within a minimum of 1.5mm)
  const rightInitial = Math.max(1.5, size - (diff * 1.5));

  leftDisplaySize.textContent = `Initial: ${leftInitial.toFixed(1)} mm`;
  rightDisplaySize.textContent = `Initial: ${rightInitial.toFixed(1)} mm`;

  // Draw pupils at their static initial state
  drawStaticPupils(leftInitial, rightInitial);

  // Interpret values
  interpretClinicalMetrics(npi, cv, change, diff);
}

// Draw static pupils
function drawStaticPupils(leftSize, rightSize) {
  // Scale size for pixel rendering (e.g. 1mm = 10px)
  const leftPx = leftSize * 10;
  const rightPx = rightSize * 10;

  pupilLeft.style.width = `${leftPx}px`;
  pupilLeft.style.height = `${leftPx}px`;
  pupilLeft.style.transition = 'width 0.15s ease-out, height 0.15s ease-out';

  pupilRight.style.width = `${rightPx}px`;
  pupilRight.style.height = `${rightPx}px`;
  pupilRight.style.transition = 'width 0.15s ease-out, height 0.15s ease-out';
}

// Simulate Pupil Constriction Animation
let isAnimating = false;
function simulateReflex() {
  if (isAnimating) return;
  isAnimating = true;

  btnStimulate.classList.add('animating');
  btnStimulate.disabled = true;

  const npi = parseFloat(sliderNPi.value);
  const cv = parseFloat(sliderCV.value);
  const size = parseFloat(sliderSize.value);
  const change = parseInt(sliderChange.value);
  const diff = parseFloat(sliderDiff.value);

  const leftInitial = size;
  const rightInitial = Math.max(1.5, size - (diff * 1.5));

  // Constricted size calculations
  // Left eye constricted size based on slider percentage change
  const leftConstricted = Math.max(1.0, leftInitial * (1 - change / 100));
  
  // Right eye (contralateral) has preserved constriction (e.g. 20% change) unless NPi is completely dead
  const rightChange = npi === 0 ? 0 : 20; 
  const rightConstricted = Math.max(1.0, rightInitial * (1 - rightChange / 100));

  // Constriction velocity mapping to CSS transition duration
  // Normal CV (1.5) -> ~0.25s duration. Low CV (0.5) -> ~0.75s duration. Dead (0.0) -> no movement.
  const leftDuration = cv > 0 ? (0.375 / cv) : 0;
  const rightDuration = 0.25; // Normal contralateral velocity

  // Latency mapping: Abnormal NPi can increase latency
  // Standard latency ~0.2s. Dead/herniating -> delayed latency or none.
  const leftLatency = npi < 3.0 ? (5.0 - npi) * 0.1 : 0.2;
  const rightLatency = 0.2; // Normal contralateral latency

  // Apply Constriction (Phase 1)
  if (leftDuration > 0 && change > 0) {
    pupilLeft.style.transition = `width ${leftDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${leftLatency}s, height ${leftDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${leftLatency}s`;
    pupilLeft.style.width = `${leftConstricted * 10}px`;
    pupilLeft.style.height = `${leftConstricted * 10}px`;
    leftDisplaySize.textContent = `Constricted: ${leftConstricted.toFixed(1)} mm`;
  }
  
  if (rightDuration > 0 && rightChange > 0) {
    pupilRight.style.transition = `width ${rightDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${rightLatency}s, height ${rightDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${rightLatency}s`;
    pupilRight.style.width = `${rightConstricted * 10}px`;
    pupilRight.style.height = `${rightConstricted * 10}px`;
    rightDisplaySize.textContent = `Constricted: ${rightConstricted.toFixed(1)} mm`;
  }

  // Redilate back to initial after 1.5 seconds (Phase 2)
  setTimeout(() => {
    // Redilation duration is typically slower than constriction (e.g. 0.8s)
    pupilLeft.style.transition = 'width 0.8s ease-out, height 0.8s ease-out';
    pupilLeft.style.width = `${leftInitial * 10}px`;
    pupilLeft.style.height = `${leftInitial * 10}px`;
    leftDisplaySize.textContent = `Initial: ${leftInitial.toFixed(1)} mm`;

    pupilRight.style.transition = 'width 0.8s ease-out, height 0.8s ease-out';
    pupilRight.style.width = `${rightInitial * 10}px`;
    pupilRight.style.height = `${rightInitial * 10}px`;
    rightDisplaySize.textContent = `Initial: ${rightInitial.toFixed(1)} mm`;

    // Unlock button
    setTimeout(() => {
      btnStimulate.classList.remove('animating');
      btnStimulate.disabled = false;
      isAnimating = false;
    }, 850);
  }, 1600);
}

// Clinical Interpretation Algorithm
function interpretClinicalMetrics(npi, cv, change, diff) {
  let statusClass = 'status-normal';
  let statusText = 'NORMAL PROFILE';
  let riskPercent = 10;
  let text = '';
  let steps = [];
  
  // Calculate Midline Shifts based on Asymmetry (NPi Diff)
  // β = 0.11 for septum pellucidum shift in ICH
  // β = 0.16 for pineal gland shift in ischemic stroke
  let ichShift = diff * 5.5; // Estimated shift in mm
  let strokeShift = diff * 8.0; // Estimated shift in mm

  if (diff === 0) {
    predictionIch.innerHTML = 'Normal symmetry<br><span class="desc">&lt;2 mm shift likely</span>';
    predictionStroke.innerHTML = 'Normal symmetry<br><span class="desc">&lt;2 mm shift likely</span>';
  } else {
    const ichProb = diff >= 0.7 ? 'High probability' : 'Low probability';
    const strokeProb = diff >= 0.7 ? 'High probability' : 'Low probability';
    predictionIch.innerHTML = `<strong>${ichProb}</strong><br><span class="desc">Est. Septum Shift: ~${ichShift.toFixed(1)} mm</span>`;
    predictionStroke.innerHTML = `<strong>${strokeProb}</strong><br><span class="desc">Est. Pineal Shift: ~${strokeShift.toFixed(1)} mm</span>`;
  }

  // 1. Herniation (Critical Danger)
  if (npi <= 1.0) {
    statusClass = 'status-critical';
    statusText = 'HERNIATION CRISIS (CRITICAL)';
    riskPercent = 100;
    text = `<strong>Critical Alert:</strong> NPi is extremely abnormal (${npi.toFixed(1)}), indicating severe brainstem compression, midbrain dysfunction, or active transtentorial herniation. Immediate hyperosmolar decompression is required.`;
    steps = [
      'Administer hyperosmolar bolus immediately (mannitol 1g/kg or 23.4% hypertonic saline 30mL).',
      'Elevate head of bed to 30 degrees and align neck straight to optimize venous drainage.',
      'Temporarily hyperventilate the patient (target PaCO2 30–35 mmHg) as a bridge.',
      'STAT contact to Neurosurgery for emergency surgical decompression (hemicraniectomy / hematoma evacuation) or EVD placement.',
      'Call for a STAT non-contrast head CT scan.'
    ];
  }
  // 2. Severe Shift (High Danger)
  else if (npi < 2.8 || diff >= 0.7 || cv < 0.5) {
    statusClass = 'status-danger';
    statusText = 'SEVERE SHIFT ALARM';
    riskPercent = 75;
    text = `<strong>High Alert:</strong> Markedly abnormal pupillary profile (NPi < 2.8 or NPi Diff >= 0.7). This is highly specific for impending clinical deterioration due to midline shift or expanding mass effect.`;
    steps = [
      'Notify the Stroke Fellow and Neurocritical Care Attending immediately.',
      'Obtain an urgent non-contrast head CT scan to check for hematoma expansion or malignant edema.',
      'Prepare the patient and consent for potential emergency hemicraniectomy (ischemic stroke) or surgical drainage (ICH).',
      'Assess sedation depth and review invasive ICP monitor readings if active.'
    ];
  }
  // 3. Early Alarm (Action Required)
  else if (npi < 3.0 || cv < 0.8 || change < 10) {
    statusClass = 'status-warning';
    statusText = 'EARLY CLINICAL ALARM';
    riskPercent = 45;
    text = `<strong>Clinical Concern:</strong> Borderline pupillary reactivity detected (NPi < 3.0, CV < 0.8 mm/s, or change < 10%). Indicates possible early CN III compression or elevated ICP (ICP >= 20 mmHg).`;
    steps = [
      'Perform a thorough clinical neurological assessment.',
      'Review pupillometry trends: a decreasing NPi trend over the last 3 readings is an early alarm, even if still above 3.0.',
      'Verify correct device placement and clean ocular area to rule out device capture errors.',
      'Consider obtaining a repeat non-contrast head CT scan if NPi has dropped from baseline.'
    ];
  }
  // 4. Normal Profile
  else {
    statusClass = 'status-normal';
    statusText = 'NORMAL PROFILE';
    riskPercent = 10;
    text = 'Pupillary parameters are within normal limits. Normal NPi (>3.0) and constriction velocity (>0.8 mm/s) suggest absence of active brainstem compression, but clinical trials (Petrosino et al. JAMA Neurol 2025) demonstrate that normal pupillometry cannot safely exclude elevated intracranial pressure (ICP) and cannot replace invasive monitoring.';
    steps = [
      'Continue baseline serial assessments every 4 hours.',
      'Ensure nursing staff are calibrated on device use.',
      'Document values in electronic medical records flowsheet.'
    ];
  }

  // Update DOM elements
  clinicalStatusBadge.textContent = statusText;
  clinicalStatusBadge.className = `status-badge ${statusClass}`;
  
  riskBar.style.width = `${riskPercent}%`;
  
  // Set risk bar color based on status
  if (statusClass === 'status-normal') {
    riskBar.style.background = 'var(--color-green)';
  } else if (statusClass === 'status-warning') {
    riskBar.style.background = 'var(--color-yellow)';
  } else if (statusClass === 'status-danger') {
    riskBar.style.background = 'var(--color-orange)';
  } else {
    riskBar.style.background = 'var(--color-red)';
  }

  interpreterText.innerHTML = text;

  // Build steps list
  actionSteps.innerHTML = '';
  steps.forEach(step => {
    const li = document.createElement('li');
    li.innerHTML = step;
    actionSteps.appendChild(li);
  });
}

// Initial setup on load
window.addEventListener('DOMContentLoaded', () => {
  const preferredView = localStorage.getItem('preferredView') || 'dashboard';
  switchView(preferredView, false);
  updateSliders();

  window.addEventListener('beforeprint', () => {
    switchView('print', false);
  });

  window.addEventListener('afterprint', () => {
    const currentPreferred = localStorage.getItem('preferredView') || 'dashboard';
    switchView(currentPreferred, false);
  });
});
