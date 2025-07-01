document.addEventListener("DOMContentLoaded", async () => {
  const passwordsDiv = document.getElementById("passwordsDiv");

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    passwordsDiv.textContent = "No active tab detected.";
    return;
  }

  const urlOrigin = new URL(tab.url).origin;

  const { passwords } = await chrome.storage.sync.get("passwords");
  if (!passwords || passwords.length === 0) {
    passwordsDiv.textContent = "No passwords saved yet.";
    return;
  }

  const sitePasswords = passwords.filter(pwd => pwd.url === urlOrigin);

  if (sitePasswords.length === 0) {
    passwordsDiv.textContent = "No saved passwords for this site.";
    return;
  }

  sitePasswords.forEach((pwd, index) => {
    const p = document.createElement("p");
    p.textContent = `Password ${index + 1}: ${pwd.password}`;
    passwordsDiv.appendChild(p);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      const updatedPasswords = passwords.filter(pw => pw !== pwd);
      await chrome.storage.sync.set({ passwords: updatedPasswords });
      p.remove();
      deleteBtn.remove();
    });
    passwordsDiv.appendChild(deleteBtn);
  });
});
