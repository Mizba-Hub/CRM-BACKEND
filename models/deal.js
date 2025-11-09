const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 
const User = require('./user');
const Lead = require('./lead');
const Deal = sequelize.define('Deal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dealName: {
    type: DataTypes.ENUM("Presentation Scheduled","Qualified to Buy","Contract Sent","Closed Won","Appointment Scheduled","Decision Maker Bought In","Closed Lost" ),
    defaultValue: "Presentation Scheduled",
    allowNull:false

  },
  dealStage: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.STRING,
    allowNull: false
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: false
  },
  closeDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  leadId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Leads',
      key: 'id'
    }
  }
}, {
  tableName: 'deals',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});
Deal.belongsToMany(User, {
  through: 'DealOwners',
  as: 'dealOwner',
  foreignKey: 'dealId',
  otherKey: 'userId'
});
User.belongsToMany(Deal, {
  through: 'DealOwners',
  as: 'ownedDeals',
  foreignKey: 'userId',
  otherKey: 'dealId'
});
Deal.belongsTo(Lead, {
  as: 'associatedLead',
  foreignKey: 'leadId'
});
Lead.hasMany(Deal, {
  as: 'deals',
  foreignKey: 'leadId'
});
module.exports = Deal;