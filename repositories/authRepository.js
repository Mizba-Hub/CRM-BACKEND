const User = require("../models/user");

const createUser = async (userData) => {
  return await User.create(userData);
};

const findUserByEmail = async (email) => {
  return await User.findOne({ where: { email } });
};

const findUserByResetToken = async (token) => {
  return await User.findOne({ where: { resetToken: token } });
};

const updateUser = async (user, updatedData) => {
  Object.assign(user, updatedData);
  return await user.save();
};


const getAllUsers = async () => {
  return await User.findAll();
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByResetToken,
  updateUser,
  getAllUsers,
};
