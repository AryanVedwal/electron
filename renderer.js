const Tabulator = require("tabulator-tables");
const { ipcRenderer } = require("electron");

const columns = [
  { title: "S.no", field: "sno", editor: "input" },
  {
    title: "Description of the Equipment",
    field: "description",
    editor: "input",
  },
  { title: "Make", field: "make", editor: "input" },
  { title: "Model Number", field: "model", editor: "input" },
  { title: "Owner", field: "owner", editor: "input" },
  { title: "Current Location", field: "location", editor: "input" },
  { title: "Status", field: "status", editor: "input" },
  { title: "Calibration Agency", field: "calibration", editor: "input" },
  { title: "Cal. Interval", field: "interval", editor: "input" },
  { title: "Certificate Number", field: "certificate", editor: "input" },
  { title: "Serial Number", field: "serial", editor: "input" },
  { title: "Equipment ID", field: "id", editor: "input" },
  { title: "Range", field: "range", editor: "input" },
  { title: "Standard Type", field: "type", editor: "input" },
  { title: "Date Due", field: "due", editor: "input" },
  { title: "Last Cal Date", field: "last", editor: "input" },
];

let table = null;
let sheets = [];
let activeSheetIndex = 0;

async function initializeTabulator() {
  table = new Tabulator("#tabulator-table", {
    columns: columns,
    layout: "fitColumns",
    data: [],
    reactiveData: true,
  });

  table.on("cellEdited", function (cell) {
    updateSheetData();
  });

  await loadSheets();
}

async function loadSheets() {
  try {
    const response = await fetch("http://localhost:3000/api/sheets");
    sheets = await response.json();
    updateSheetTabs();
    if (sheets.length > 0) {
      switchToSheet(0);
    } else {
      addNewSheet();
    }
  } catch (error) {
    console.error("Failed to load sheets:", error);
  }
}

async function addNewSheet() {
  try {
    const response = await fetch("http://localhost:3000/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Sheet ${sheets.length + 1}`, data: [] }),
    });
    const newSheet = await response.json();
    sheets.push(newSheet);
    updateSheetTabs();
    switchToSheet(sheets.length - 1);
  } catch (error) {
    console.error("Failed to add new sheet:", error);
  }
}

function updateSheetTabs() {
  const sheetTabs = document.getElementById("sheet-tabs");
  sheetTabs.innerHTML = "";
  sheets.forEach((sheet, index) => {
    const newTab = document.createElement("div");
    newTab.className = "sheet-tab";

    const sheetName = document.createElement("span");
    sheetName.textContent = sheet.name;
    sheetName.onclick = () => switchToSheet(index);
    newTab.appendChild(sheetName);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "X";
    deleteButton.className = "delete-sheet";
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      deleteSheet(index);
    };
    newTab.appendChild(deleteButton);

    sheetTabs.appendChild(newTab);
  });

  const tabs = document.getElementsByClassName("sheet-tab");
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove("active");
  }
  if (tabs[activeSheetIndex]) {
    tabs[activeSheetIndex].classList.add("active");
  }
}

async function switchToSheet(index) {
  if (index >= sheets.length) {
    index = sheets.length - 1;
  }
  activeSheetIndex = index;
  if (sheets[index]) {
    table.setData(sheets[index].data);
  } else {
    table.setData([]);
  }

  updateSheetTabs();
  document.getElementById("updateSheet").disabled = false;
}

async function addNewRow() {
  if (table) {
    const newRow = {};
    table.addRow(newRow);
    sheets[activeSheetIndex].data.push(newRow);
    await updateSheetData();
  }
}

async function updateSheetData() {
  if (!sheets[activeSheetIndex]) {
    console.error("No active sheet to update");
    return;
  }

  try {
    const currentData = table.getData();
    sheets[activeSheetIndex].data = currentData;

    const response = await fetch(
      `http://localhost:3000/api/sheets/${sheets[activeSheetIndex].id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sheets[activeSheetIndex]),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update sheet");
    }

    console.log("Sheet updated successfully");
  } catch (error) {
    console.error("Failed to update sheet data:", error);
  }
}

async function deleteSheet(index) {
  if (sheets.length <= 1) {
    alert("Cannot delete the last sheet.");
    return;
  }

  const sheetToDelete = sheets[index];
  try {
    const response = await fetch(
      `http://localhost:3000/api/sheets/${sheetToDelete.id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete sheet");
    }

    sheets.splice(index, 1);
    updateSheetTabs();
    switchToSheet(Math.min(index, sheets.length - 1));
    console.log("Sheet deleted successfully");
  } catch (error) {
    console.error("Failed to delete sheet:", error);
  }
}

async function updateAllSheets() {
  try {
    const response = await fetch("http://localhost:3000/api/sheets/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sheets),
    });

    if (!response.ok) {
      throw new Error("Failed to update sheets");
    }

    console.log("All sheets updated successfully");
  } catch (error) {
    console.error("Failed to update all sheets:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await initializeTabulator();

  document.getElementById("addSheet").addEventListener("click", addNewSheet);
  document.getElementById("addRow").addEventListener("click", addNewRow);
  document
    .getElementById("updateSheet")
    .addEventListener("click", updateSheetData);

  document.getElementById("updateSheet").disabled = true;
});

ipcRenderer.on("app-closing", async () => {
  await updateAllSheets();
  ipcRenderer.send("app-can-close");
});
