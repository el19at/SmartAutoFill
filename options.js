const ruleForm = document.getElementById("ruleForm");
const rulesList = document.getElementById("rulesList");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const fileInput = document.getElementById("fileInput");

// Load and render rules
async function loadRules() {
  const { rules = [] } = await browser.storage.local.get("rules");
  rulesList.innerHTML = "";

  rules.forEach((rule, index) => {
    const li = document.createElement("li");

    // Editable input for "match"
    const matchInput = document.createElement("input");
    matchInput.type = "text";
    matchInput.value = rule.match;
    matchInput.style.marginRight = "10px";
    matchInput.style.flex = "1";
    matchInput.addEventListener("change", async () => {
      rules[index].match = matchInput.value.trim();
      await browser.storage.local.set({ rules });
      loadRules();
    });

    // Editable input for "value"
    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.value = rule.value;
    valueInput.style.marginRight = "10px";
    valueInput.style.flex = "1";
    valueInput.addEventListener("change", async () => {
      rules[index].value = valueInput.value.trim();
      await browser.storage.local.set({ rules });
      loadRules();
    });

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "delete-btn";
    delBtn.onclick = async () => {
      rules.splice(index, 1);
      await browser.storage.local.set({ rules });
      loadRules();
    };

    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "10px";

    li.appendChild(matchInput);
    li.appendChild(valueInput);
    li.appendChild(delBtn);
    rulesList.appendChild(li);
  });
}


// Add new rule
ruleForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const match = document.getElementById("match").value.trim();
  const value = document.getElementById("value").value.trim();
  if (!match || !value) return;

  const { rules = [] } = await browser.storage.local.get("rules");
  rules.push({ match, value });
  await browser.storage.local.set({ rules });
  ruleForm.reset();
  loadRules();
});

// Export rules to JSON file
exportBtn.addEventListener("click", async () => {
  const { rules = [] } = await browser.storage.local.get("rules");
  const blob = new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "smart-autofill-rules.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Trigger file input for import
importBtn.addEventListener("click", () => {
  fileInput.click();
});

// Import rules from JSON file
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  let importedRules;
  try {
    importedRules = JSON.parse(text);
    if (!Array.isArray(importedRules)) throw new Error("Invalid format");
  } catch (err) {
    alert("Invalid JSON file");
    return;
  }

  const { rules: existingRules = [] } = await browser.storage.local.get("rules");

  // Merge with override
  importedRules.forEach(imported => {
    const idx = existingRules.findIndex(r => r.match === imported.match);
    if (idx >= 0) {
      existingRules[idx] = imported; // override
    } else {
      existingRules.push(imported); // add new
    }
  });

  await browser.storage.local.set({ rules: existingRules });
  loadRules();
  fileInput.value = "";
});

loadRules();
