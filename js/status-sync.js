// Status Sync Logic (Simulating Backend)
const APPOINTMENT_ID = "apt_1024";

function updateAptStatus(status) {
  const data = {
    id: APPOINTMENT_ID,
    status: status, // 'pending', 'on-the-way', 'arrived', 'completed'
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem("current_appointment_status", JSON.stringify(data));

  // Trigger event for same-page listeners if any
  window.dispatchEvent(new Event("statusUpdated"));
}

function getAptStatus() {
  const saved = localStorage.getItem("current_appointment_status");
  return saved ? JSON.parse(saved) : { id: APPOINTMENT_ID, status: "pending" };
}

// Global helper for toast
function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "glass-card animate-slide";
  toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #1e293b;
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        z-index: 1000;
        font-weight: 700;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
    `;
  toast.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981; margin-right: 10px;"></i> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

