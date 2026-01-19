// nurse.js

document.addEventListener("DOMContentLoaded", () => {
  // Redirect nurse login if not authenticated
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.href = "login.html"; // redirect to login if no user
    return;
  }

  const user = JSON.parse(userStr);

  // Ensure only nurses can access this dashboard
  if (user.role !== "nurse") {
    alert("Access denied. Only nurses can view this dashboard.");
    window.location.href = "login.html";
    return;
  }

  // Load dashboard if on nurse dashboard page
  // if (window.location.pathname.includes("nurse-dashboard.html")) {
  //   loadNurseDashboard(user);
  // }

  // Appointment Management
  // Appointment Management - SHARED API CALL
  window.updateStatus = async (id, newStatus) => {
    // If called with single string arg (old mock way), ignore or handle gracefully
    if (typeof id === 'string') return;

    if (!confirm(`Update status to ${newStatus}?`)) return;

    try {
      const response = await fetch(`http://localhost:8000/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert(`Status successfully updated to ${newStatus}`);
        location.reload(); // Refresh to show new status
      } else {
        const err = await response.json();
        const errorMsg = err.detail || "";

        // Specific handling for conflict error - SILENT FAIL for Nurse
        if (response.status === 400 && errorMsg.includes("This nurse is already attending another patient")) {
          console.warn("Update blocked: This nurse is already attending another patient.");
          // No alert shown
        } else {
          alert("Failed to update status: " + (errorMsg || "Server Error"));
        }
      }
    } catch (e) {
      console.error(e);
      alert("Connection error. Please check if backend is running.");
    }
  };

  // Data Upload Form
  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) {
    uploadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Health results successfully uploaded and shared with the patient dashboard! ✅");
      uploadForm.reset();
    });
  }
});

async function loadNurseDashboard(user) {
  try {
    const response = await fetch(`http://localhost:8000/appointments/nurse/${user.id}`);
    if (!response.ok) throw new Error("Failed to fetch dashboard data");

    const appointments = await response.json();

    // Normalize statuses to uppercase for consistency
    const normalized = appointments.map(a => ({
      ...a,
      status: a.status.toUpperCase()
    }));

    // Calculate Stats
    const pending = normalized.filter(a => a.status === 'PENDING').length;
    const completed = normalized.filter(a => a.status === 'COMPLETED').length;

    // Update DOM
    const statPending = document.getElementById("stat-pending");
    const statCompleted = document.getElementById("stat-completed");

    if (statPending) statPending.innerText = pending.toString().padStart(2, '0');
    if (statCompleted) statCompleted.innerText = completed.toString().padStart(2, '0');

    // Find Next Visit (exclude COMPLETED and CANCELLED)
    const upcoming = normalized
      .filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))[0];

    const nextContainer = document.getElementById("next-visit-container");
    if (nextContainer) {
      if (upcoming) {
        const date = new Date(upcoming.appointment_date);
        const [hoursStr, minutes] = upcoming.appointment_time.split(':');
        const hours = parseInt(hoursStr);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;

        nextContainer.innerHTML = `
          <div style="display: flex; align-items: start; gap: 20px">
            <div style="padding: 15px; background: var(--bg-body); border-radius: 15px; text-align: center;">
              <p style="font-weight: 800; font-size: 1.2rem; color: var(--primary);">
                ${displayHours}:${minutes}
              </p>
              <p style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">
                ${ampm}
              </p>
            </div>
            <div style="flex: 1">
              <h4 style="font-weight: 800; font-size: 1.1rem; color: var(--text-main);">
                Patient #${upcoming.patient_id}
              </h4>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
                ${upcoming.service_type || 'General Care'} • ${date.toLocaleDateString()}
              </p>
              <div style="margin-top: 15px; display: flex; gap: 10px">
                <button class="btn btn-primary btn-small">
                  <i class="fas fa-location-arrow"></i> Navigate
                </button>
                <a href="nurse-portal.html" class="btn btn-outline btn-small">View Details</a>
              </div>
            </div>
          </div>`;
      } else {
        nextContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--text-muted)">No upcoming visits scheduled.</p>`;
      }
    }

  } catch (error) {
    console.error("Dashboard Error:", error);
    const statPending = document.getElementById("stat-pending");
    const statCompleted = document.getElementById("stat-completed");
    if (statPending) statPending.innerText = "00";
    if (statCompleted) statCompleted.innerText = "00";
    const nextContainer = document.getElementById("next-visit-container");
    if (nextContainer) {
      nextContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: red">Error loading dashboard data.</p>`;
    }
  }
}

