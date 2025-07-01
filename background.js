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
    let fields = document.getElementsByTagName("input");
    const size = fields.length;
    for (let i = 0; i < size; i++) {
        const input = fields[i];

        if(input.type !== "password") continue;

        const { passwords } = await chrome.storage.sync.get("passwords");
        const pagePassword = passwords.find(pwd => pwd.url === location.origin);

        if(pagePassword !== undefined) {
            input.value = pagePassword.password;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }else {
            const container = document.createElement("div");

            const fieldInput = document.createElement("input");
            fieldInput.type = "text";

            const btnSubmit = document.createElement("button");
            btnSubmit.textContent = "Save Password";
            btnSubmit.addEventListener("click", async () => {
                const { passwords } = await chrome.storage.sync.get("passwords") || { passwords: [] };
                
                const index = passwords.findIndex(pwd => pwd.url === location.origin);
                if(index !== -1) {
                    passwords[index].password = fieldInput.value;
                }else{
                passwords.push({ password: fieldInput.value, url: location.origin });
                }

                chrome.storage.sync.set({ passwords }, () => {
                    console.log("Password saved!");
                });
                input.value = fieldInput.value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                container.remove();
            });


            const btnGenerate = document.createElement("button");
            btnGenerate.textContent = "Generate Password";
            btnGenerate.addEventListener("click", () => {
                
            });

            container.appendChild(fieldInput);
            container.appendChild(btnSubmit);
            container.appendChild(btnGenerate);
            document.body.appendChild(container);

            const rect = input.getBoundingClientRect();
            container.style.position = "absolute";
            container.style.top = (rect.bottom + window.scrollY) + "px";
            container.style.left = (rect.left + window.scrollX) + "px";
            container.style.zIndex = "9999";
        }
    }
};
