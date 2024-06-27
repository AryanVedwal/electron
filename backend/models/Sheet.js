const { DataTypes } = require("sequelize");
const sequelize = require("../db/database");

const Sheet = sequelize.define("Sheet", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
  },
});

module.exports = Sheet;
