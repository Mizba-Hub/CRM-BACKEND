const express = require("express");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoute");
const companyRoutes = require("./routes/companyRoute");
const leadRoute = require("./routes/leadRoute");
const dealRoutes = require("./routes/dealRoutes");
const errorHandler = require("./middlewares/errorMiddleware");
const authMiddleware = require("./middlewares/authMiddleware");
require("dotenv").config();
const Deal = require("./models/deal"); 

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/auth/users", authMiddleware);
app.use("/api/v1/lead", leadRoute);
app.use("/api/v1/companies", companyRoutes);
app.use("/api/v1/deal",dealRoutes)

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
