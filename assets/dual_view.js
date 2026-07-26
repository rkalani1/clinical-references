/**
 * Dual-View Toggle and Persistent State Controller
 * Manages switching between Interactive Dashboard and 1-Page Printable Reference Sheet.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize View from LocalStorage
  const preferredView = localStorage.getItem('preferredView') || 'dashboard';
  switchView(preferredView, false);

  // 2. Setup print window listener to automatically switch to print view (best-effort)
  window.addEventListener('beforeprint', () => {
    switchView('print', false);
  });

  window.addEventListener('afterprint', () => {
    const preferredView = localStorage.getItem('preferredView') || 'dashboard';
    switchView(preferredView, false);
  });
});

/**
 * Toggle between Dashboard and Print view modes.
 * @param {string} viewName - 'dashboard' or 'print'
 * @param {boolean} [saveToStorage=true] - Whether to persist the state in localStorage
 */
function switchView(viewName, saveToStorage = true) {
  const dashboardView = document.getElementById('dashboard-view');
  const printView = document.getElementById('print-view');
  const toggleDashboardBtn = document.getElementById('toggle-dashboard');
  const togglePrintBtn = document.getElementById('toggle-print');

  if (!dashboardView || !printView) return;

  if (viewName === 'print') {
    // Show Print View
    dashboardView.classList.remove('active');
    printView.classList.add('active');
    dashboardView.setAttribute('aria-hidden', 'true');
    printView.setAttribute('aria-hidden', 'false');
    dashboardView.inert = true;
    printView.inert = false;
    
    if (toggleDashboardBtn) {
      toggleDashboardBtn.classList.remove('active');
      toggleDashboardBtn.setAttribute('aria-pressed', 'false');
    }
    if (togglePrintBtn) {
      togglePrintBtn.classList.add('active');
      togglePrintBtn.setAttribute('aria-pressed', 'true');
    }
  } else {
    // Show Dashboard View (Default)
    printView.classList.remove('active');
    dashboardView.classList.add('active');
    printView.setAttribute('aria-hidden', 'true');
    dashboardView.setAttribute('aria-hidden', 'false');
    printView.inert = true;
    dashboardView.inert = false;
    
    if (togglePrintBtn) {
      togglePrintBtn.classList.remove('active');
      togglePrintBtn.setAttribute('aria-pressed', 'false');
    }
    if (toggleDashboardBtn) {
      toggleDashboardBtn.classList.add('active');
      toggleDashboardBtn.setAttribute('aria-pressed', 'true');
    }
  }

  // Persist State
  if (saveToStorage) {
    localStorage.setItem('preferredView', viewName);
  }
}
