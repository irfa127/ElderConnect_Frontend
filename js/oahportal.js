let currentCommunity = null;

document.addEventListener("DOMContentLoaded", async () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.href = "login.html";
    return;
  }
  const user = JSON.parse(userStr);

  try {
    const response = await fetch(`${API_URL}/communities/manager/${user.id}`);
    const comms = await response.json();

    if (comms && comms.length > 0) {
      currentCommunity = comms[0];
      populateForm(currentCommunity);
    } else {
      updatePreview();
    }
  } catch (e) {
    console.error(e);
    alert("Error loading community details");
  }
});

function populateForm(data) {
  document.getElementById("communityId").value = data.id;
  document.getElementById("editName").value = data.name;
  document.getElementById("editLocation").value = data.location;
  document.getElementById("editDesc").value = data.description || "";
  document.getElementById("editPrice").value = data.pricing || "";
  document.getElementById("editPhone").value = data.phone || "";
  document.getElementById("editImg").value = data.image_url || "";
  document.getElementById("editLabel").value =
    data.specialty_label || "Personalized Care";

  const facilities = (data.facilities || "").split(",");
  document.querySelectorAll(".facility-check").forEach((cb) => {
    cb.checked = facilities.includes(cb.value);
  });

  updatePreview();
}

function updatePreview() {
  document.getElementById("prevName").innerText =
    document.getElementById("editName").value || "Community Name";
  document.getElementById("prevLocation").innerText =
    document.getElementById("editLocation").value || "Location";
  document.getElementById("prevDesc").innerText =
    document.getElementById("editDesc").value || "Description...";
  document.getElementById("prevPrice").innerText =
    (document.getElementById("editPrice").value || "0") + " per month";
  document.getElementById("prevBadge").innerText =
    document.getElementById("editLabel").value;
  const imgUrl = document.getElementById("editImg").value;
  if (imgUrl) document.getElementById("prevImg").src = imgUrl;
}

document.querySelector("button.btn-primary").onclick = saveChanges;

async function saveChanges() {
  const userStr = localStorage.getItem("user");
  const user = JSON.parse(userStr);

  const checkedFacilities = Array.from(
    document.querySelectorAll(".facility-check:checked"),
  )
    .map((cb) => cb.value)
    .join(",");

  const data = {
    manager_id: user.id,
    name: document.getElementById("editName").value,
    location: document.getElementById("editLocation").value,
    description: document.getElementById("editDesc").value,
    pricing: document.getElementById("editPrice").value,
    phone: document.getElementById("editPhone").value,
    image_url: document.getElementById("editImg").value,
    specialty_label: document.getElementById("editLabel").value,
    facilities: checkedFacilities,
  };

  const commId = document.getElementById("communityId").value;

  try {
    let response;
    if (commId) {
      response = await fetch(`${API_URL}/communities/${commId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      response = await fetch(`${API_URL}/communities/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }

    if (response.ok) {
      const saved = await response.json();
      currentCommunity = saved;
      document.getElementById("communityId").value = saved.id;
      showToast("Changes saved successfully!");
    } else {
      throw new Error("Failed to save");
    }
  } catch (e) {
    console.error(e);
    showToast("Error saving changes.");
  }
}
