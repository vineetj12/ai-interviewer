let profile;

document.getElementById("profile").addEventListener("change", function () {
    profile = this.value;
    localStorage.setItem("selectedProfile", profile);
});

document.getElementById('imageInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImage = document.getElementById('previewImage');
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            localStorage.setItem("imageDataURL", e.target.result); // Save image as base64
        };
        reader.readAsDataURL(file);
    }
});

function convertImageToText() {
    const imageDataURL = localStorage.getItem("imageDataURL");
    const profile = localStorage.getItem("selectedProfile");

    if (!imageDataURL) {
        alert("Please select an image first.");
        return;
    }

    if (!profile) {
        alert("Please select a profile.");
        return;
    }

    window.location.href = "./a.html"; // Redirect to loader
}

function home() {
    window.location.href = "./aifrontend.html";
}
