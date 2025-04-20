const sidebar = document.getElementById("sidebar");
const openSidebarBtn = document.getElementById("openSidebar");
const overlay = document.getElementById("overlay");
const imageInput = document.getElementById("imageInput");
const profileImage = document.getElementById("profileImage");

document.addEventListener("DOMContentLoaded", async () => {
  const usernameDisplay = document.getElementById("username-display");
  const usernameButton = document.getElementById("username-button");
  const storedUsername = localStorage.getItem("username") || "DemoUser";
  localStorage.setItem("username", storedUsername);
  usernameDisplay.textContent = storedUsername;
  usernameButton.textContent = storedUsername;

  // Load profile image from server
  try {
    const response = await fetch("https://aiserver-phi.vercel.app/getimage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "username": storedUsername,
      },
    });

    const result = await response.json();
    console.log(result);
    if (result.image) {
      profileImage.src = result.image;
    } else {
      profileImage.src = "images.jpeg";
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    profileImage.src = "images.jpeg";
  }

  // Sidebar handlers
  openSidebarBtn.addEventListener("click", function (e) {
    sidebar.classList.add("show");
    overlay.classList.add("show");
    e.stopPropagation();
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("show");
    overlay.classList.remove("show");
  });

  document.addEventListener("click", function (event) {
    if (
      sidebar.classList.contains("show") &&
      !sidebar.contains(event.target) &&
      event.target !== openSidebarBtn
    ) {
      sidebar.classList.remove("show");
      overlay.classList.remove("show");
    }
  });

  // Handle profile image upload
  imageInput.addEventListener("change", async function () {
    const file = imageInput.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert("Please upload an image smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      const base64Image = e.target.result;
      profileImage.src = base64Image;
      localStorage.setItem("profileImage", base64Image);

      try {
        const res = await fetch("https://aiserver-phi.vercel.app/addimage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: storedUsername,
            image: base64Image,
          }),
        });

        const data = await res.json();
        console.log("Image saved:", data);
      } catch (err) {
        console.error("Upload failed:", err);
      }
    };

    reader.readAsDataURL(file);
  });
});

function signOut() {
  localStorage.removeItem("username");
  localStorage.removeItem("profileImage");
  alert("Signed out!");
  window.location.href="index.html";
}

function startinterview() {
  window.location.href = "interviewstart.html";
}

function checkprogress() {
  window.location.href = "checkscore.html";
}

function checkResume() {
  window.location.href = "checkresume.html";
}
