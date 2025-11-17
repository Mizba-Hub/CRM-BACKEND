const Note = require("../../models/activity/note");
const Email = require("../../models/activity/email");
const Call = require("../../models/activity/call");
const Task = require("../../models/activity/task");
const Meeting = require("../../models/activity/meeting");
const Attachment = require("../../models/activity/attachment");
const User = require("../../models/user");

module.exports.getActivitySummary = async ({
  linkedModule,
  linkedId,
  page,
  size,
  search,
  types,
}) => {
  const offset = (page - 1) * size;
  const results = [];

  const like = search ? { $like: `%${search}%` } : undefined;

  // ---------------------- NOTE ----------------------
  if (types.includes("note")) {
    const notes = await Note.findAll({
      where: {
        linkedType: linkedModule,
        linkedId,
        ...(search && { content: like }),
      },
      include: [{ model: User, as: "owner" }],
    });

    results.push(
      ...notes.map((n) => ({
        id: n.id,
        type: "note",
        content: n.content,
        owner: { id: n.owner.id, name: n.owner.name },
        linkedTo: { type: linkedModule, id: linkedId },
        createdAt: n.createdAt,
        timezone: "GMT+5:30",
      }))
    );
  }

  // ---------------------- EMAIL ----------------------
  if (types.includes("email")) {
    const emails = await Email.findAll({
      where: {
        linkedType: linkedModule,
        linkedId,
        ...(search && { subject: like }),
      },
      include: [{ model: User, as: "owner" }],
    });

    results.push(
      ...emails.map((e) => ({
        id: e.id,
        type: "email",
        subject: e.subject,
        body: e.body,
        recipients: e.recipients,
        cc: e.cc,
        bcc: e.bcc,
        owner: { id: e.owner?.id, name: e.owner?.name },
        linkedTo: { type: linkedModule, id: linkedId },
        sentAt: e.sentAt,
        timezone: "GMT+5:30",
      }))
    );
  }

  // ---------------------- CALL ----------------------
  if (types.includes("call")) {
    const calls = await Call.findAll({
      where: {
        targetType: linkedModule,
        targetId: linkedId,
      },
      include: [{ model: User, as: "User" }],
    });

    results.push(
      ...calls.map((c) => ({
        id: c.id,
        type: "call",
        result: c.result,
        user: { id: c.User.id, name: c.User.name },
        target: {
          type: linkedModule,
          id: linkedId,
          name: c.targetName,
          phoneNumber: c.targetPhone,
        },
        startedAt: c.startedAt,
        endedAt: c.endedAt,
        durationSeconds: c.durationSeconds,
      }))
    );
  }

  // ---------------------- TASK ----------------------
  if (types.includes("task")) {
    const tasks = await Task.findAll({
      where: {
        linkedModule,
        linkedModuleId: linkedId,
        ...(search && { taskName: like }),
      },
      include: [{ model: User, as: "assignedTo" }],
    });

    results.push(
      ...tasks.map((t) => ({
        id: t.id,
        type: "task",
        taskName: t.taskName,
        dueDate: t.dueDate,
        dueTime: t.dueTime,
        priority: t.priority,
        assignedTo: { id: t.assignedTo.id, name: t.assignedTo.name },
        note: t.note,
        status: t.status,
        linkedTo: { type: linkedModule, id: linkedId },
        createdAt: t.createdAt,
      }))
    );
  }

  // ---------------------- MEETING ----------------------
  if (types.includes("meeting")) {
    const meetings = await Meeting.findAll({
      where: {
        linkedModule,
        linkedModuleId: linkedId,
      },
    });

    results.push(
      ...meetings.map((m) => ({
        id: m.id,
        type: "meeting",
        title: m.title,
        startDate: m.startDate,
        startTime: m.startTime,
        endTime: m.endTime,
        duration: m.duration,
        location: m.location,
        reminder: m.reminder,
        note: m.note,
        organizer: null, // You did NOT include organizer relation
        attendeesCount: m.totalcount,
        linkedTo: { type: linkedModule, id: linkedId },
        createdAt: m.createdAt,
        timezone: m.timezone,
      }))
    );
  }

  // ---------------------- ATTACHMENT ----------------------
  if (types.includes("attachment")) {
    const att = await Attachment.findAll({
      where: {
        linkedType: linkedModule,
        linkedId,
      },
      include: [{ model: User, as: "uploadedBy" }],
    });

    results.push(
      ...att.map((a) => ({
        id: a.id,
        type: "attachment",
        filename: a.filename,
        url: a.fileUrl,
        uploadedBy: { id: a.uploadedBy?.id, name: a.uploadedBy?.name },
        linkedTo: { type: linkedModule, id: linkedId },
        createdAt: a.createdAt,
      }))
    );
  }

  // ---------------------- SORT + PAGINATE ----------------------
  const sorted = results.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return {
    total: sorted.length,
    activities: sorted.slice(offset, offset + size),
  };
};
