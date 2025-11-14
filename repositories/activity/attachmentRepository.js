const { Op } = require("sequelize");
const Email = require("../../models/activity/email");

// ==================== CREATE ====================
const create = async (data) => {
  return await Email.create(data);
};

const bulkCreate = async (data) => {
  return await Email.bulkCreate(data);
};

// ==================== READ ====================
const findAll = async (options = {}) => {
  return await Email.findAll(options);
};

const findById = async (id, options = {}) => {
  return await Email.findByPk(id, options);
};

const findOne = async (where, options = {}) => {
  return await Email.findOne({ where, ...options });
};

// ==================== UPDATE ====================
const update = async (id, data) => {
  const [affectedCount] = await Email.update(data, { where: { id } });
  return affectedCount;
};

const updateMultiple = async (where, data) => {
  const [affectedCount] = await Email.update(data, { where });
  return affectedCount;
};

// ==================== DELETE ====================
const deleteEmail = async (id) => {
  const deletedCount = await Email.destroy({ where: { id } });
  return deletedCount;
};

const deleteMultiple = async (where) => {
  const deletedCount = await Email.destroy({ where });
  return deletedCount;
};

// ==================== COUNT & AGGREGATE ====================
const count = async (where = {}) => {
  return await Email.count({ where });
};

const findAndCountAll = async (options = {}) => {
  return await Email.findAndCountAll(options);
};

// ==================== SPECIAL QUERIES ====================
const findByLinkedEntity = async (linkedType, linkedId) => {
  return await Email.findAll({
    where: { linkedType, linkedId },
    order: [['sentAt', 'DESC']]
  });
};

const findByUserId = async (userId, options = {}) => {
  return await Email.findAll({
    where: { userId },
    order: [['sentAt', 'DESC']],
    ...options
  });
};

const searchEmails = async (searchTerm, options = {}) => {
  const where = {
    [Op.or]: [
      { subject: { [Op.like]: `%${searchTerm}%` } },
      { body: { [Op.like]: `%${searchTerm}%` } }
    ]
  };

  return await Email.findAll({
    where,
    order: [['sentAt', 'DESC']],
    ...options
  });
};

const findByDateRange = async (startDate, endDate, options = {}) => {
  const where = {
    sentAt: {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    }
  };

  return await Email.findAll({
    where,
    order: [['sentAt', 'DESC']],
    ...options
  });
};

// ==================== PAGINATION ====================
const paginate = async (page = 1, size = 10, where = {}, include = []) => {
  const offset = (page - 1) * size;
  const limit = parseInt(size);

  return await Email.findAndCountAll({
    where,
    include,
    order: [['sentAt', 'DESC']],
    offset,
    limit
  });
};

// ==================== STATISTICS ====================
const getStats = async (userId = null, startDate = null, endDate = null) => {
  const where = {};
  
  if (userId) where.userId = userId;
  if (startDate && endDate) {
    where.sentAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  const totalEmails = await Email.count({ where });
  
  const emailsByType = await Email.findAll({
    where,
    attributes: [
      'linkedType',
      [Email.sequelize.fn('COUNT', Email.sequelize.col('id')), 'count']
    ],
    group: ['linkedType'],
    raw: true
  });

  const recentActivity = await Email.findAll({
    where,
    order: [['sentAt', 'DESC']],
    limit: 10,
    attributes: ['id', 'subject', 'sentAt', 'linkedType']
  });

  return {
    totalEmails,
    emailsByType: emailsByType.reduce((acc, item) => {
      acc[item.linkedType] = parseInt(item.count);
      return acc;
    }, {}),
    recentActivity
  };
};

// ==================== EXPORTS ====================
module.exports = {
  // Create
  create,
  bulkCreate,
  
  // Read
  findAll,
  findById,
  findOne,
  
  // Update
  update,
  updateMultiple,
  
  // Delete
  delete: deleteEmail,
  deleteMultiple,
  
  // Count & aggregate
  count,
  findAndCountAll,
  
  // Special queries
  findByLinkedEntity,
  findByUserId,
  searchEmails,
  findByDateRange,
  
  // Pagination
  paginate,
  
  // Statistics
  getStats
};