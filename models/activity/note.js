const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require("../user");
const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  linkedType: {
    type: DataTypes.ENUM('lead', 'deal', 'ticket', 'company'),
    allowNull: true
  },
  linkedId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'notes',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});


Note.belongsTo(User, {
  foreignKey: "userId",
  as: "owner",
});

User.hasMany(Note, {
  foreignKey: "userId",
  as: "Notes",
});

module.exports = Note;
