document.addEventListener("DOMContentLoaded", async () => {

  function getRandomChar(str) {
    const index = Math.floor(Math.random() * str.length);
    return str.charAt(index);
}

  function generatePassword(length, useSymbol) {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const symbols = "!@#$%^&*()-_=+[]{};:,.<>?";

    let generatedPassword = [
        getRandomChar(lowercase),
        getRandomChar(uppercase),
        getRandomChar(digits)
    ];

    let all = lowercase + uppercase + digits;
    length -= 3;

    if (useSymbol) {
        generatedPassword.push(getRandomChar(symbols));
        all += symbols;
        length--;
    }

    while (length > 0) {
        generatedPassword.push(getRandomChar(all));
        length--;
    }

    for (let i = generatedPassword.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [generatedPassword[i], generatedPassword[j]] = [generatedPassword[j], generatedPassword[i]];
    }

    return generatedPassword.join('');
}
  const addBtn = document.getElementById("addPasswordBtn");
  const passwordsDiv = document.getElementById("passwordsDiv");
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    passwordsDiv.textContent = "No active tab detected.";
    return;
  }

  const urlOrigin = new URL(tab.url).origin;
  const { passwords = [] } = await chrome.storage.sync.get("passwords");
  const sitePasswords = passwords.filter(pwd => pwd.url === urlOrigin);

  if (sitePasswords.length === 0) {
    passwordsDiv.textContent = "No saved credentials for this site.";
  } else {
    sitePasswords.forEach((cred, index) => {
      const wrapper = document.createElement("div");
      wrapper.style.marginBottom = "10px";

      const info = document.createElement("p");
      info.textContent = `Entry ${index + 1}: ${cred.email || cred.username || "No email/user saved"}`;
      wrapper.appendChild(info);

      const autofillBtn = document.createElement("button");
      autofillBtn.textContent = "Autofill";
      autofillBtn.style.marginRight = "5px";
      autofillBtn.addEventListener("click", () => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (credentials) => {
            const isVisible = (elem) => 
              !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
            const inputs = Array.from(document.querySelectorAll('input'));
            const pwdField = inputs.find(input => 
              input.type === 'password' && 
              isVisible(input)
            );
            const userField = inputs.find(input => 
              (input.type === 'text' || 
               input.type === 'email' || 
               input.type === 'tel' || 
               input.type === 'number') && 
              isVisible(input) && 
              input !== pwdField
            );
            if (userField) {
              userField.value = credentials.username;
              userField.dispatchEvent(new Event('input', { bubbles: true }));
              userField.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (pwdField) {
              pwdField.value = credentials.password;
              pwdField.dispatchEvent(new Event('input', { bubbles: true }));
              pwdField.dispatchEvent(new Event('change', { bubbles: true }));
            }
          },
          args: [{
            username: cred.email || cred.username || '',
            password: cred.password
          }]
        }).catch(err => console.error('Autofill failed:', err));
      });
      wrapper.appendChild(autofillBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", async () => {
        const updatedPasswords = passwords.filter(pw => pw !== cred);
        await chrome.storage.sync.set({ passwords: updatedPasswords });
        wrapper.remove();
      });
      wrapper.appendChild(deleteBtn);

      passwordsDiv.appendChild(wrapper);
    });
  }

  addBtn.addEventListener("click", () => {
  if (document.getElementById("addCredentialsPopupOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "addCredentialsPopupOverlay";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0", left: "0", right: "0", bottom: "0",
    backgroundColor: "rgba(0,0,0,0.3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "10000",
  });

  const container = document.createElement("div");
  container.id = "addCredentialsPopup";
  Object.assign(container.style, {
    background: "#fff",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    maxWidth: "400px",
    width: "90%",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  });

  const emailInput = document.createElement("input");
  emailInput.type = "text";
  emailInput.placeholder = "Email or Username";
  emailInput.style.padding = "10px";
  emailInput.style.fontSize = "1rem";
  emailInput.style.borderRadius = "4px";
  emailInput.style.border = "1px solid #ccc";

  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.placeholder = "Password";
  passwordInput.style.padding = "10px";
  passwordInput.style.fontSize = "1rem";
  passwordInput.style.borderRadius = "4px";
  passwordInput.style.border = "1px solid #ccc";

  const buttonsWrapper = document.createElement("div");
  buttonsWrapper.style.display = "flex";
  buttonsWrapper.style.justifyContent = "space-between";
  buttonsWrapper.style.gap = "10px";

  const btnSave = document.createElement("button");
  btnSave.textContent = "Save";
  btnSave.style.flex = "1";
  btnSave.style.padding = "10px";
  btnSave.style.fontSize = "1rem";
  btnSave.style.borderRadius = "4px";
  btnSave.style.border = "none";
  btnSave.style.backgroundColor = "#4CAF50";
  btnSave.style.color = "white";
  btnSave.style.cursor = "pointer";

  const btnGenerate = document.createElement("button");
  btnGenerate.textContent = "Generate Password";
  btnGenerate.style.flex = "1";
  btnGenerate.style.padding = "10px";
  btnGenerate.style.fontSize = "1rem";
  btnGenerate.style.borderRadius = "4px";
  btnGenerate.style.border = "none";
  btnGenerate.style.backgroundColor = "#2196F3";
  btnGenerate.style.color = "white";
  btnGenerate.style.cursor = "pointer";

  btnSave.addEventListener("click", async () => {
    const emailVal = emailInput.value.trim();
    const passwordVal = passwordInput.value.trim();
    if (!emailVal || !passwordVal) return alert("Please fill in both fields.");
    


    const { passwords = [] } = await chrome.storage.sync.get("passwords");
    passwords.push({ url: urlOrigin, email: emailVal, username: emailVal, password: passwordVal });
    await chrome.storage.sync.set({ passwords });

    document.body.removeChild(overlay);
    location.reload();
  });

  btnGenerate.addEventListener("click", () => {
    const generated = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    passwordInput.value = generated;
  });

  buttonsWrapper.appendChild(btnGenerate);
  buttonsWrapper.appendChild(btnSave);

  // Append all
  container.appendChild(emailInput);
  container.appendChild(passwordInput);
  container.appendChild(buttonsWrapper);

  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // Close popup if clicking outside container
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
});
});