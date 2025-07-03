chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ passwords: [] });
});

chrome.webNavigation.onCompleted.addListener(({ tabId, frameId }) => {
    if (frameId !== 0) return;

    chrome.tabs.get(tabId, (tab) => {
        if (tab && tab.url && !tab.url.startsWith("chrome://")) {
            chrome.scripting.executeScript({
                target: { tabId },
                function: newPageLoad,
            });
        }
    });
});

const newPageLoad = async () => {
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

                const strongPassword = document.createElement("input");
                strongPassword.type = "checkbox";
                strongPassword.id = "strongPasswordCheck"

                const strongPasswordLabel = document.createElement("label");
                strongPasswordLabel.htmlFor = "strongPasswordCheck";
                strongPasswordLabel.textContent = "Require strong password (uppercase, number, symbol)";

                const btnSave = document.createElement("button");
                btnSave.textContent = "Save";
                btnSave.addEventListener("click", async () => {
                    const emailVal = emailInput.value.trim();
                    const passwordVal = passwordInput.value.trim();
                    if (!emailVal || !passwordVal) return;

                    if(passwordVal.length < 8){
                      alert("Please enter a valid number of characters (at least 8).");
                      return;
                    }

                    if(strongPassword.checked){
                      if (!/[A-Z]/.test(passwordVal)){
                      alert("Please include at least one uppercase letter in your password.");
                      return;
                      }

                      if(!/[0-9]/.test(passwordVal)){
                        alert("Please include at least one number in your password.");
                        return;
                      }

                      if(!/[!@#$%^&*(),.?":{}|<>]/.test(passwordVal)){
                        alert("Please include at least one special character in your password.");
                        return;
                      }
                    }

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
                    if (document.getElementById("passwordGeneratorPopup")) {
                        document.getElementById("passwordGeneratorPopup").remove();
                    }
                    const container2 = document.createElement("div");
                    container2.id = "passwordGeneratorPopup";

                    Object.assign(container2.style, {
                        position: "absolute",
                        background: "#fff",
                        border: "1px solid #ccc",
                        padding: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        zIndex: "1001",
                        borderRadius: "5px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                    });

                    const rect = btnGenerate.getBoundingClientRect();
                    container2.style.top = `${rect.bottom + window.scrollY}px`;
                    container2.style.left = `${rect.left + window.scrollX}px`;

                    const numberOfCharacters = document.createElement("input");
                    numberOfCharacters.type = "number";
                    numberOfCharacters.min = 8;
                    numberOfCharacters.max = 24;
                    numberOfCharacters.placeholder = "Password length (e.g., 12)";
                    numberOfCharacters.style.width = "100%";

                    const useSymbols = document.createElement("input");
                    useSymbols.type = "checkbox";
                    useSymbols.id = "useSymbolsCheckbox";

                    const useSymbolsLabel = document.createElement("label");
                    useSymbolsLabel.htmlFor = "useSymbolsCheckbox";
                    useSymbolsLabel.textContent = "Include symbols (e.g., @#$%)";

                    const btnSubmit = document.createElement("button");
                    btnSubmit.textContent = "Generate";
                    btnSubmit.addEventListener("click", () => {
                        const length = parseInt(numberOfCharacters.value);
                        if (isNaN(length) || length < 8 || length > 24) {
                            alert("Please enter a valid number of characters (at least 8, max 24).");
                            return;
                        }

                        const generated = generatePassword(length, useSymbols.checked);
                        passwordInput.value = generated;
                        container2.remove();
                    });

                    const btnCancel = document.createElement("button");
                    btnCancel.textContent = "Cancel";
                    btnCancel.addEventListener("click", () => {
                        container2.remove();
                    });

                    container2.appendChild(numberOfCharacters);
                    container2.appendChild(useSymbolsLabel);
                    container2.appendChild(useSymbols);
                    container2.appendChild(btnSubmit);
                    container2.appendChild(btnCancel);
                    document.body.appendChild(container2);
                });

                const btnClose = document.createElement("button");
                btnClose.textContent = "Close";
                btnClose.addEventListener("click", () => {
                    container.remove();
                });

                container.appendChild(emailInput);
                container.appendChild(passwordInput);
                container.appendChild(btnGenerate);
                container.appendChild(strongPasswordLabel);
                container.appendChild(strongPassword);
                container.appendChild(btnSave);
                container.appendChild(btnClose);
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
