const Call = require("../../models/activity/call");

const createCall = async (payload) => {
  const call = await Call.create(payload);
  return call;
};

const findCallById = async (id) => {
  const call = await Call.findByPk(id, {
    include: [{ association: "User" }],
  });
  return call;
};

const updateCall = async (callInstance, updates) => {
  await callInstance.update(updates);
  return callInstance;
};

const deleteCall = async (callInstance) => {
  await callInstance.destroy();
  return true;
};

module.exports = {
  createCall,
  findCallById,
  updateCall,
  deleteCall,
};

