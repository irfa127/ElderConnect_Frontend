const API_URL = "http://localhost:8000";
      let isRequestInProgress = false; // every 5 second dashboard refresh aagum
      let currentUser = null; // Global variable to store logged-in user

      document.addEventListener("DOMContentLoaded", () => {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          window.location.href = "login.html";
          return;
        }
        currentUser = JSON.parse(userStr);

        if (currentUser.role !== "patient") {
          document.body.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#f8fafc; font-family:sans-serif;">
                <div style="background:white; padding:40px; border-radius:20px; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1); text-align:center; max-width:400px;">
                    <div style="width:60px; height:60px; background:#fee2e2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
                         <i class="fas fa-user-lock" style="color:#ef4444; font-size:24px;"></i>
                    </div>
                    <h2 style="color:#1e293b; margin-bottom:10px;">Session Changed</h2>
                    <p style="color:#64748b; line-height:1.6; margin-bottom:25px;">
                        A different user (${currentUser.role.replace("_", " ")}) is currently logged in. Please log in again to access your dashboard.
                    </p>
                    <button onclick="localStorage.clear(); window.location.href='login.html'" 
                        style="width:100%; padding:14px; background:#3b82f6; color:white; border:none; border-radius:12px; cursor:pointer; font-weight:700; font-size:1rem;">
                        Go to Login
                    </button>
                </div>
            </div>
          `;
          return;
        }

        document.getElementById("user-greeting").innerText =
          `Hello, ${currentUser.full_name} 👋`;

        refreshDashboard(currentUser.id);

        setInterval(() => {
          const storedUser = localStorage.getItem("user");
          if (!storedUser) {
            window.location.href = "login.html";
            return;
          }
          const parsed = JSON.parse(storedUser);
          if (parsed.id !== currentUser.id) {
            console.warn("Session changed, reloading...");
            window.location.reload();
            return;
          }
          refreshDashboard(currentUser.id);
        }, 5000);
      });

      async function refreshDashboard(userId) {
        if (isRequestInProgress) return;
        isRequestInProgress = true;

        try {
          console.log("Fetching appointments for patient:", userId);
          const aptResponse = await fetch(
            `${API_URL}/appointments/patient/${userId}?t=${new Date().getTime()}`, // ?t= browser cache avoid panna
          );
          if (aptResponse.ok) {
            const appointments = await aptResponse.json();

            const activeStatuses = [
              "pending",
              "confirmed",
              "on-the-way",
              "arrived",
            ];
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

            const activeApt = activeApts.length > 0 ? activeApts[0] : null;

            const warningEl = document.getElementById("nurseBusyWarning");
            if (warningEl) warningEl.style.display = "none";
            
            if (
              activeApt &&
              (activeApt.status === "pending" ||
                activeApt.status === "confirmed")
            ) {
              (async () => {
                try {
                  const nurseApptsRes = await fetch(
                    `${API_URL}/appointments/nurse/${activeApt.nurse_id}`,
                  );
                  if (nurseApptsRes.ok) {
                    const nurseAppts = await nurseApptsRes.json();

                    //some() na Oru appointment-achum match aanaa TRUE
                    const isBusy = nurseAppts.some((apt) => {
                      if (apt.id === activeApt.id) return false;

                      const isActive = ["ON_THE_WAY", "ARRIVED"].includes(
                        apt.status.toUpperCase(),
                      );
                      if (!isActive) return false;

                      const date1 = new Date(
                        apt.appointment_date,
                      ).toDateString();
                      const date2 = new Date(
                        activeApt.appointment_date,
                      ).toDateString();

                      return (
                        date1 === date2 &&
                        apt.appointment_time === activeApt.appointment_time
                      );
                    });

                    if (isBusy && warningEl) {
                      warningEl.style.display = "block";
                    }
                  }
                } catch (e) {
                  console.error("Error checking nurse availability", e);
                }
              })();
            }

            if (!activeApt) {
              document.querySelector(".page-title + p").innerText =
                "You have no active appointments right now.";
            }
          }

          // Fetch Vitals
          const vitalsResponse = await fetch(
            `${API_URL}/vitals/patient/${userId}`,
          );
          if (vitalsResponse.ok) {
            const vitals = await vitalsResponse.json();
            if (vitals.length > 0) {
              const latest = vitals[0];

              document.getElementById("dash-bp").innerText =
                latest.blood_pressure || "--";
              document.getElementById("dash-hr").innerHTML =
                `${latest.heart_rate || "--"} <small style="font-size: 1rem">BPM</small>`;
              document.getElementById("dash-sugar").innerHTML =
                `${latest.sugar_level || "--"} <small style="font-size: 1rem">mg/dL</small>`;

              document.getElementById("reportsList").innerHTML = `
                      <li style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid var(--border);">
                        <i class="fas fa-file-medical-alt" style="color: var(--primary); font-size: 1.5rem"></i>
                        <div>
                          <p style="font-weight: 700; font-size: 0.9rem">Health Summary</p>
                          <p style="font-size: 0.75rem; color: var(--text-muted)">Latest reading recorded</p>
                        </div>
                      </li>
                 `;
            }
          }

          // Fetch Inquiries (For OAH Notification)
          const inqResponse = await fetch(
            `${API_URL}/inquiries/patient/${userId}`,
          );
          if (inqResponse.ok) {
            const inquiries = await inqResponse.json();
            const acceptedInq = inquiries.find((i) => i.status === "accepted");

            if (acceptedInq) {
              const comm = acceptedInq.community || {};
              const applicantName = currentUser.full_name || "Applicant";
              const applicantEmail = currentUser.email || "";
            
              // Remove existing notice if present
              const existingNotice = document.getElementById("oahNoticeContainer");
              if (existingNotice) {
                existingNotice.remove();
              }
              
              const section = document.createElement("div");
              section.id = "oahNoticeContainer";
              section.className = "animate-slide";
              section.style.marginTop = "30px";
              section.innerHTML = `
                    <div class="glass-card" style="background: #ecfdf5; border-color: #a7f3d0; display: flex; gap: 20px; align-items: center;">
                       <img src="${comm.image_url || "https://via.placeholder.com/100"}" 
                            style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover;" />
                       <div style="flex: 1;">
                          <h3 style="color: #065f46; font-weight: 800; margin-bottom: 5px;">
                             ✅ Your Old Age Home booking was successful!
                          </h3>
                          <p style="color: #047857; font-size: 0.95rem;">
                             <strong>${comm.name || "Community"}</strong> has accepted your request. They will contact you shortly.
                          </p>
                          <p style="margin-top: 5px; color: #047857; font-size: 0.9rem;">
                             <strong>Applicant:</strong> ${applicantName}
                          </p>
                          <p style="margin-top: 3px; color: #047857; font-size: 0.9rem;">
                             <i class="fas fa-envelope"></i> ${applicantEmail}
                          </p>
                          <p style="margin-top: 3px; color: #047857; font-size: 0.9rem;">
                             <i class="fas fa-phone-alt"></i> ${comm.phone || "Contact Admin"}
                          </p>
                       </div>
                    </div>
                 `;
              
              // Try multiple insertion points
              let inserted = false;
              
              // Try inserting after liveTrackingContainer
              const tracker = document.getElementById("liveTrackingContainer");
              if (tracker && tracker.parentNode) {
                tracker.parentNode.insertBefore(section, tracker.nextSibling);
                inserted = true;
              }
              
              // If that fails, try inserting at the beginning of main content
              if (!inserted) {
                const mainContent = document.querySelector(".main-content");
                if (mainContent) {
                  mainContent.insertBefore(section, mainContent.firstChild);
                  inserted = true;
                }
              }
              
              // If still not inserted, append to body
              if (!inserted) {
                document.body.appendChild(section);
              }
            }
          }
        } catch (e) {
          console.error("Auto-refresh error:", e);
        } finally {
          isRequestInProgress = false;
        }
      }

      function updateTimeline(status) {
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
