let applyUsername = document.getElementById("apply-username");
let usernameInput = document.querySelector("#input-username");
applyUsername.addEventListener("click", () => {
  if (usernameInput.value != "") {
    localStorage.setItem("Username", usernameInput.value);
    usernameInput.value = "";
  }
});

document.querySelector("#create-button").addEventListener("click", () => {
  if (document.querySelector("#input-roomName").value != "") {
    window.location.href = `/${
      document.querySelector("#input-roomName").value
    }`;
  }
});
