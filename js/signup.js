const API_URL = "http://localhost:8000";


document.querySelectorAll(".role-option").forEach((m) => {
  m.addEventListener("click", () => {
    document
      .querySelectorAll(".role-option")
      .forEach((n) => n.classList.remove("active"));
    m.classList.add("active");
    document.getElementById("role").value = m.dataset.role;
  });
});


const form = document.getElementById("signupForm");
form.addEventListener("submit", async (a) => {
  a.preventDefault();

  const errorDiv = document.getElementById("errorMessage");
  const successDiv = document.getElementById("successMessage");
  errorDiv.style.display = "none";
  successDiv.style.display = "none";

  const userData = {
    email: document.getElementById("email").value,
    username: document.getElementById("username").value,
    full_name: document.getElementById("fullName").value,
    password: document.getElementById("password").value,
    role: document.getElementById("role").value,
    phone: document.getElementById("phone").value || null,
    address: document.getElementById("address").value || null,
  };

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      successDiv.textContent = "Account created successfully! Redirecting...";
      successDiv.style.display = "block";

      setTimeout(() => {
        const role = data.user.role;

        if (role === "patient") {
          window.location.href = "patient-dashboard.html";
        } else if (role === "nurse") {
          window.location.href = "nurse-dashboard.html";
        } else if (role === "oah_manager") {
          window.location.href = "oah-dashboard.html";
        }
      }, 1500);
    } else {
      errorDiv.textContent = data.details || "Signup failed. Please try again.";
      errorDiv.style.display = "block";
    }
  } catch (error) {
    errorDiv.textContent =
      "Connection error. Please make sure the backend is running.";
    errorDiv.style.display = "block";
    console.error("Error:", error);
  }
});
