chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ passwords: [] }, () => {
        console.log("Password map created");
    });
});

chrome.webNavigation.onCompleted.addListener(({ tabId, frameId }) => {
    if (frameId !== 0) return;

    chrome.tabs.get(tabId, (tab) =>{
        if (tab && tab.url && !tab.url.startsWith("chrome://")) {
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: newPageLoad,
                });
        }
    });
});

const newPageLoad = async () => {
  const { passwords = [] } = await chrome.storage.sync.get("passwords");
  const pagePassword = passwords.find(pwd => pwd.url === location.origin);
  let savedEmail = pagePassword ? (pagePassword.email || pagePassword.username || "") : "";
  let savedPassword = pagePassword ? pagePassword.password || "" : "";

  let fields = document.getElementsByTagName("input");
  const size = fields.length;

  for (let i = 0; i < size; i++) {
    const input = fields[i];

    if (input.type === "email" ||
      (input.type === "text" && input.id === "email") ||
      (input.type === "text" && input.name === "email") ||
      input.type.includes("user") ||
      (input.type === "text" && input.id.includes("user")) ||
      (input.type === "text" && input.name.includes("user"))
    ) {
      if (savedEmail) {
        input.value = savedEmail;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        if (document.getElementById("addCredentialsPopup")) continue;

        const container = document.createElement("div");
        container.id = "addCredentialsPopup";
        Object.assign(container.style, {
          position: "absolute",
          top: (input.getBoundingClientRect().bottom + window.scrollY) + "px",
          left: (input.getBoundingClientRect().left + window.scrollX) + "px",
          background: "#fff",
          border: "1px solid #ccc",
          padding: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          zIndex: "1000",
          borderRadius: "5px",
          display: "flex",
          gap: "5px",
          alignItems: "center",
        });

        const emailInput = document.createElement("input");
        emailInput.type = "text";
        emailInput.placeholder = "Enter email/user";
        emailInput.style.flex = "1";

        const passwordInput = document.createElement("input");
        passwordInput.type = "password";
        passwordInput.placeholder = "Enter password";
        passwordInput.style.flex = "1";

        const btnSave = document.createElement("button");
        btnSave.textContent = "Save";
        btnSave.addEventListener("click", async () => {
          const emailVal = emailInput.value.trim();
          const passwordVal = passwordInput.value.trim();
          if (!emailVal || !passwordVal) return;

          const { passwords = [] } = await chrome.storage.sync.get("passwords");
          const index = passwords.findIndex(pwd => pwd.url === location.origin);

          if (index !== -1) {
            passwords[index].email = emailVal;
            passwords[index].username = emailVal;
            passwords[index].password = passwordVal;
          } else {
            passwords.push({ url: location.origin, email: emailVal, username: emailVal, password: passwordVal });
          }

          await chrome.storage.sync.set({ passwords });
          input.value = emailVal;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          for (let j = 0; j < size; j++) {
            const inp = fields[j];
            if (inp.type === "password") {
              inp.value = passwordVal;
              inp.dispatchEvent(new Event('input', { bubbles: true }));
              inp.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }

          container.remove();
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
      }
      continue;
    }

    if (input.type !== "password") continue;

    if (savedPassword) {
      input.value = savedPassword;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
};
