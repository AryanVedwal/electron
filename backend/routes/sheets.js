const express = require("express");
const router = express.Router();
const Sheet = require("../models/Sheet");

// Get all sheets
router.get("/", async (req, res) => {
  try {
    const sheets = await Sheet.findAll();
    res.json(sheets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new sheet
router.post("/", async (req, res) => {
  try {
    const sheet = await Sheet.create(req.body);
    res.status(201).json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a sheet
router.put("/:id", async (req, res) => {
  try {
    const sheet = await Sheet.findByPk(req.params.id);
    if (sheet) {
      await sheet.update(req.body);
      res.json(sheet);
    } else {
      res.status(404).json({ message: "Sheet not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a sheet
router.delete("/:id", async (req, res) => {
  try {
    const sheet = await Sheet.findByPk(req.params.id);
    if (sheet) {
      await sheet.destroy();
      res.json({ message: "Sheet deleted successfully" });
    } else {
      res.status(404).json({ message: "Sheet not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Bulk update sheets
router.put("/bulk", async (req, res) => {
  try {
    const updatedSheets = req.body;
    for (const sheet of updatedSheets) {
      await Sheet.update(sheet, { where: { id: sheet.id } });
    }
    res.json({ message: "All sheets updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
