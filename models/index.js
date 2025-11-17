const User = require("./user");
const Email = require("./activity/email");
const Attachment = require("./activity/attachment");

// User → Emails
User.hasMany(Email, { as: "emails", foreignKey: "userId" });
Email.belongsTo(User, { as: "owner", foreignKey: "userId" });

// Email → Attachments
Email.hasMany(Attachment, { as: "attachments", foreignKey: "emailId" });
Attachment.belongsTo(Email, { as: "email", foreignKey: "emailId" });

// User → Attachments
User.hasMany(Attachment, { foreignKey: "uploadedById", as: "attachments" });
Attachment.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });

module.exports = { User, Email, Attachment };
