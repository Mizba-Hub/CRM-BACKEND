const Meeting = require("../../models/activity/meeting");
const User = require("../../models/user");
const { Op } = require("sequelize");

const calculateTotalCount = (plain) => {
  const uniqueIds = new Set();
  if (plain.organizers)
    plain.organizers.forEach((org) => uniqueIds.add(org.id));
  if (plain.attendees) plain.attendees.forEach((att) => uniqueIds.add(att.id));
  if (plain.linkedModuleId != null) uniqueIds.add(plain.linkedModuleId);
  return uniqueIds.size;
};

const buildSubtitle = (plain) => {
  if (plain.organizers && plain.organizers.length > 0) {
    const organizerNames = plain.organizers
      .map((org) => `${org.firstName} ${org.lastName}`)
      .join(", ");
    return `Organized by ${organizerNames} on ${plain.startDate} ${plain.startTime}`;
  }
  return `Meeting on ${plain.startDate} ${plain.startTime}`;
};

const createMeeting = async (data) => {
  const meeting = await Meeting.create(data);

  if (data.organizerIds?.length > 0)
    await meeting.setOrganizers(data.organizerIds);
  if (data.attendeeIds?.length > 0)
    await meeting.setAttendees(data.attendeeIds);

  const fullMeeting = await Meeting.findByPk(meeting.id, {
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

  const plain = fullMeeting.get({ plain: true });

  if (plain.organizers)
    plain.organizers = plain.organizers.map(({ id, firstName, lastName }) => ({
      id,
      firstName,
      lastName,
    }));
  if (plain.attendees)
    plain.attendees = plain.attendees.map(({ id, firstName, lastName }) => ({
      id,
      firstName,
      lastName,
    }));

  const totalcount = calculateTotalCount(plain);
  await meeting.update({ totalcount });

  plain.totalcount = totalcount;
  plain.subtitle = buildSubtitle(plain);

  return plain;
};

const getMeetingById = async (id) => {
  const meeting = await Meeting.findByPk(id, {
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

  if (plain.organizers)
    plain.organizers = plain.organizers.map(({ id, firstName, lastName }) => ({
      id,
      firstName,
      lastName,
    }));
  if (plain.attendees)
    plain.attendees = plain.attendees.map(({ id, firstName, lastName }) => ({
      id,
      firstName,
      lastName,
    }));

  const totalcount = calculateTotalCount(plain);
  await meeting.update({ totalcount });

  plain.totalcount = totalcount;
  plain.subtitle = buildSubtitle(plain);

  return plain;
};

const getMeetings = async ({
  linkedModule,
  linkedModuleId,
  search,
  page = 1,
  size = 10,
}) => {
  const where = {};
  if (linkedModule) where.linkedModule = linkedModule;
  if (linkedModuleId) where.linkedModuleId = linkedModuleId;
  if (search)
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { note: { [Op.iLike]: `%${search}%` } },
    ];

  const limit = parseInt(size, 10);
  const offset = (page - 1) * limit;

  const result = await Meeting.findAndCountAll({
    where,
    limit,
    offset,
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
    order: [["createdAt", "DESC"]],
  });

  const rows = result.rows.map((meet) => {
    const plain = meet.get({ plain: true });

    if (plain.organizers)
      plain.organizers = plain.organizers.map(
        ({ id, firstName, lastName }) => ({ id, firstName, lastName })
      );
    if (plain.attendees)
      plain.attendees = plain.attendees.map(({ id, firstName, lastName }) => ({
        id,
        firstName,
        lastName,
      }));

    plain.totalcount = calculateTotalCount(plain);
    plain.subtitle = buildSubtitle(plain);

    return plain;
  });

  return {
    total: result.count,
    currentPage: page,
    totalPages: Math.ceil(result.count / limit),
    data: rows,
  };
};

const getMeetingsByUser = async (userId) => {
  const meetings = await Meeting.findAll({
    include: [
      {
        model: User,
        as: "organizers",
        attributes: ["id", "firstName", "lastName"],
        through: { attributes: [] },
        where: { id: userId },
        required: false,
      },
      {
        model: User,
        as: "attendees",
        attributes: ["id", "firstName", "lastName"],
        through: { attributes: [] },
        where: { id: userId },
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  const rows = meetings.map((meet) => {
    const plain = meet.get({ plain: true });

    if (plain.organizers)
      plain.organizers = plain.organizers.map(
        ({ id, firstName, lastName }) => ({ id, firstName, lastName })
      );
    if (plain.attendees)
      plain.attendees = plain.attendees.map(({ id, firstName, lastName }) => ({
        id,
        firstName,
        lastName,
      }));

    plain.totalcount = calculateTotalCount(plain);
    plain.subtitle = buildSubtitle(plain);

    return plain;
  });

  return rows.filter((m) => m.organizers.length > 0 || m.attendees.length > 0);
};

const updateMeeting = async (id, data) => {
  const meeting = await Meeting.findByPk(id);
  if (!meeting) return null;

  await meeting.update(data);
  if (data.organizerIds?.length > 0)
    await meeting.setOrganizers(data.organizerIds);
  if (data.attendeeIds?.length > 0)
    await meeting.setAttendees(data.attendeeIds);

  const fullMeeting = await Meeting.findByPk(id, {
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

  const plain = fullMeeting.get({ plain: true });

  if (plain.organizers)
    plain.organizers = plain.organizers.map(({ id, firstName, lastName }) => ({
      id,
      firstName,
      lastName,
    }));
  if (plain.attendees)
    plain.attendees = plain.attendees.map(({ id, firstName, lastName }) => ({
      id,
      firstName,
      lastName,
    }));

  const totalcount = calculateTotalCount(plain);
  await meeting.update({ totalcount });
  plain.totalcount = totalcount;
  plain.subtitle = buildSubtitle(plain);

  return plain;
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
  getMeetingsByUser,
  updateMeeting,
  deleteMeeting,
};
