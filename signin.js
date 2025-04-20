document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("signin-form").addEventListener("submit", signin);
});

async function signin(event) {
    event.preventDefault();

    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var message = document.getElementById("message");

    message.textContent = "";
    message.style.color = "";

    if (username.trim() === "" || password.trim() === "") {
        message.style.color = "red";
        message.textContent = "All fields are required!";
        return;
    }

    try {
        const response = await fetch("https://aiserver-phi.vercel.app/signin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "username": username,
                "password": password
            }
        });

        const data = await response.json();
        if (data.mes === "true") {
            localStorage.clear();
            localStorage.setItem("username",username);
            localStorage.setItem("authToken", data.jwttoken);
            message.style.color = "green";
            message.textContent = "Login successful! Redirecting...";

            setTimeout(() => {
                window.location.href = "loader.html";
            }, 3000);
        } else {
            message.style.color = "red";
            message.textContent = "Invalid username or password!";
        }
    } catch (error) {
        message.style.color = "red";
        message.textContent = "Error connecting to server!";
    }
}

