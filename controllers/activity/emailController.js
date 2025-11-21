const { Op } = require("sequelize");
const Email = require("../../models/activity/email");
const Attachment = require("../../models/activity/attachment");
const attachmentRepository = require("../../repositories/activity/attachmentRepository");
const emailRepository = require("../../repositories/activity/emailRepository");
const User = require("../../models/user");
const Lead = require("../../models/lead");
const Deal = require("../../models/deal");
const Ticket = require("../../models/ticket");
const Company = require("../../models/company");
const path = require("path");
const fs = require("fs");
const sendEmail = require("../../utils/sendEmail");

const linkedModels = { 
  lead: Lead, 
  deal: Deal, 
  ticket: Ticket, 
  company: Company 
};
const stripHtml = (html = "") =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

exports.createEmail = async (req, res) => {
  try {
    const emailData = JSON.parse(req.body.data);
    const {
      subject,
      body,
      userId,
      recipients,
      cc,
      bcc,
      linkedTo,
      attachmentIds = []
    } = emailData;

    
    if (!subject || !body || !userId || !recipients || !linkedTo?.type || !linkedTo?.id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: subject, body, userId, recipients, linkedTo.type, linkedTo.id"
      });
    }

    
    const email = await emailRepository.create({
      subject,
     body: stripHtml(body),
      userId: parseInt(userId),
      recipients: Array.isArray(recipients) ? recipients : [],
      cc: Array.isArray(cc) ? cc : [],
      bcc: Array.isArray(bcc) ? bcc : [],
      linkedType: linkedTo.type,
      linkedId: linkedTo.id,
      sentAt: new Date()
    });

    let emailAttachments = []; 
    let newAttachmentsCount = 0;
    let linkedAttachmentsCount = 0;

    
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map((file) => ({
        filename: file.originalname,
        fileUrl: `/${file.path}`,
        uploadedById: parseInt(userId),
        emailId: email.id,
        linkedType: null,
        linkedId: null
      }));
      
      
      const createdAttachments = await Attachment.bulkCreate(newAttachments);
      
      
      createdAttachments.forEach(att => {
        emailAttachments.push({
          id: att.id,
          filename: att.filename,
          fileUrl: att.fileUrl,
          isNew: true
        });
      });
      
      newAttachmentsCount = req.files.length;
    }

    
    if (attachmentIds && attachmentIds.length > 0) {
      const attachmentIdArray = Array.isArray(attachmentIds) ? attachmentIds : [attachmentIds];
      
     
      const existingAttachments = await Promise.all(
        attachmentIdArray.map(id => attachmentRepository.getAttachmentById(id))
      );

      const validAttachments = existingAttachments.filter(Boolean);
      
      
      await Attachment.update(
        { 
          emailId: email.id
        }, 
        { 
          where: { 
            id: validAttachments.map(att => att.id) 
          } 
        }
      );

     
      validAttachments.forEach(att => {
        emailAttachments.push({
          id: att.id,
          filename: att.filename,
          fileUrl: att.fileUrl,
          isNew: false
        });
      });
      
      linkedAttachmentsCount = validAttachments.length;
    }

   
    let emailSent = false;
    let emailError = null;

    try {
      if (recipients && recipients.length > 0 && sendEmail) {
        console.log('📧 Sending email via Nodemailer...');
        
       
        const nodemailerAttachments = emailAttachments.map((attachment) => {
          let filePath = attachment.fileUrl;
          if (filePath.startsWith('/')) {
            filePath = filePath.substring(1);
          }
          
          const fullPath = path.resolve(__dirname, '../../', filePath);
          
          if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️ File not found: ${fullPath}`);
            return null;
          }
          
          return {
            filename: attachment.filename,
            path: fullPath
          };
        }).filter(Boolean);

        console.log(`📎 Attaching ${nodemailerAttachments.length} files to email`);

      
        await sendEmail({
          to: recipients.join(","),
          subject: subject,
          text: body,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>${subject}</h2>
                  <div>${body.replace(/\n/g, '<br>')}</div>
                 </div>`,
          attachments: nodemailerAttachments,
          cc: cc && cc.length > 0 ? cc.join(",") : undefined,
          bcc: bcc && bcc.length > 0 ? bcc.join(",") : undefined,
        });

        emailSent = true;
        console.log('✅ Email sent successfully via Nodemailer');
      }
    } catch (nodemailerError) {
      emailError = nodemailerError.message;
      console.error("❌ Error sending email via Nodemailer:", nodemailerError);
    }

  
    const fullEmail = await emailRepository.findById(email.id, {
      include: [
        { 
          model: User, 
          as: 'owner', 
          attributes: ['id', 'firstName', 'lastName', 'email'] 
        },
        {
          model: Attachment,
          as: 'attachments',
          include: [{
            model: User,
            as: 'uploadedBy',
            attributes: ['id', 'firstName', 'lastName']
          }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Email created and sent successfully",
      data: {
        email: fullEmail,
        emailDelivery: {
          sent: emailSent,
          error: emailError,
          recipients: recipients
        },
        attachmentsSummary: {
          newUploads: newAttachmentsCount,
          existingLinked: linkedAttachmentsCount,
          total: emailAttachments.length
        }
      }
    });
  } catch (error) {
    console.error("❌ Error creating email:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to create email",
      message: error.message 
    });
  }
};


exports.getEmails = async (req, res) => {
  try {
    const { page = 1, size = 10, search = '', linkedTo, type } = req.query;
    const offset = (page - 1) * size;
    const limit = parseInt(size);

    const where = {};
    if (search) where.subject = { [Op.like]: `%${search}%` };
    if (linkedTo) where.linkedId = linkedTo;
    if (type) where.linkedType = type;

    const emails = await emailRepository.findAll({
      where,
      include: [
        { 
          model: User, 
          as: 'owner', 
          attributes: ['id', 'firstName', 'lastName', 'email'] 
        },
        {
          model: Attachment,
          as: 'attachments',
          include: [{
            model: User,
            as: 'uploadedBy',
            attributes: ['id', 'firstName', 'lastName']
          }]
        }
      ],
      order: [['sentAt', 'DESC']],
      offset,
      limit
    });

    
    const emailsWithLinkedData = await Promise.all(
      emails.map(async (email) => {
        const Model = linkedModels[email.linkedType];
        let linked = null;
        
        if (Model && email.linkedId) {
          const attributes = ['id'];
          if (email.linkedType === 'lead') 
            attributes.push('firstName', 'lastName');
          else if (email.linkedType === 'deal') 
            attributes.push('dealName');
          else if (email.linkedType === 'ticket') 
            attributes.push('TicketName');
          else if (email.linkedType === 'company') 
            attributes.push('companyName');

          linked = await Model.findByPk(email.linkedId, { attributes });
        }

        return {
          id: email.id,
          subject: email.subject,
          body: email.body,
          recipients: email.recipients,
          cc: email.cc,
          bcc: email.bcc,
          attachments: email.attachments,
          linkedTo: linked ? {
            type: email.linkedType,
            id: linked.id,
            name: linked.firstName 
              ? `${linked.firstName} ${linked.lastName || ''}`.trim()
              : linked.dealName || linked.TicketName || linked.companyName || null
          } : null,
          owner: email.owner ? {
            id: email.owner.id,
            name: `${email.owner.firstName} ${email.owner.lastName}`,
            email: email.owner.email
          } : null,
          sentAt: email.sentAt,
          createdAt: email.createdAt,
          updatedAt: email.updatedAt
        };
      })
    );

    const totalCount = await emailRepository.count({ where });

   res.status(200).json({
  success: true,
  data: emailsWithLinkedData
});

  } catch (error) {
    console.error('❌ Error fetching emails:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch emails',
      message: error.message 
    });
  }
};


exports.getEmailById = async (req, res) => {
  try {
    const email = await emailRepository.findById(req.params.id, {
      include: [
        { 
          model: User, 
          as: 'owner', 
          attributes: ['id', 'firstName', 'lastName', 'email'] 
        },
        {
          model: Attachment,
          as: 'attachments',
          include: [{
            model: User,
            as: 'uploadedBy',
            attributes: ['id', 'firstName', 'lastName']
          }]
        }
      ]
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    const Model = linkedModels[email.linkedType];
    let linked = null;
    
    if (Model && email.linkedId) {
      const attributes = ['id'];
      if (email.linkedType === 'lead') 
        attributes.push('firstName', 'lastName');
      else if (email.linkedType === 'deal') 
        attributes.push('dealName');
      else if (email.linkedType === 'ticket') 
        attributes.push('TicketName');
      else if (email.linkedType === 'company') 
        attributes.push('companyName');

      linked = await Model.findByPk(email.linkedId, { attributes });
    }

    res.status(200).json({
      success: true,
      data: {
        id: email.id,
        subject: email.subject,
        body: email.body,
        recipients: email.recipients,
        cc: email.cc,
        bcc: email.bcc,
        attachments: email.attachments,
        linkedTo: linked ? {
          type: email.linkedType,
          id: linked.id,
          name: linked.firstName 
            ? `${linked.firstName} ${linked.lastName || ''}`.trim()
            : linked.dealName || linked.TicketName || linked.companyName || null
        } : null,
        owner: email.owner ? {
          id: email.owner.id,
          name: `${email.owner.firstName} ${email.owner.lastName}`,
          email: email.owner.email
        } : null,
        sentAt: email.sentAt,
        createdAt: email.createdAt,
        updatedAt: email.updatedAt,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
  } catch (error) {
    console.error('❌ Error fetching email:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch email',
      message: error.message 
    });
  }
};


exports.updateEmail = async (req, res) => {
  try {
   
    let emailData = {};

    if (req.body) {
      if (req.body.data) {
      
        try {
          emailData = JSON.parse(req.body.data);
        } catch (err) {
          console.error("Invalid JSON in req.body.data:", req.body.data);
          return res.status(400).json({
            success: false,
            error: "Invalid JSON format in request body",
          });
        }
      } else {
      
        emailData = req.body;
      }
    } else {
     
      return res.status(400).json({
        success: false,
        error: "Request body is empty",
      });
    }

    const { subject, body, recipients, cc, bcc, userId, linkedTo } = emailData;

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: subject and body",
      });
    }

    
    const existingEmail = await emailRepository.findById(req.params.id);
    if (!existingEmail) {
      return res.status(404).json({
        success: false,
        error: "Email not found",
      });
    }

    const updateData = {
      subject,
      body,
      recipients: Array.isArray(recipients) ? recipients : [],
      cc: Array.isArray(cc) ? cc : [],
      bcc: Array.isArray(bcc) ? bcc : [],
      userId,
      linkedType: linkedTo?.type,
      linkedId: linkedTo?.id,
      updatedAt: new Date(),
    };

    const updatedCount = await emailRepository.update(req.params.id, updateData);

    if (updatedCount === 0) {
      return res.status(400).json({
        success: false,
        error: "Email not updated or no changes made",
      });
    }

    const updatedEmail = await emailRepository.findById(req.params.id, {
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Attachment,
          as: "attachments",
          include: [
            {
              model: User,
              as: "uploadedBy",
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Email updated successfully",
      data: updatedEmail,
    });
  } catch (error) {
    console.error("❌ Error updating email:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update email",
      message: error.message,
    });
  }
};


exports.deleteEmail = async (req, res) => {
  try {
    
    const existingEmail = await emailRepository.findById(req.params.id);
    if (!existingEmail) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

  
    await Attachment.update(
      { 
        emailId: null
      }, 
      { 
        where: { 
          emailId: req.params.id
        } 
      }
    );

   
    const deletedCount = await emailRepository.delete(req.params.id);

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email deleted successfully',
      data: {
        deletedId: req.params.id,
        attachmentsUnlinked: true
      }
    });
  } catch (error) {
    console.error('❌ Error deleting email:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete email',
      message: error.message 
    });
  }
};


exports.uploadAttachments = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    
    const attachmentsData = req.files.map(file => ({
      filename: file.originalname,
      fileUrl: `/${file.path}`,
      uploadedById: parseInt(userId),
      emailId: null, 
      linkedType: null,
      linkedId: null
    }));

    const attachments = await Attachment.bulkCreate(attachmentsData);

  
    const fullAttachments = await Promise.all(
      attachments.map(att => attachmentRepository.getAttachmentById(att.id))
    );

    res.status(201).json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        attachments: fullAttachments.filter(Boolean).map(att => ({
          id: att.id,
          filename: att.filename,
          fileUrl: att.fileUrl,
          uploadedBy: att.uploadedBy,
          isAvailable: true,
          createdAt: att.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error uploading attachments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload files',
      message: error.message 
    });
  }
};


exports.getAvailableAttachments = async (req, res) => {
  try {
    const { search = '', userId, page = 1, size = 20 } = req.query;
    const offset = (page - 1) * size;
    const limit = parseInt(size);

    
    const where = {
      emailId: null
    };

    if (userId) {
      where.uploadedById = userId;
    }

    if (search) {
      where.filename = { [Op.like]: `%${search}%` };
    }

    const attachments = await Attachment.findAll({
      where,
      include: [{
        model: User,
        as: 'uploadedBy',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    const totalCount = await Attachment.count({ where });

    res.status(200).json({
      success: true,
      data: {
        attachments: attachments.map(att => ({
          id: att.id,
          filename: att.filename,
          fileUrl: att.fileUrl,
          fileSize: att.fileSize,
          uploadedBy: att.uploadedBy ? {
            id: att.uploadedBy.id,
            name: `${att.uploadedBy.firstName} ${att.uploadedBy.lastName}`,
            email: att.uploadedBy.email
          } : null,
          createdAt: att.createdAt,
          isAvailable: true
        }))
      },
      pagination: {
        page: parseInt(page),
        size: parseInt(size),
        total: totalCount,
        totalPages: Math.ceil(totalCount / size)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching available attachments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch available attachments',
      message: error.message 
    });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await attachmentRepository.getAttachmentById(id);
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found'
      });
    }

    
    if (attachment.emailId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete attachment linked to an email'
      });
    }

    await attachmentRepository.deleteAttachment(id);

    try {
      let filePath = attachment.fileUrl;
      if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
      }
      const fullPath = path.resolve(__dirname, '../../', filePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Deleted physical file: ${fullPath}`);
      }
    } catch (fileError) {
      console.warn('⚠️ Could not delete physical file:', fileError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
      data: {
        deletedId: id
      }
    });
  } catch (error) {
    console.error('❌ Error deleting attachment:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete attachment',
      message: error.message 
    });
  }
};

exports.getEmailStats = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.sentAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const totalEmails = await emailRepository.count({ where });
    
    const emailsWithAttachments = await emailRepository.count({
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

    const recentEmails = await emailRepository.findAll({
      where,
      order: [['sentAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'subject', 'sentAt']
    });

    res.status(200).json({
      success: true,
      data: {
        totalEmails,
        emailsWithAttachments,
        emailsWithoutAttachments: totalEmails - emailsWithAttachments,
        recentEmails
      }
    });
  } catch (error) {
    console.error('❌ Error fetching email statistics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch email statistics',
      message: error.message 
    });
  }
};