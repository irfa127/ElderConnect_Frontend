let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.href = "login.html";
    return;
  }
  currentUser = JSON.parse(userStr);
  if (currentUser.role !== "nurse") {
    alert("Access Denied: Nurse area only");
    window.location.href = "index.html";
    return;
  }

  await fetchAppointments();
});

async function fetchAppointments() {
  const container = document.getElementById("appointmentsContainer");
  try {
    const response = await fetch(
      `${API_URL}/appointments/nurse/${currentUser.id}`,
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Server Error");
    }

    const appointments = await response.json();
    container.innerHTML = "";

    if (appointments.length === 0) {
      container.innerHTML =
        "<p style='text-align:center; padding: 20px;'>No pending appointments found.</p>";
      return;
    }

    appointments.forEach((apt) => {
      const date = new Date(apt.appointment_date).toLocaleDateString();
      const time = apt.appointment_time;
      const statusClass = apt.status === "COMPLETED" ? "success" : "info"; // Simplified

      const displayStatus = apt.status.replace(/-/g, " ").toUpperCase();


      const statusButtons = `
              <div class="status-timeline" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
                 <button class="btn-step ${apt.status === "ON_THE_WAY" ? "completed" : ""
        }" onclick="updateStatus(${apt.id}, 'ON_THE_WAY')">
                   <i class="fas fa-car-side"></i> On Way
                 </button>
                 <button class="btn-step ${apt.status === "ARRIVED" ? "completed" : ""
        }" onclick="updateStatus(${apt.id}, 'ARRIVED')">
                   <i class="fas fa-map-pin"></i> Arrived
                 </button>
                 <button class="btn-step ${apt.status === "COMPLETED" ? "completed" : ""
        }" onclick="openUploadModal('${apt.id}', 'Patient #${apt.patient_id
        }')">
                   <i class="fas fa-check-circle"></i> Complete
                 </button>
              </div>
            `;

      const patientImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patient_name)}&background=random`;

      const card = document.createElement("div");
      card.className = "apt-info-card animate-fade";
      card.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <div style="display: flex; gap: 15px; align-items: center;">
                  <img src="${patientImg}" 
                       onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patient_name)}&background=random'"
                       style="width: 50px; height: 50px; border-radius: 12px; object-fit: cover;">
                  <div>
                    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 5px; color: white;">
                      ${apt.patient_name}
                    </h2>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                      <span class="apt-tag">ID: #${apt.id}</span>
                      <span class="apt-tag"><i class="fas fa-stethoscope"></i> ${apt.service_type || "General Care"}</span>
                    </div>
                  </div>
                </div>
                <span class="badge badge-${statusClass}">${displayStatus}</span>
              </div>

              <div style="display: flex; gap: 30px; margin-bottom: 30px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 10px">
                  <div style="width: 40px; height: 40px; background: rgba(59, 130, 246, 0.1); color: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <i class="far fa-calendar-alt"></i>
                  </div>
                  <div>
                    <div style="font-size: 0.75rem; opacity: 0.7; color: var(--text-muted);">DATE</div>
                    <div style="font-weight: 700; color: #334155;">${date}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px">
                  <div style="width: 40px; height: 40px; background: rgba(59, 130, 246, 0.1); color: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <i class="far fa-clock"></i>
                  </div>
                  <div>
                    <div style="font-size: 0.75rem; opacity: 0.7; color: var(--text-muted);">TIME</div>
                    <div style="font-weight: 700; color: #334155;">${time}</div>
                  </div>
                </div>
              </div>

              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 15px; color: #334155;">Update Status</h3>
              ${statusButtons}

            `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = "Error loading appointments.";
  }
}

async function updateStatus(id, newStatus) {
  try {
    const response = await fetch(`${API_URL}/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (response.ok) {
      showToast(`Status updated to ${newStatus}`);
      fetchAppointments();
    } else {
      showToast("Failed to update status");
    }
  } catch (e) {
    showToast("Connection error");
  }
}

function openUploadModal(id, name) {
  document.getElementById("targetPatientName").innerText = name;
  document.getElementById("targetAppointmentId").value = id;

  const pid = name.split("#")[1] || "";
  document.getElementById("targetPatientId").value = pid;
  openModal("uploadModal");
}

async function finalizeUpload() {
  const id = document.getElementById("targetAppointmentId").value;
  const patientId = document.getElementById("targetPatientId").value;
  const notes = document.getElementById("uploadNotes").value;

  const bp = document.getElementById("vitalBP").value;
  const hr = document.getElementById("vitalHR").value;
  const sugar = document.getElementById("vitalSugar").value;
  const temp = document.getElementById("vitalTemp").value;

  try {

    if (bp || hr || sugar) {
      const vitalPayload = {
        patient_id: parseInt(patientId),
        nurse_id: currentUser.id,
        blood_pressure: bp,
        heart_rate: hr ? parseInt(hr) : null,
        sugar_level: sugar ? parseInt(sugar) : null,
        temperature: temp,
      };

      const vitalRes = await fetch(`${API_URL}/vitals/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vitalPayload),
      });

      if (!vitalRes.ok) {
        console.error("Vitals Error", await vitalRes.text());
        showToast("Warning: Vitals not saved", "warning");
      }
    }

    let reportNote = notes;


    const response = await fetch(`${API_URL}/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "COMPLETED",
        notes: reportNote,
      }),
    });

    if (response.ok) {
      showToast("Health data uploaded & Visit Complete!");
      closeModal("uploadModal");
      fetchAppointments();
    } else {
      showToast("Failed to complete appointment");
    }
  } catch (e) {
    console.error(e);
    showToast("Error processing upload", "error");
  }
}
