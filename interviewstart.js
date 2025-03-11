let qno = 0;
const username = localStorage.getItem("username");

async function start() {
    try {
        console.log("Fetching question...");
        const response = await fetch("https://aiserver-five.vercel.app/interview", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "username": username
            }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        qno = data.qno;
        document.getElementById("question").innerText = `Question: ${data.question}`;
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Failed to fetch question. Check console for details.");
    }
}

async function submitAnswer() {
    const answer = document.getElementById("answer").value.trim();

    if (!answer) {
        alert("Please enter your answer.");
        return;
    }

    try {
        console.log("Submitting answer...");
        const response = await fetch("https://aiserver-five.vercel.app/addanswer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "username": username
            },
            body: JSON.stringify({ answer })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        alert("Answer submitted!");
        qno <= 4 ? start() : getScore();
    } catch (error) {
        console.error("Error submitting answer:", error);
        alert("Failed to submit answer. Check console for details.");
    }
}

function getScore() {
    window.location.href = "getscore.html";
}

async function home() {
    try {
        alert("This interview will not be saved");
        const response = await fetch("https://aiserver-five.vercel.app/home", {
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
