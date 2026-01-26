const API_URL = "http://localhost:8000";
let isRequestInProgress = false;

document.addEventListener("DOMContentLoaded", () => {
  const userDetails = localStorage.getItem("user");
  if (!userDetails) {
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(userDetails);

  if (user.role !== "patient") {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh">
        <h2>Access Denied</h2>
      </div>`;
    return;
  }

  document.getElementById("user-greeting").innerText =
    `Hello, ${user.full_name} 👋`;

  refreshDashboard(user.id);

  setInterval(() => {
    const storage = localStorage.getItem("user");
    if (!storage) {
      window.location.href = "login.html";
      return;
    }

    const storageDetails = JSON.parse(storage);
    if (storageDetails.id !== user.id) {
      window.location.reload();
      return;
    }

    refreshDashboard(user.id);
  }, 5000);
});

async function refreshDashboard(userId) {
  if (isRequestInProgress) return;
  isRequestInProgress = true;

  try {
    const aptResponse = await fetch(
      `${API_URL}/appointments/patient/${userId}?t=${Date.now()}`,
    );
    if (!aptResponse.ok) return;

    const appointments = await aptResponse.json();

    const activeStatuses = ["pending", "confirmed", "on-the-way", "arrived"];

    const activeApts = appointments.filter((a) =>
      activeStatuses.includes(a.status),
    );

    activeApts.sort((a, b) => {
      const priority = {
        arrived: 4,
        "on-the-way": 3,
        confirmed: 2,
        pending: 1,
      };

      if (priority[b.status] !== priority[a.status]) {
        return priority[b.status] - priority[a.status];
      }
      return b.id - a.id;
    });

    const activeApt = activeApts.length ? activeApts[0] : null;

    const warningEl = document.getElementById("nurseBusyWarning");
    if (warningEl) warningEl.style.display = "none";

    if (
      activeApt &&
      (activeApt.status === "pending" || activeApt.status === "confirmed")
    ) {
      const nurseRes = await fetch(
        `${API_URL}/appointments/nurse/${activeApt.nurse_id}`,
      );

      if (nurseRes.ok) {
        const nurseAppts = await nurseRes.json();

        const isBusy = nurseAppts.some((apt) => {
          if (apt.id === activeApt.id) return false;

          const active = ["ON_THE_WAY", "ARRIVED"].includes(
            apt.status.toUpperCase(),
          );
          if (!active) return false;

          return (
            new Date(apt.appointment_date).toDateString() ===
              new Date(activeApt.appointment_date).toDateString() &&
            apt.appointment_time === activeApt.appointment_time
          );
        });

        if (isBusy && warningEl) warningEl.style.display = "block";
      }
    }

    if (!activeApt) {
      document.querySelector(".page-title + p").innerText =
        "You have no active appointments right now.";
    }

    const vitalsResponse = await fetch(`${API_URL}/vitals/patient/${userId}`);
    if (vitalsResponse.ok) {
      const vitals = await vitalsResponse.json();
      if (vitals.length > 0) {
        const latest = vitals[0];

        document.getElementById("dash-bp").innerText =
          latest.blood_pressure || "--";
        document.getElementById("dash-hr").innerHTML =
          `${latest.heart_rate || "--"} <small>BPM</small>`;
        document.getElementById("dash-sugar").innerHTML =
          `${latest.sugar_level || "--"} <small>mg/dL</small>`;

        document.getElementById("reportsList").innerHTML = `
          <li style="display:flex;gap:12px">
            <i class="fas fa-file-medical-alt"></i>
            <div>
              <p><strong>Health Summary</strong></p>
              <p>Latest reading recorded</p>
            </div>
          </li>`;
      }
    }

    const inqResponse = await fetch(`${API_URL}/inquiries/patient/${userId}`);
    if (inqResponse.ok) {
      const inquiries = await inqResponse.json();
      const acceptedInq = inquiries.find((i) => i.status === "accepted");

      if (acceptedInq && !document.getElementById("oahNoticeContainer")) {
        const comm = acceptedInq.community || {};
        const section = document.createElement("div");
        section.id = "oahNoticeContainer";
        section.innerHTML = `
          <div class="glass-card">
            <h3>✅ Old Age Home Accepted</h3>
            <p><strong>${comm.name || "Community"}</strong></p>
            <p>${comm.phone || ""}</p>
          </div>`;

        document.getElementById("liveTrackingContainer").after(section);
      }
    }
  } catch (err) {
    console.error("Dashboard error:", err);
  } finally {
    isRequestInProgress = false;
  }
}

// Ui progresbar

function updateTime(status) {
  const map = {
    pending: 0,
    confirmed: 10,
    "on-the-way": 40,
    arrived: 75,
    completed: 100,
  };
  const percent = map[status] || 0;

  // Update Progress Bar
  const bar = document.getElementById("progress-bar");
  if (bar) bar.style.width = percent + "%";
  // Reset Icons
  ["icon-way", "icon-arrived", "icon-completed"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active", "completed");
  });
  // Update Text & Icons
  const statusText = document.getElementById("status-text");
  const etaText = document.getElementById("txt-eta");

  if (status === "on-the-way") {
    document.getElementById("icon-way").classList.add("active");
    statusText.innerText = "Nurse is on the way";
    etaText.innerText = "ETA: 10 Mins";
  } else if (status === "arrived") {
    document.getElementById("icon-way").classList.add("completed");
    document.getElementById("icon-arrived").classList.add("active");
    statusText.innerText = "Nurse has arrived!";
    etaText.innerText = "Arrived";
  } else if (status === "completed") {
    document.getElementById("icon-way").classList.add("completed");
    document.getElementById("icon-arrived").classList.add("completed");
    document.getElementById("icon-completed").classList.add("completed");
    statusText.innerText = "Visit Completed";
    etaText.innerText = "Completed";
  } else if (status === "confirmed") {
    statusText.innerText = "Appointment Confirmed";
    etaText.innerText = "Scheduled";
  } else {
    statusText.innerText = "Waiting for confirmation...";
    etaText.innerText = "Pending";
  }
}
