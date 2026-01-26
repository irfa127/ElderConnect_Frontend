
 const API_URL = "http://localhost:8000";
    let currentUser = null;

    document.addEventListener("DOMContentLoaded", async () => {
      const userStr = localStorage.getItem("user");
      if (!userStr) { window.location.href = 'login.html'; return; }
      currentUser = JSON.parse(userStr);

    
      const isNurse = currentUser.role === 'nurse';

    
      const sidebar = document.getElementById("dynamicSidebar");
      sidebar.innerHTML = `
            <a href="index.html" class="nav-brand"><i class="fas fa-hand-holding-medical"></i> ElderConnect</a>
            <ul class="nav-menu">
                ${isNurse ? `
                    <li class="nav-item"><a href="nurse-dashboard.html" class="nav-link"><i class="fas fa-columns"></i> Dashboard</a></li>
                    <li class="nav-item"><a href="nurse-portal.html" class="nav-link"><i class="fas fa-calendar-check"></i> Appointment Portal</a></li>
                    <li class="nav-item"><a href="nurse-profile.html" class="nav-link active"><i class="fas fa-user-md"></i> My Profile</a></li>
                ` : `
                    <li class="nav-item"><a href="patient-dashboard.html" class="nav-link"><i class="fas fa-home"></i> Home</a></li>
                    <li class="nav-item"><a href="patient-appointments.html" class="nav-link"><i class="fas fa-calendar-check"></i> Appointments</a></li>
                    <li class="nav-item"><a href="patient-senior-living.html" class="nav-link"><i class="fas fa-hotel"></i> Senior Living</a></li>
                     <li class="nav-item"><a href="patient-vitals.html" class="nav-link"><i class="fas fa-chart-line"></i> Health Vitals</a></li>
                    <li class="nav-item"><a href="patient-profile.html" class="nav-link"><i class="fas fa-user-circle"></i> My Profile</a></li>
                `}
                <li class="nav-item"><a href="#" class="nav-link logout-link"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
            </ul>
        `;

      await loadProfile();
      document.querySelector(".section-head .btn-primary").onclick = updateProfile;

      document.querySelector(".fas.fa-camera").parentElement.onclick = () => {
        document.getElementById("avatarInput").click();
      };
    });

    async function loadProfile() {
      try {
        const res = await fetch(`${API_URL}/users/${currentUser.id}`);
        if (res.ok) {
          const user = await res.json();
          currentUser = user;
          localStorage.setItem("user", JSON.stringify(user));

          document.getElementById("profileName").innerText = user.full_name;
          document.getElementById("profileRole").innerText = user.role.toUpperCase();

          if (user.profile_picture) {
            
            let src = user.profile_picture;
            if (src.startsWith("/static")) src = API_URL + src;
            document.getElementById("profileAvatar").src = src;
          } else {
            document.getElementById("profileAvatar").src = `https://ui-avatars.com/api/?name=${user.full_name}&background=3b82f6&color=fff&size=150`;
          }

          document.getElementById("inputName").value = user.full_name;
          document.getElementById("inputEmail").value = user.email;
          document.getElementById("inputPhone").value = user.phone || "";
          document.getElementById("inputAddress").value = user.address || "";
        }
      } catch (e) {
        console.error("Error loading profile", e);
      }
    }

    async function uploadAvatar(input) {
      if (input.files && input.files[0]) {
        const formData = new FormData();
        formData.append("file", input.files[0]);

        try {
          const res = await fetch(`${API_URL}/uploads/`, {
            method: "POST",
            body: formData
          });

          if (res.ok) {
            const data = await res.json();
            let imgUrl = data.url;
           
            document.getElementById("profileAvatar").src = API_URL + imgUrl;

         
            await updateProfilePicture(imgUrl);
          } else {
            showToast("Upload failed", "error");
          }
        } catch (e) {
          console.error(e);
          showToast("Connection error", "error");
        }
      }
    }

    async function updateProfilePicture(url) {
      try {
        const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_picture: url })
        });
        if (response.ok) showToast("Avatar updated!");
      } catch (e) { console.error(e); }
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
          await loadProfile();
        } else {
          showToast("Failed to update profile", "error");
        }
      } catch (e) {
        console.error(e);
        showToast("Connection Error", "error");
      }
    }