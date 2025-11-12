const meetingRepo = require("../../repositories/activity/meetingRepository");


const calculateDuration = (start, end) => {
  if (!start || !end) return "-";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  if (diff === 0) return "0 mins";
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hrs === 0) return `${mins} mins`;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${hrs} hr${hrs > 1 ? "s" : ""} ${mins} mins`;
};


const createMeeting = async (req, res) => {
  try {
    const {
      title, startDate, startTime, endTime, location, reminder, note,
      organizerId, organizerIds, attendeeIds, linkedModule, linkedModuleId
    } = req.body;

    
    let orgIds = [];
    if (Array.isArray(organizerIds)) orgIds = organizerIds;
    else if (organizerId != null) orgIds = [organizerId];

    if (!title || !startDate || !startTime || !linkedModule || orgIds.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const data = {
      title, startDate, startTime, endTime, location, reminder, note,
      linkedModule, linkedModuleId,
      duration: calculateDuration(startTime, endTime),
      organizerIds: orgIds,
      attendeeIds: Array.isArray(attendeeIds) ? attendeeIds : [],
    };

    const meeting = await meetingRepo.createMeeting(data);
    const result = await meetingRepo.getMeetingById(meeting.id);
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};


const getMeetings = async (req, res) => {
  try {
    const { linkedModule, linkedModuleId, search, page, size } = req.query;
    const result = await meetingRepo.getMeetings({ linkedModule, linkedModuleId, search, page, size });
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};


const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await meetingRepo.getMeetingById(id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    return res.json(meeting);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};


const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizerId, organizerIds, attendeeIds, ...otherData } = req.body;

    let orgIds = [];
    if (Array.isArray(organizerIds)) orgIds = organizerIds;
    else if (organizerId != null) orgIds = [organizerId];

    const updateData = { ...otherData };
    if (orgIds.length > 0) updateData.organizerIds = orgIds;
    if (updateData.startTime && updateData.endTime) {
      updateData.duration = calculateDuration(updateData.startTime, updateData.endTime);
    }
    if (Array.isArray(attendeeIds)) updateData.attendeeIds = attendeeIds;

    const updatedMeeting = await meetingRepo.updateMeeting(id, updateData);
    if (!updatedMeeting) return res.status(404).json({ message: "Meeting not found" });

    const result = await meetingRepo.getMeetingById(updatedMeeting.id);
    return res.json({ message: "Meeting updated successfully", data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};


const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await meetingRepo.deleteMeeting(id);
    if (!deleted) return res.status(404).json({ message: "Meeting not found" });
    return res.json({ success: true, message: "Meeting deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting
};
