const express = require("express");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoute");
const companyRoutes = require("./routes/companyRoute");
const leadRoute = require("./routes/leadRoute");
const dealRoutes = require("./routes/dealRoutes");
const ticketRoutes = require("./routes/ticketRoute");
const errorHandler = require("./middlewares/errorMiddleware");
const authMiddleware = require("./middlewares/authMiddleware");
const attachmentRoutes = require("./routes/activity/attachmentRoute");
const meetingRoute = require("./routes/activity/meetingRoute");
const taskRoutes = require("./routes/activity/taskRoutes");
const callRoutes = require("./routes/activity/callRoutes");
const dashboardRoutes=require("./routes/dashboardRoute");

require("dotenv").config();
const Deal = require("./models/deal");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/auth/users", authMiddleware);
app.use("/api/v1/dashboard",dashboardRoutes);
app.use("/api/v1/lead", leadRoute);
app.use("/api/v1/companies", companyRoutes);
app.use("/api/v1/deal", dealRoutes);
app.use("/api/v1/tickets", ticketRoutes);
app.use("/api/v1/attachments", attachmentRoutes);
app.use("/api/v1/calls", callRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/v1/meetings", meetingRoute);

app.use(errorHandler);

sequelize
  .authenticate()
  .then(() => console.log("Database connected"))
  .catch((err) => console.log("Error: " + err));

sequelize
  .sync()
  .then(() => console.log("Tables synced"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
