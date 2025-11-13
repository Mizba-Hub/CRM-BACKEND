const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../config/database");
const User = require("../user");

class Meeting extends Model {}

Meeting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING,
    },
    duration: {
      type: DataTypes.STRING,
    },

   
    location: {
      type: DataTypes.ENUM(
        "Conference Room A",
        "Conference Room B",
        "Google Meet",
        "Zoom Meeting",
        "MS Meet"
      ),
      allowNull: true,
    },

    reminder: {
      type: DataTypes.ENUM(
        "10 minutes before",
        "30 minutes before",
        "1 hour before",
        "1 day before"
      ),
      allowNull: true,
    },

    note: {
      type: DataTypes.TEXT,
    },

    linkedModule: {
      type: DataTypes.ENUM("lead", "deal", "ticket", "company"),
      allowNull: false,
    },
    linkedModuleId: {
      type: DataTypes.INTEGER,
    },
    totalcount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: "GMT+00:00",
    },
  },
  {
    sequelize,
    modelName: "Meeting",
    tableName: "meetings",
    timestamps: true,
    underscored: true,
  }
);


Meeting.belongsToMany(User, {
  through: "MeetingOrganizers",
  as: "organizers",
  foreignKey: "meetingId",
  otherKey: "userId",
});

Meeting.belongsToMany(User, {
  through: "MeetingAttendees",
  as: "attendees",
  foreignKey: "meetingId",
  otherKey: "userId",
});

module.exports = Meeting;
