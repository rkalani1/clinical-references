// EVD & Elevated ICP Guide - Script Logic

// ==========================================================================
// 1. Simulation State Variables
// ==========================================================================
let state = {
  trueMeanICP: 12,        // mmHg (physiological ICP inside ventricles)
  brainCompliance: 2,     // 2: High (normal), 1: Moderate, 0: Low (stiff)
  map: 90,                // mmHg (Mean Arterial Pressure)
  evdHeight: 10,          // cmH2O (height of drip chamber threshold)
  transducerOffset: 0,    // cm (positive: transducer is lower than tragus; negative: higher)
  stopcockPosition: 0,    // 0: Open to all, 1: Closed to patient, 2: Closed to drip chamber
  isKinked: false,
  hasAirBubble: false,
  isClotted: false,
  currentCase: 'normal',
  activeView: 'dashboard'
};

// Canvas animation handle
let animFrameId = null;
let wavePhase = 0;

// ==========================================================================
// 2. Initialization & View Swapping
// ==========================================================================
window.onload = function() {
  initWaveformCanvas();
  loadCase('normal');
  animateCSFDrop();
};

function switchView(viewName) {
  state.activeView = viewName;
  document.getElementById('toggle-dashboard').classList.toggle('active', viewName === 'dashboard');
  document.getElementById('toggle-print').classList.toggle('active', viewName === 'print');
  
  document.getElementById('dashboard-view').classList.toggle('active', viewName === 'dashboard');
  document.getElementById('print-view').classList.toggle('active', viewName === 'print');
  
  if (viewName === 'dashboard') {
    // Redraw canvas if dashboard is active
    initWaveformCanvas();
  }
}

// ==========================================================================
// 3. EVD Physics & Calculation Engine
// ==========================================================================
function getMeasuredICP() {
  // If stopcock is closed to patient, measured ICP is 0 (or flat)
  if (state.stopcockPosition === 1) return 0;
  
  // If system is kinked or clotted, wave is dampened, measured pressure decays towards 0
  if (state.isKinked || state.isClotted) return 2;
  
  // Hydrostatic pressure offset: 1 cmH2O = 0.74 mmHg
  // If transducer is lower than tragus (offset > 0), pressure reads falsely high.
  let measured = state.trueMeanICP + (state.transducerOffset * 0.74);
  
  // If air bubble is present, waveform is dampened but mean pressure is slightly elevated due to resonance
  if (state.hasAirBubble) {
    measured += 1.5;
  }
  
  return Math.round(measured * 10) / 10;
}

function getCPP() {
  let icp = getMeasuredICP();
  // CPP = MAP - ICP (use true ICP for true perfusion, but clinical CPP is MAP - measured ICP)
  let cpp = state.map - icp;
  return Math.round(cpp);
}

function updateUI() {
  let measuredICP = getMeasuredICP();
  let cpp = getCPP();
  
  // Update Numeric Stats
  let icpValElem = document.getElementById('val-mean-icp');
  icpValElem.textContent = measuredICP;
  document.getElementById('val-cpp').textContent = cpp;
  document.getElementById('val-map').textContent = state.map;
  
  // ICP Alert Styling
  icpValElem.classList.remove('alert', 'warning');
  let complianceBadge = document.getElementById('compliance-badge');
  complianceBadge.className = 'badge-status';
  
  if (measuredICP >= 22) {
    icpValElem.classList.add('alert');
    complianceBadge.textContent = 'CRITICAL ICP ELEVATION';
    complianceBadge.className = 'badge-status danger';
  } else if (measuredICP >= 16 || state.brainCompliance === 0) {
    icpValElem.classList.add('warning');
    complianceBadge.textContent = 'COMPROMISED COMPLIANCE';
    complianceBadge.className = 'badge-status warning';
  } else {
    complianceBadge.textContent = 'NORMAL COMPLIANCE';
    complianceBadge.className = 'badge-status safe';
  }
  
  // Highlight Tiers
  updateEscalationTiers(measuredICP);
  
  // Update Leveling Status in UI & SVG
  updateLevelingGraphics();
  
  // Update EVD Heights
  document.getElementById('val-evd-height').textContent = state.evdHeight;
  let bracketY = 155 - (state.evdHeight * 4.5); // Convert height cm to SVG Y offset
  let bracket = document.getElementById('evd-bracket');
  if (bracket) {
    bracket.setAttribute('transform', `translate(0, ${bracketY - 120})`);
  }
}

// ==========================================================================
// 4. SVG & Leveling Renderers
// ==========================================================================
function updateLevelingGraphics() {
  let laser = document.getElementById('leveling-laser');
  let text = document.getElementById('leveling-text');
  let dot = document.getElementById('leveling-dot');
  
  // In the SVG, the tragus is at y=155.
  // The transducer is at y=190.
  // We offset the y of the transducer group based on offset:
  let transducerY = 196 + (state.transducerOffset * 3);
  let stopcockGroup = document.getElementById('stopcock-group');
  let transducer = document.getElementById('evd-transducer');
  let patientLine = document.getElementById('patient-line');
  
  if (stopcockGroup && transducer) {
    stopcockGroup.setAttribute('transform', `translate(201, ${transducerY})`);
    transducer.setAttribute('y', transducerY - 6);
  }
  
  // Update patient line path
  if (patientLine) {
    patientLine.setAttribute('d', `M 150 155 Q 165 ${transducerY - 10}, 200 ${transducerY}`);
  }
  
  // Adjust laser line
  if (laser) {
    laser.setAttribute('y2', transducerY);
  }
  
  // Update text description
  dot.className = 'status-indicator-dot';
  if (state.transducerOffset === 0) {
    text.textContent = 'Aligned to tragus (0.0 cm offset)';
    dot.classList.add('aligned');
  } else if (state.transducerOffset > 0) {
    text.textContent = `Too Low: Transducer is ${state.transducerOffset} cm below tragus (adds +${(state.transducerOffset*0.74).toFixed(1)} mmHg ICP error)`;
    dot.classList.add('misaligned');
  } else {
    text.textContent = `Too High: Transducer is ${Math.abs(state.transducerOffset)} cm above tragus (subtracts ${(Math.abs(state.transducerOffset)*0.74).toFixed(1)} mmHg ICP error)`;
    dot.classList.add('misaligned');
  }
}

function rotateStopcock() {
  state.stopcockPosition = (state.stopcockPosition + 1) % 3;
  let pointer1 = document.getElementById('stopcock-pointer-1');
  let pointer2 = document.getElementById('stopcock-pointer-2');
  let pointer3 = document.getElementById('stopcock-pointer-3');
  let text = document.getElementById('stopcock-status-text');
  
  if (state.stopcockPosition === 0) {
    // 0: Open to all (Handles pointing Up, Right, Left)
    pointer1.setAttribute('x2', '0'); pointer1.setAttribute('y2', '-9');
    pointer2.setAttribute('x2', '9'); pointer2.setAttribute('y2', '0');
    pointer3.setAttribute('x2', '-9'); pointer3.setAttribute('y2', '0');
    text.textContent = 'OPEN (Drain & Monitor)';
    text.style.color = '#10b981';
  } else if (state.stopcockPosition === 1) {
    // 1: Closed to Patient (Handles pointing Down, Right, Left)
    pointer1.setAttribute('x2', '0'); pointer1.setAttribute('y2', '9');
    pointer2.setAttribute('x2', '9'); pointer2.setAttribute('y2', '0');
    pointer3.setAttribute('x2', '-9'); pointer3.setAttribute('y2', '0');
    text.textContent = 'CLOSED TO PATIENT (Off)';
    text.style.color = '#ef4444';
  } else {
    // 2: Closed to Drip Chamber (Handles pointing Up, Down, Left)
    pointer1.setAttribute('x2', '0'); pointer1.setAttribute('y2', '-9');
    pointer2.setAttribute('x2', '0'); pointer2.setAttribute('y2', '9');
    pointer3.setAttribute('x2', '-9'); pointer3.setAttribute('y2', '0');
    text.textContent = 'CLOSED TO DRIP (ICP Monitor Only)';
    text.style.color = '#3b82f6';
  }
  
  updateUI();
}

function changeEVDHeight(val) {
  state.evdHeight = parseInt(val);
  updateUI();
}

function adjustTransducerLevel(amount) {
  state.transducerOffset += amount;
  state.transducerOffset = Math.max(-15, Math.min(15, state.transducerOffset));
  updateUI();
}

function relevelTransducer() {
  state.transducerOffset = 0;
  updateUI();
  
  if (state.currentCase === 'overdrain' && state.evdHeight >= 10 && state.stopcockPosition === 0) {
    resolveCase();
  }
}

// ==========================================================================
// 5. Waveform Canvas Renderer (ICP Waves: P1, P2, P3)
// ==========================================================================
function initWaveformCanvas() {
  const canvas = document.getElementById('waveform-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Set resolution
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
  }
  
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid Lines
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Generate wave path
    ctx.beginPath();
    ctx.strokeStyle = state.isKinked || state.isClotted || state.stopcockPosition === 1 ? '#4b5563' : 
                      state.trueMeanICP >= 22 ? '#ef4444' : 
                      state.trueMeanICP >= 16 || state.brainCompliance === 0 ? '#f59e0b' : '#10b981';
    ctx.lineWidth = 2.5;
    
    let points = [];
    let speed = 0.05;
    wavePhase += speed;
    
    for (let x = 0; x < canvas.width; x++) {
      let t = (x / canvas.width) * 4 * Math.PI - wavePhase;
      let y = canvas.height / 2;
      
      if (state.stopcockPosition === 1 || state.isKinked || state.isClotted) {
        // Flatline
        y = canvas.height * 0.75 + Math.sin(t * 10) * 0.5; // noise
      } else {
        // ICP Pulse wave synthesis
        let cycle = t % (2 * Math.PI);
        if (cycle < 0) cycle += 2 * Math.PI;
        
        let p1Val = 0, p2Val = 0, p3Val = 0;
        
        if (state.brainCompliance === 2) { // Normal: P1 > P2 > P3
          p1Val = 18 * Math.exp(-Math.pow(cycle - 0.6, 2) / 0.08);
          p2Val = 11 * Math.exp(-Math.pow(cycle - 1.2, 2) / 0.15);
          p3Val = 6 * Math.exp(-Math.pow(cycle - 1.9, 2) / 0.2);
        } else if (state.brainCompliance === 1) { // Moderate: P2 = P1
          p1Val = 14 * Math.exp(-Math.pow(cycle - 0.6, 2) / 0.08);
          p2Val = 14 * Math.exp(-Math.pow(cycle - 1.2, 2) / 0.15);
          p3Val = 7 * Math.exp(-Math.pow(cycle - 1.9, 2) / 0.2);
        } else { // Low compliance (Stiff): P2 > P1
          p1Val = 10 * Math.exp(-Math.pow(cycle - 0.6, 2) / 0.08);
          p2Val = 22 * Math.exp(-Math.pow(cycle - 1.2, 2) / 0.15);
          p3Val = 5 * Math.exp(-Math.pow(cycle - 1.9, 2) / 0.2);
        }
        
        let respSwing = 4 * Math.sin(t / 4);
        let baseline = canvas.height * 0.8 - (state.trueMeanICP * 1.8);
        y = baseline - (p1Val + p2Val + p3Val) + respSwing;
        
        if (state.hasAirBubble) {
          y = baseline - (p1Val + p2Val + p3Val) * 0.15 + respSwing * 0.4;
        }
      }
      
      y = Math.max(10, Math.min(canvas.height - 10, y));
      points.push({x: x, y: y});
    }
    
    // Draw line
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    
    // Position labels
    positionWaveformLabels(points);
    
    animFrameId = requestAnimationFrame(draw);
  }
  
  draw();
}

function positionWaveformLabels(points) {
  let p1Label = document.getElementById('p1-marker');
  let p2Label = document.getElementById('p2-marker');
  let p3Label = document.getElementById('p3-marker');
  
  if (!p1Label) return;
  
  if (state.stopcockPosition === 1 || state.isKinked || state.isClotted) {
    p1Label.style.display = 'none';
    p2Label.style.display = 'none';
    p3Label.style.display = 'none';
    return;
  }
  
  p1Label.style.display = 'block';
  p2Label.style.display = 'block';
  p3Label.style.display = 'block';
  
  let ratio = points.length / (4 * Math.PI);
  let p1Index = Math.round(0.6 * ratio);
  let p2Index = Math.round(1.2 * ratio);
  let p3Index = Math.round(1.9 * ratio);
  
  if (points[p1Index]) {
    p1Label.style.left = `${points[p1Index].x}px`;
    p1Label.style.top = `${points[p1Index].y - 20}px`;
  }
  if (points[p2Index]) {
    p2Label.style.left = `${points[p2Index].x}px`;
    p2Label.style.top = `${points[p2Index].y - 20}px`;
  }
  if (points[p3Index]) {
    p3Label.style.left = `${points[p3Index].x}px`;
    p3Label.style.top = `${points[p3Index].y - 20}px`;
  }
  
  if (state.brainCompliance === 0) {
    p2Label.style.borderColor = 'var(--color-danger)';
    p2Label.style.color = 'var(--color-danger)';
  } else {
    p2Label.style.borderColor = 'var(--color-safe)';
    p2Label.style.color = 'var(--color-safe)';
  }
}

// ==========================================================================
// 6. CSF Drop Animation (Drainage flow indicator)
// ==========================================================================
function animateCSFDrop() {
  let drop = document.getElementById('csf-drop');
  if (!drop) return;
  
  let y = 80;
  let interval = 3000;
  
  function triggerDrop() {
    let drivingPressure = state.trueMeanICP - (state.evdHeight + state.transducerOffset) * 0.74;
    
    if (state.stopcockPosition === 0 && !state.isKinked && !state.isClotted && drivingPressure > 0) {
      interval = Math.max(400, Math.min(3000, 3000 - (drivingPressure * 100)));
      drop.setAttribute('opacity', '1');
      y = 80;
      
      function animate() {
        y += 4;
        drop.setAttribute('cy', y);
        if (y < 190) {
          requestAnimationFrame(animate);
        } else {
          drop.setAttribute('opacity', '0');
        }
      }
      animate();
    } else {
      drop.setAttribute('opacity', '0');
      interval = 2000;
    }
    setTimeout(triggerDrop, interval);
  }
  
  triggerDrop();
}

// ==========================================================================
// 7. Case Scenario Loaders & Resolvers
// ==========================================================================
function changeCompliance(val) {
  state.brainCompliance = parseInt(val);
  updateUI();
}

function changeMAP(val) {
  state.map = parseInt(val);
  updateUI();
}

function loadCase(caseName) {
  state.currentCase = caseName;
  
  document.querySelectorAll('.btn-scenario').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`case-${caseName}`).classList.add('active');
  
  state.isKinked = false;
  state.hasAirBubble = false;
  state.isClotted = false;
  
  let title = document.getElementById('trouble-title');
  let text = document.getElementById('trouble-text');
  let actions = document.getElementById('trouble-actions');
  let statusBox = document.getElementById('trouble-status-box');
  let resolvesContainer = document.getElementById('scenario-resolves');
  
  resolvesContainer.innerHTML = '';
  statusBox.className = 'status-summary-box';
  
  if (caseName === 'normal') {
    state.trueMeanICP = 12;
    state.brainCompliance = 2;
    state.evdHeight = 10;
    state.transducerOffset = 0;
    state.stopcockPosition = 0;
    
    statusBox.classList.add('safe');
    title.textContent = 'Normal Baseline';
    text.textContent = 'Waveform exhibits normal compliance (P1 > P2 > P3). CSF is draining at a steady, physiological rate. Transducer is leveled to the tragus.';
    
    actions.innerHTML = `
      <li class="checked">Verify EVD leveling (aligned to tragus).</li>
      <li class="checked">Examine stopcock configuration.</li>
      <li>Perform hourly visual checks on CSF drainage (color, amount).</li>
    `;
    
  } else if (caseName === 'kinked') {
    state.trueMeanICP = 16;
    state.brainCompliance = 2;
    state.evdHeight = 10;
    state.transducerOffset = 0;
    state.stopcockPosition = 0;
    state.isKinked = true;
    
    statusBox.classList.add('danger');
    title.textContent = 'Mechanical Block: Kinked Line';
    text.textContent = 'ICP waveform has flatlined (mean reading ~2 mmHg). Fluid column in patient line has stopped fluctuating. Brain compliance cannot be read.';
    
    actions.innerHTML = `
      <li>Inspect the patient line and patient neck position for twists or compression.</li>
      <li>Straighten the patient line tubing.</li>
      <li>Verify stopcock is open to the patient.</li>
    `;
    
    resolvesContainer.innerHTML = `
      <button class="btn-resolve" onclick="straightenTubing()">Straighten Tubing / Un-kink Line</button>
    `;
    
  } else if (caseName === 'air') {
    state.trueMeanICP = 15;
    state.brainCompliance = 2;
    state.evdHeight = 10;
    state.transducerOffset = 0;
    state.stopcockPosition = 0;
    state.hasAirBubble = true;
    
    statusBox.classList.add('warning');
    title.textContent = 'Dampened Waveform: Air Bubble';
    text.textContent = 'ICP monitor shows a dampened waveform with poor peak definition (P1, P2, P3 merged). Fluid column is fluctuating minimally.';
    
    actions.innerHTML = `
      <li>Check the transducer stopcock for tiny air bubbles.</li>
      <li>Prepare sterile distal flush equipment.</li>
      <li>Flush the line <strong>distally</strong> (away from the patient) to clear the bubble.</li>
    `;
    
    resolvesContainer.innerHTML = `
      <button class="btn-resolve" onclick="flushDistalBubble()">Flush Line Distally</button>
    `;
    
  } else if (caseName === 'overdrain') {
    state.trueMeanICP = 12;
    state.brainCompliance = 2;
    state.evdHeight = 2;
    state.transducerOffset = 10;
    state.stopcockPosition = 0;
    
    statusBox.classList.add('danger');
    title.textContent = 'Over-drainage Alert (Severe Headache)';
    text.textContent = 'Drip chamber height is set too low (2 cmH2O). The bed was raised without re-leveling the EVD, dropping the manifold 10 cm below the tragus. The patient complains of a severe, posture-induced headache.';
    
    actions.innerHTML = `
      <li>Clamp the EVD immediately to stop the flow of CSF.</li>
      <li>Re-level the transducer/drip chamber manifold to the tragus.</li>
      <li>Adjust the EVD height back to the ordered level (10 cmH2O).</li>
      <li>Unclamp EVD and monitor output.</li>
    `;
    
    resolvesContainer.innerHTML = `
      <button class="btn-action" onclick="clampEVD()">1. Clamp EVD</button>
      <button class="btn-resolve" id="btn-resolve-overdrain" onclick="resolveOverdrainage()" style="display:none;">2. Re-level &amp; Set Height to 10</button>
    `;
    
  } else if (caseName === 'stiff') {
    state.trueMeanICP = 24;
    state.brainCompliance = 0;
    state.evdHeight = 10;
    state.transducerOffset = 0;
    state.stopcockPosition = 2; // Closed to drip chamber (ICP monitor only)
    
    statusBox.classList.add('danger');
    title.textContent = 'Refractory ICP Crisis (ICP = 24 mmHg)';
    text.textContent = 'Intracranial compliance is lost (P2 > P1). ICP is elevated. CSF flow is closed to the drip chamber.';
    
    actions.innerHTML = `
      <li>Notify the Fellow/Attending immediately.</li>
      <li>Drain CSF by opening the EVD (change stopcock to OPEN).</li>
      <li>Prepare and administer hyperosmolar therapy (3% HTS or Mannitol).</li>
      <li>Obtain STAT non-contrast head CT scan.</li>
    `;
    
    resolvesContainer.innerHTML = `
      <button class="btn-resolve" onclick="drainCSF()">Open EVD (Drain CSF)</button>
      <button class="btn-resolve" onclick="giveOsmotherapy()" style="background:var(--color-purple-gradient);">Administer 3% HTS Bolus</button>
    `;
  }
  
  document.getElementById('slider-brain-compliance').value = state.brainCompliance;
  document.getElementById('slider-evd-height').value = state.evdHeight;
  
  updateUI();
}

// Resolution actions
function straightenTubing() {
  state.isKinked = false;
  resolveCase();
}

function flushDistalBubble() {
  state.hasAirBubble = false;
  resolveCase();
}

function clampEVD() {
  state.stopcockPosition = 1; // closed to patient
  updateUI();
  document.getElementById('btn-resolve-overdrain').style.display = 'block';
}

function resolveOverdrainage() {
  state.transducerOffset = 0;
  state.evdHeight = 10;
  state.stopcockPosition = 0;
  resolveCase();
}

function drainCSF() {
  state.stopcockPosition = 0; // open EVD
  state.trueMeanICP = 18;     // drainage lowers ICP slightly
  updateUI();
  checkStiffResolution();
}

function giveOsmotherapy() {
  state.trueMeanICP = 13;
  state.brainCompliance = 2;
  document.getElementById('slider-brain-compliance').value = 2;
  updateUI();
  checkStiffResolution();
}

function checkStiffResolution() {
  if (state.trueMeanICP < 15 && state.brainCompliance === 2 && state.stopcockPosition === 0) {
    resolveCase();
  }
}

function resolveCase() {
  state.currentCase = 'normal';
  loadCase('normal');
  
  let text = document.getElementById('trouble-text');
  text.innerHTML = '<span style="color:#10b981; font-weight:700;">✓ Scenario Resolved Successfully!</span> All parameters are back to baseline.';
}

// ==========================================================================
// 8. Tiers & Escalation Pathway Highlighter
// ==========================================================================
function updateEscalationTiers(icp) {
  document.querySelectorAll('.tier-node').forEach(node => node.classList.remove('active'));
  
  let activeTier = 0;
  if (state.trueMeanICP >= 24) {
    activeTier = 3;
  } else if (state.trueMeanICP >= 22) {
    activeTier = 2;
  } else if (state.trueMeanICP >= 16) {
    activeTier = 1;
  } else {
    activeTier = 0;
  }
  
  document.getElementById(`tier-${activeTier}-node`).classList.add('active');
}
