document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.querySelector(".sidebar");
    const nameBtn = document.querySelector(".name-btn");
    const signOutBtn = document.querySelector(".signout-btn");
    const usernameDisplay = document.querySelector(".username");
    
    let savedName = localStorage.getItem("username");
    nameBtn.textContent = savedName; 
    usernameDisplay.textContent = savedName; 

    nameBtn.addEventListener("click", function (event) {
        sidebar.classList.toggle("active");

        nameBtn.style.background = "transparent";
        nameBtn.style.color = "transparent";
        nameBtn.style.border = "transparent";

        event.stopPropagation(); 
    });

    document.addEventListener("click", function (event) {
        if (!sidebar.contains(event.target) && !nameBtn.contains(event.target)) {
            sidebar.classList.remove("active");

            nameBtn.style.background = "transparent"; 
            nameBtn.style.color = "white"; 
            nameBtn.style.border = "2px solid white"; 
        }
    });

    signOutBtn.addEventListener("click", function () {
        localStorage.removeItem("username");
        localStorage.removeItem("authToken");
        nameBtn.textContent = "User"; 
        usernameDisplay.textContent = "User"; 
        sidebar.classList.remove("active");
        nameBtn.style.background = "transparent";
        nameBtn.style.color = "white"; 
        nameBtn.style.border = "2px solid white";
        window.location.href="index.html" 
    });
});
function checkprogress(){
    window.location.href="checkscore.html";
}
function startinterview(){
    window.location.href="interviewstart.html"
}