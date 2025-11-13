const { Op } = require("sequelize");
const Email = require("../../models/activity/email");
const Attachment = require("../../models/activity/attachment");
const User = require("../../models/user");

const emailRepository = {

  create: async (emailData) => {
    try {
      return await Email.create(emailData);
    } catch (error) {
      throw new Error(`Failed to create email: ${error.message}`);
    }
  },

  findAll: async (options = {}) => {
    try {
      return await Email.findAll(options);
    } catch (error) {
      throw new Error(`Failed to fetch emails: ${error.message}`);
    }
  },

  findById: async (id, options = {}) => {
    try {
      return await Email.findByPk(id, options);
    } catch (error) {
      throw new Error(`Failed to fetch email by ID: ${error.message}`);
    }
  },

  findOne: async (where, options = {}) => {
    try {
      return await Email.findOne({ where, ...options });
    } catch (error) {
      throw new Error(`Failed to find email: ${error.message}`);
    }
  },

  count: async (options = {}) => {
    try {
      return await Email.count(options);
    } catch (error) {
      throw new Error(`Failed to count emails: ${error.message}`);
    }
  },

  update: async (id, data) => {
    try {
      const [affectedCount] = await Email.update(data, { 
        where: { id } 
      });
      return affectedCount;
    } catch (error) {
      throw new Error(`Failed to update email: ${error.message}`);
    }
  },

 
  delete: async (id) => {
    try {
      return await Email.destroy({ where: { id } });
    } catch (error) {
      throw new Error(`Failed to delete email: ${error.message}`);
    }
  },

 
  findByUserId: async (userId, options = {}) => {
    try {
      return await Email.findAll({
        where: { userId },
        include: options.include || [],
        order: options.order || [['sentAt', 'DESC']],
        ...options
      });
    } catch (error) {
      throw new Error(`Failed to fetch emails by user: ${error.message}`);
    }
  },

  findByLinkedEntity: async (linkedType, linkedId, options = {}) => {
    try {
      return await Email.findAll({
        where: { linkedType, linkedId },
        include: options.include || [],
        order: options.order || [['sentAt', 'DESC']],
        ...options
      });
    } catch (error) {
      throw new Error(`Failed to fetch emails by linked entity: ${error.message}`);
    }
  },

  findByDateRange: async (startDate, endDate, options = {}) => {
    try {
      return await Email.findAll({
        where: {
          sentAt: {
            [Op.between]: [new Date(startDate), new Date(endDate)]
          },
          ...options.where
        },
        include: options.include || [],
        order: options.order || [['sentAt', 'DESC']],
        ...options
      });
    } catch (error) {
      throw new Error(`Failed to fetch emails by date range: ${error.message}`);
    }
  },

 
  attachFiles: async (emailId, files = [], attachmentIds = []) => {
    try {
    
      if (files.length > 0) {
        const attachments = files.map((file) => ({
          filename: file.originalname,
          fileUrl: file.path,
          emailId,
          uploadedById: file.uploadedById || null
        }));
        await Attachment.bulkCreate(attachments);
      }

     
      if (attachmentIds && attachmentIds.length > 0) {
        const attachmentIdArray = Array.isArray(attachmentIds) ? attachmentIds : [attachmentIds];
        await Attachment.update(
          { emailId }, 
          { 
            where: { 
              id: { [Op.in]: attachmentIdArray } 
            } 
          }
        );
      }

      return { success: true, message: 'Files attached successfully' };
    } catch (error) {
      throw new Error(`Failed to attach files: ${error.message}`);
    }
  },

  detachFiles: async (emailId) => {
    try {
      await Attachment.update(
        { emailId: null }, 
        { 
          where: { 
            emailId 
          } 
        }
      );
      return { success: true, message: 'Files detached successfully' };
    } catch (error) {
      throw new Error(`Failed to detach files: ${error.message}`);
    }
  },

 
  getEmailStats: async (userId = null, startDate = null, endDate = null) => {
    try {
      const where = {};
      
      if (userId) where.userId = userId;
      if (startDate && endDate) {
        where.sentAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const totalEmails = await Email.count({ where });
      
      const emailsWithAttachments = await Email.count({
        where: {
          ...where,
          '$attachments.id$': { [Op.ne]: null }
        },
        include: [{
          model: Attachment,
          as: 'attachments',
          attributes: []
        }]
      });

      const recentEmails = await Email.findAll({
        where,
        order: [['sentAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'subject', 'sentAt']
      });

      return {
        totalEmails,
        emailsWithAttachments,
        emailsWithoutAttachments: totalEmails - emailsWithAttachments,
        recentEmails
      };
    } catch (error) {
      throw new Error(`Failed to get email statistics: ${error.message}`);
    }
  },

  getEmailCountByType: async () => {
    try {
      const result = await Email.findAll({
        attributes: [
          'linkedType',
          [Email.sequelize.fn('COUNT', Email.sequelize.col('id')), 'count']
        ],
        group: ['linkedType'],
        raw: true
      });

      return result.reduce((acc, item) => {
        acc[item.linkedType] = parseInt(item.count);
        return acc;
      }, {});
    } catch (error) {
      throw new Error(`Failed to get email count by type: ${error.message}`);
    }
  },


  bulkCreate: async (emailsData) => {
    try {
      return await Email.bulkCreate(emailsData, { validate: true });
    } catch (error) {
      throw new Error(`Failed to bulk create emails: ${error.message}`);
    }
  },

  bulkUpdate: async (ids, data) => {
    try {
      const [affectedCount] = await Email.update(data, {
        where: { id: { [Op.in]: ids } }
      });
      return affectedCount;
    } catch (error) {
      throw new Error(`Failed to bulk update emails: ${error.message}`);
    }
  },

  bulkDelete: async (ids) => {
    try {
      return await Email.destroy({
        where: { id: { [Op.in]: ids } }
      });
    } catch (error) {
      throw new Error(`Failed to bulk delete emails: ${error.message}`);
    }
  },

  searchEmails: async (searchTerm, options = {}) => {
    try {
      return await Email.findAll({
        where: {
          [Op.or]: [
            { subject: { [Op.like]: `%${searchTerm}%` } },
            { body: { [Op.like]: `%${searchTerm}%` } },
            { recipients: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        include: options.include || [],
        order: options.order || [['sentAt', 'DESC']],
        ...options
      });
    } catch (error) {
      throw new Error(`Failed to search emails: ${error.message}`);
    }
  }
};

module.exports = emailRepository;