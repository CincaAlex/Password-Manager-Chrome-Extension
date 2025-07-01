document.addEventListener("DOMContentLoaded", async () => {
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
    if (document.getElementById("addCredentialsPopup")) return;

    const container = document.createElement("div");
    container.id = "addCredentialsPopup";

    Object.assign(container.style, {
      position: "absolute",
      top: "60px",
      left: "10px",
      background: "#fff",
      border: "1px solid #ccc",
      padding: "10px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      zIndex: "1000",
      borderRadius: "5px",
      display: "flex",
      gap: "5px",
      alignItems: "center",
      flexWrap: "wrap",
      maxWidth: "400px"
    });

    const emailInput = document.createElement("input");
    emailInput.type = "text";
    emailInput.placeholder = "Email/User";
    emailInput.style.flex = "1";

    const passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.placeholder = "Password";
    passwordInput.style.flex = "1";

    const btnSave = document.createElement("button");
    btnSave.textContent = "Save";
    btnSave.style.marginRight = "5px";

    btnSave.addEventListener("click", async () => {
      const emailVal = emailInput.value.trim();
      const passwordVal = passwordInput.value.trim();
      if (!emailVal || !passwordVal) return;

      const { passwords = [] } = await chrome.storage.sync.get("passwords");
      passwords.push({ url: urlOrigin, email: emailVal, username: emailVal, password: passwordVal });
      await chrome.storage.sync.set({ passwords });

      container.remove();
      location.reload();
    });

    const btnGenerate = document.createElement("button");
    btnGenerate.textContent = "Generate Password";

    btnGenerate.addEventListener("click", () => {
      const generated = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      passwordInput.value = generated;
    });

    container.appendChild(emailInput);
    container.appendChild(passwordInput);
    container.appendChild(btnGenerate);
    container.appendChild(btnSave);
    document.body.appendChild(container);
  });
});