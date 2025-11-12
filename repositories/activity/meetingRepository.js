const Meeting = require("../../models/activity/meeting");
const User = require("../../models/user");
const { Op } = require("sequelize");


const createMeeting = async (data) => {
  const meeting = await Meeting.create(data);

  if (data.organizerIds && data.organizerIds.length > 0) {
    await meeting.setOrganizers(data.organizerIds);
  }
  if (data.attendeeIds && data.attendeeIds.length > 0) {
    await meeting.setAttendees(data.attendeeIds);
  }

  return meeting;
};

const getMeetingById = async (id) => {
  const meeting = await Meeting.findOne({
    where: { id },
    include: [
      {
        model: User,
        as: "organizers",
        attributes: ["id", "firstName", "lastName"],
        through: { attributes: [] },
      },
      {
        model: User,
        as: "attendees",
        attributes: ["id", "firstName", "lastName"],
        through: { attributes: [] },
      },
    ],
  });

  if (!meeting) return null;

  const plain = meeting.get({ plain: true });

 
  const uniqueIds = new Set();
if (plain.organizers) plain.organizers.forEach((org) => uniqueIds.add(org.id));
if (plain.attendees) plain.attendees.forEach((att) => uniqueIds.add(att.id));

let totalcount = uniqueIds.size;
if (plain.linkedModuleId != null) totalcount += 1; 

plain.totalcount = totalcount;
return plain;
};


const getMeetings = async ({ linkedModule, linkedModuleId, search, page = 1, size = 10 }) => {
  const where = {};
  if (linkedModule) where.linkedModule = linkedModule;
  if (linkedModuleId) where.linkedModuleId = linkedModuleId;
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { note: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const limit = parseInt(size, 10);
  const offset = (page - 1) * limit;

  const result = await Meeting.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      { model: User, as: "organizers", attributes: ["id", "firstName", "lastName"], through: { attributes: [] } },
      { model: User, as: "attendees", attributes: ["id", "firstName", "lastName"], through: { attributes: [] } },
    ],
    order: [["createdAt", "DESC"]],
  });

  const rows = result.rows.map((meet) => {
    const plain = meet.get({ plain: true });
    const uniqueIds = new Set();
    if (plain.organizers) plain.organizers.forEach((org) => uniqueIds.add(org.id));
    if (plain.attendees) plain.attendees.forEach((att) => uniqueIds.add(att.id));
    if (plain.linkedModuleId != null) uniqueIds.add(plain.linkedModuleId);
    plain.totalcount = uniqueIds.size;
    return plain;
  });

  return {
    total: result.count,
    currentPage: page,
    totalPages: Math.ceil(result.count / limit),
    data: rows,
  };
};


const updateMeeting = async (id, data) => {
  const meeting = await Meeting.findByPk(id);
  if (!meeting) return null;

  await meeting.update(data);

  if (data.organizerIds && Array.isArray(data.organizerIds)) {
    await meeting.setOrganizers(data.organizerIds);
  }
  if (data.attendeeIds && Array.isArray(data.attendeeIds)) {
    await meeting.setAttendees(data.attendeeIds);
  }

  return meeting;
};


const deleteMeeting = async (id) => {
  const meeting = await Meeting.findByPk(id);
  if (!meeting) return null;
  await meeting.destroy();
  return true;
};

module.exports = {
  createMeeting,
  getMeetingById,
  getMeetings,
  updateMeeting,
  deleteMeeting,
};
