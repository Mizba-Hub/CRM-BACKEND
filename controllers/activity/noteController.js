const { Op } = require("sequelize");
const Note = require("../../models/activity/note");
const User = require("../../models/user");
const Lead = require("../../models/lead");
const Deal = require("../../models/deal");
const Ticket = require("../../models/ticket");
const Company = require("../../models/company");
const noteRepository = require("../../repositories/activity/noteRepository");

const linkedModels = {
  lead: Lead,
  deal: Deal,
  ticket: Ticket,
  company: Company,
};

exports.getNotes = async (req, res) => {
  try {
    const { page = 1, size = 10, search = "", linkedTo, type } = req.query;
    const offset = (page - 1) * size;
    const limit = parseInt(size);

    const where = {};
    
    if (search) where.content = { [Op.like]: `%${search}%` };
    
    if (linkedTo) where.linkedId = linkedTo;
    
  
    if (type) {
      where.linkedType = type;
    }

    const notes = await noteRepository.findAll({
      where,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });

    const results = await Promise.all(
      notes.map(async (note) => {
        const Model = linkedModels[note.linkedType];
        let linked = null;

        if (Model && note.linkedId) {
          const attributes = ["id"];
          if (note.linkedType === "lead")
            attributes.push("firstName", "lastName");
          else if (note.linkedType === "deal") attributes.push("dealName");
          else if (note.linkedType === "ticket") attributes.push("TicketName");
          else if (note.linkedType === "company")
            attributes.push("companyName");

          linked = await Model.findByPk(note.linkedId, { attributes });
        }

        return {
          id: note.id,
          content: note.content,
          linkedTo: linked
            ? {
                type: note.linkedType,
                id: linked.id,
                name:
                  linked.firstName
                    ? `${linked.firstName} ${linked.lastName || ""}`.trim()
                    : linked.dealName ||
                      linked.TicketName ||
                      linked.companyName ||
                      null,
              }
            : null,
          owner: note.owner
            ? {
                id: note.owner.id,
                name: `${note.owner.firstName} ${note.owner.lastName}`,
                email: note.owner.email,
              }
            : null,
          createdAt: note.createdAt,
        };
      })
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
};


exports.getNoteById = async (req, res) => {
  try {
    const note = await noteRepository.findById(req.params.id, {
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });

    if (!note) return res.status(404).json({ error: "Note not found" });

    const Model = linkedModels[note.linkedType];
    let linked = null;

    if (Model && note.linkedId) {
      const attributes = ["id"];
      if (note.linkedType === "lead")
        attributes.push("firstName", "lastName");
      else if (note.linkedType === "deal") attributes.push("dealName");
      else if (note.linkedType === "ticket") attributes.push("TicketName");
      else if (note.linkedType === "company")
        attributes.push("companyName");

      linked = await Model.findByPk(note.linkedId, { attributes });
    }

    res.status(200).json({
      id: note.id,
      content: note.content,
      linkedTo: linked
        ? {
            type: note.linkedType,
            id: linked.id,
            name:
              linked.firstName
                ? `${linked.firstName} ${linked.lastName || ""}`.trim()
                : linked.dealName ||
                  linked.TicketName ||
                  linked.companyName ||
                  null,
          }
        : null,
      owner: note.owner
        ? {
            id: note.owner.id,
            name: `${note.owner.firstName} ${note.owner.lastName}`,
            email: note.owner.email,
          }
        : null,
      createdAt: note.createdAt,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  } catch (error) {
    console.error("Error fetching note:", error);
    res.status(500).json({ error: "Failed to fetch note" });
  }
};


exports.createNote = async (req, res) => {
  try {
    const { content, userId, linkedTo } = req.body;
    const noteData = {
      content,
      userId,
      linkedType: linkedTo?.type,
      linkedId: linkedTo?.id,
    };

    const note = await noteRepository.create(noteData);
    res.status(201).json({ id: note.id, message: "Note created successfully" });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
};


exports.updateNote = async (req, res) => {
  try {
    const { content, userId, linkedTo } = req.body;
    const updateData = {
      content,
      userId,
      linkedType: linkedTo?.type,
      linkedId: linkedTo?.id,
    };

    await noteRepository.update(req.params.id, updateData);
    res.status(200).json({ message: "Note updated successfully" });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Failed to update note" });
  }
};


exports.deleteNote = async (req, res) => {
  try {
    await noteRepository.delete(req.params.id);
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
};