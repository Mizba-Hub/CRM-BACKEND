const Note = require("../../models/activity/note");

exports.findAll = (options) => {
  return Note.findAll(options);
};

exports.findById = (id, options) => {
  return Note.findByPk(id, options);
};

exports.create = (data) => {
  return Note.create(data);
};

exports.update = (id, data) => {
  return Note.update(data, { where: { id } });
};

exports.delete = (id) => {
  return Note.destroy({ where: { id } });
};
