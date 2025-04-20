async function signUp(event) {
    event.preventDefault(); 

    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var message = document.getElementById("message");

    try {
        const result = await fetch("https://aiserver-phi.vercel.app/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "username": username,
                "password": password
            }
        });

        const data = await result.json();

        if (data.mes === "false") {
            message.style.color = "red";
            message.textContent = "User already exists";
        } else {
            message.style.color = "green";
            message.textContent = "Sign-up successful!";

            setTimeout(() => {
                window.location.href = "index.html";
            }, 3000);
        }
    } catch (error) {
        message.textContent = "Error connecting to server!";
        message.style.color = "red";
    }
}


document.querySelector("form").addEventListener("submit", signUp);
