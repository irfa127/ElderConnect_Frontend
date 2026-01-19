document.addEventListener("DOMContentLoaded", () => {
  // 1. Appointment Booking
  const bookingForm = document.getElementById("bookingForm");
  if (bookingForm) {
    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Appointment request sent! Waiting for nurse confirmation.");
      bookingForm.reset();
    });
  }

  // 2. Real-time Tracking Simulation
  const progressBar = document.getElementById("progressBar");
  const nurseIcon = document.getElementById("nurseIcon");
  const trackStatus = document.getElementById("trackStatus");

  window.simulateArrival = () => {
    let progress = 45;
    const interval = setInterval(() => {
      progress += 1;
      progressBar.style.width = progress + "%";
      nurseIcon.style.left = progress + "%";

      if (progress >= 100) {
        clearInterval(interval);
        trackStatus.innerText = "Nurse Sarah has arrived!";
        trackStatus.style.color = "#10b981";
        nurseIcon.innerText = "🏥";

        // Trigger Task Completion Notification after 2 seconds
        setTimeout(() => {
          showCompletionNotification();
        }, 2000);
      }
    }, 50);
  };

  // 3. Task Completion Notification
  function showCompletionNotification() {
    const notify = confirm(
      "Task completed! Nurse Sarah has finished her visit. Would you like to provide feedback?"
    );
    if (notify) {
      document.getElementById("reviewModal").style.display = "flex";
    }
  }

  // 4. Review Pop-up & AI Analysis
  const reviewForm = document.getElementById("reviewForm");
  const reviewText = document.getElementById("reviewText");
  const aiAnalysis = document.getElementById("aiAnalysis");

  const keywords = {
    positive: [
      "excellent",
      "great",
      "fast",
      "friendly",
      "careful",
      "professional",
      "punctual",
    ],
    negative: ["slow", "late", "rude", "painful", "unprofessional", "messy"],
  };

  if (reviewForm) {
    reviewForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = reviewText.value.toLowerCase();

      // Simple AI Analysis Logic
      let score = 0;
      let improvements = [];

      keywords.positive.forEach((word) => {
        if (text.includes(word)) score++;
      });
      keywords.negative.forEach((word) => {
        if (text.includes(word)) {
          score--;
          improvements.push(word);
        }
      });

      aiAnalysis.style.display = "block";
      if (score >= 0 && improvements.length === 0) {
        aiAnalysis.style.background = "#d1fae5";
        aiAnalysis.style.color = "#065f46";
        aiAnalysis.innerHTML =
          "✨ <strong>AI Analysis:</strong> Feedback is positive. Service quality is high.";
      } else {
        aiAnalysis.style.background = "#fee2e2";
        aiAnalysis.style.color = "#991b1b";
        aiAnalysis.innerHTML = `⚠️ <strong>AI Analysis:</strong> Areas identified for improvement: ${improvements.join(
          ", "
        )}.`;
      }

      setTimeout(() => {
        alert("Thank you for your feedback! Review submitted.");
        document.getElementById("reviewModal").style.display = "none";
      }, 3000);
    });
  }
});

