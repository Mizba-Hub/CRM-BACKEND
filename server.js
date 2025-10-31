const express = require('express');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoute');
require('dotenv').config();

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);


sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch(err => console.log('Error: ' + err));


sequelize.sync()
  .then(() => console.log('Tables synced'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
