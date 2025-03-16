document.addEventListener("DOMContentLoaded", async function () {
    const username = localStorage.getItem("username");
    const numberDisplay = document.getElementById("numberDisplay");
    const suggestionText = document.getElementById("suggestionText");

    if (!username) {
        numberDisplay.textContent = "No username found!";
        suggestionText.textContent = "Please log in.";
        return;
    }

    try {
        const response = await fetch("https://aiserver-nu.vercel.app/score", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "username": username,
            },
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();

        // Display score
        numberDisplay.textContent = data.overall_score || "N/A";

        // Display suggestions
        suggestionText.textContent = data.suggestions || "No suggestions available.";
        
    } catch (error) {
        console.error("Fetch error:", error);
        numberDisplay.textContent = "Error fetching score!";
        suggestionText.textContent = "Check console for details.";
    }
});

// Function to navigate to home
async function home() {
    try {
        alert("This interview will not be saved");
        const response = await fetch("https://aiserver-nu.vercel.app/home", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "username": username
            }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        data.message ? (window.location.href = "aifrontend.html") : alert("Something went wrong");
    } catch (error) {
        console.error("Error in home function:", error);
        alert("Failed to navigate. Check console for details.");
    }
}