
document.addEventListener("DOMContentLoaded", async () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return;
  const user = JSON.parse(userStr);

  document.querySelector(".page-title").innerText =
    `Welcome, ${user.full_name}`;

  const avatarEl = document.getElementById("nurse-avatar");
  if (avatarEl) {
    avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=3b82f6&color=fff`;
  }

  try {
    const userRes = await fetch(
      `${API_URL}/users/${user.id}?t=${new Date().getTime()}`,
    );
    if (userRes.ok) {
      const userData = await userRes.json();

      const ratingEl = document.getElementById("nurse-rating-value");
      if (ratingEl) {
        const ratingVal = userData.rating ? Number(userData.rating) : 0;
        ratingEl.innerHTML = `${ratingVal.toFixed(1)} <small style="font-size: 1rem"><i class="fas fa-star"></i></small>`;

        const labelEl = ratingEl.nextElementSibling;
        if (labelEl) {
          let text = "POOR";
          let color = "var(--danger)";

          if (ratingVal >= 4.5) {
            text = "EXCELLENT";
            color = "var(--success)";
          } else if (ratingVal >= 3.5) {
            text = "GOOD";
            color = "var(--primary)";
          } else if (ratingVal >= 2.5) {
            text = "AVERAGE";
            color = "#f59e0b";
          }

          labelEl.innerText = text;
          labelEl.style.color = color;
        }
      }
    }

    const response = await fetch(`${API_URL}/appointments/nurse/${user.id}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Server Error");
    }
    const appointments = await response.json();

    const pending = appointments.filter((a) => a.status === "PENDING").length;
    const completed = appointments.filter(
      (a) => a.status === "COMPLETED",
    ).length;

    document.getElementById("stat-pending").innerText = pending;
    document.getElementById("stat-completed").innerText = completed;

    const now = new Date();
    const upcoming = appointments
      .filter((a) => ["PENDING", "ACCEPTED"].includes(a.status))
      .filter(
        (a) => new Date(a.appointment_date + "T" + a.appointment_time) > now,
      )
      .sort(
        (a, b) =>
          new Date(a.appointment_date + " " + a.appointment_time) -
          new Date(b.appointment_date + " " + b.appointment_time),
      );

    const nextVisitContainer = document.getElementById("next-visit-container");

    if (upcoming.length > 0) {
      const next = upcoming[0];
      nextVisitContainer.innerHTML = `
                   <div style="display: flex; gap: 20px; align-items: center;">
                      <div style="background: #eff6ff; padding: 15px; border-radius: 12px; text-align: center; min-width: 80px;">
                          <div style="font-weight: 800; font-size: 1.2rem; color: var(--primary);">${new Date(next.appointment_date).getDate()}</div>
                          <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">${new Date(next.appointment_date).toLocaleString("default", { month: "short" })}</div>
                      </div>
                      <div>
                          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(next.patient_name)}&background=random"
                                   style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                              <h4 style="font-weight: 700; margin: 0;">${next.patient_name}</h4>
                          </div>
                          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px;">
                              <i class="far fa-clock"></i> ${next.appointment_time} • ${next.service_type || "General Care"}
                          </p>
                          <span class="badge badge-${next.status === "confirmed" ? "success" : "warning"}">${next.status.toUpperCase()}</span>
                      </div>
                      <div style="margin-left: auto; display: flex; gap: 10px;">
                 
                          <a href="nurse-portal.html" class="btn btn-primary btn-small">View All</a>
                      </div>
                   </div>
                `;
    } else {
      nextVisitContainer.innerHTML = `<p style="text-align: center; padding: 20px;">No upcoming visits scheduled.</p>`;
    }
  } catch (e) {
    console.error(e);
    document.getElementById("next-visit-container").innerHTML =
      `<p style="color: red; text-align: center; padding: 20px;">Error: ${e.message}</p>`;
    document.getElementById("stat-pending").innerText = "Err";
    document.getElementById("stat-completed").innerText = "Err";
  }
});

setInterval(() => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    window.location.href = "login.html";
    return;
  }
  const parsed = JSON.parse(storedUser);

  if (parsed.role !== "nurse") {
    window.location.reload();
  }
}, 5000);
