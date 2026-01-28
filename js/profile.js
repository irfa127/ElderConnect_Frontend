let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) { window.location.href = "login.html"; return; }
  currentUser = JSON.parse(userStr);

  loadSidebar();
  await loadProfile();

  document.querySelector(".section-head .btn-primary").onclick = updateProfile;
});

function loadSidebar() {
  document.getElementById("dynamicSidebar").innerHTML = `
    <a href="index.html" class="nav-brand"><i class="fas fa-hand-holding-medical"></i> ElderConnect</a>
    <ul class="nav-menu">
      <li class="nav-item"><a href="patient-dashboard.html" class="nav-link"><i class="fas fa-home"></i> Home</a></li>
      <li class="nav-item"><a href="patient-appointments.html" class="nav-link"><i class="fas fa-calendar-check"></i> Appointments</a></li>
      <li class="nav-item"><a href="patient-senior-living.html" class="nav-link"><i class="fas fa-hotel"></i> Senior Living</a></li>
      <li class="nav-item"><a href="patient-vitals.html" class="nav-link"><i class="fas fa-chart-line"></i> Health Vitals</a></li>
      <li class="nav-item"><a href="patient-profile.html" class="nav-link active"><i class="fas fa-user-circle"></i> My Profile</a></li>
      <li class="nav-item"><a href="#" class="nav-link logout-link"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
    </ul>`;
}

async function loadProfile() {
  try {
    const res = await fetch(`${API_URL}/users/${currentUser.id}`);
    if (!res.ok) return;

    const user = await res.json();
    currentUser = user;
    localStorage.setItem("user", JSON.stringify(user));

    document.getElementById("profileName").innerText = user.full_name;
    document.getElementById("profileRole").innerText = user.role.toUpperCase();

    //name BASED AVATAR
    setAvatar(user.full_name);

    document.getElementById("inputName").value = user.full_name;
    document.getElementById("inputEmail").value = user.email;
    document.getElementById("inputPhone").value = user.phone || "";
    document.getElementById("inputAddress").value = user.address || "";
  } catch (e) {
    console.error("Error loading profile", e);
  }
}

function setAvatar(name) {
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=eff6ff&color=3b82f6&size=150`;
  document.getElementById("profileAvatar").src = url;
}

async function updateProfile() {
  const newName = document.getElementById("inputName").value;
  const newEmail = document.getElementById("inputEmail").value;
  const newPhone = document.getElementById("inputPhone").value;
  const newAddress = document.getElementById("inputAddress").value;

  try {
    const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: newName,
        email: newEmail,
        phone: newPhone,
        address: newAddress
      })
    });

    if (response.ok) {
      showToast("Profile Updated Successfully!");
      setAvatar(newName);
      await loadProfile();
    } else {
      showToast("Failed to update profile", "error");
    }
  } catch (e) {
    console.error(e);
    showToast("Connection Error", "error");
  }
}
