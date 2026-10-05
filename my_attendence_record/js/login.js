// ========================================
// LOGIN
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    // If this page is not login.html, do nothing
    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const password =
            document.getElementById("password").value.trim();

        const message =
            document.getElementById("loginMessage");


        // ----------------------------------------
        // CHECK INPUT
        // ----------------------------------------

        if (username === "" || password === "") {

            message.textContent =
                "Please enter username and password.";

            return;
        }


        // ----------------------------------------
        // SAVE USER
        // ----------------------------------------

        localStorage.setItem(
            "loggedInUser",
            username
        );


        // ----------------------------------------
        // LOGIN SUCCESS
        // ----------------------------------------

        console.log("Logged in as:", username);

        window.location.href = "index.html";

    });

});