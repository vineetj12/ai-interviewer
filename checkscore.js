document.addEventListener("DOMContentLoaded", async function () {
    const progressText = document.querySelector(".progress-text");
    const ctx = document.getElementById("progressChart").getContext("2d");
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("authToken");

    try {
        const result = await fetch("https://aiserver-five.vercel.app/checkscore", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "username": username,
                "jwttoken": token
            }
        });

        const data = await result.json();

        if (!data.validUser) {
            alert("Not a valid user");
            window.location.href = "index.html";
            return;
        }

        if (!data.array || data.array.length < 5) {
            progressText.style.color = "red";
            progressText.textContent = "You have given less than 5 interviews!";
            return;
        }

        const scores = data.array;
        const labels = ["Test 1", "Test 2", "Test 3", "Test 4", "Test 5"];
        progressText.textContent = data.suggestion;

        if (window.myChart) {
            window.myChart.destroy();
        }

        window.myChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Progress",
                    data: scores,
                    borderColor: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: 10,
                        ticks: { color: "white", font: { size: 16 } }
                    },
                    x: {
                        ticks: { color: "white", font: { size: 16 } }
                    }
                },
                plugins: {
                    legend: { labels: { color: "white", font: { size: 18 } } }
                }
            }
        });

    } catch (error) {
        progressText.style.color = "red";
        progressText.textContent = "Error connecting to server!";
        console.error(error);
    }
});

function home() {
    window.location.href = "aifrontend.html";
}

function start() {
    window.location.href = "interviewstart.html";
}
