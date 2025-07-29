const substractDaysFromNewDate = (days = 0) =>
  new Date(new Date().setDate(new Date().getDate() - days))
    .toISOString()
    .split("T")[0];

const addDaysFromNewDate = (days = 0, newDate = new Date()) =>
  new Date(newDate.setDate(newDate.getDate() + days))
    .toISOString()
    .split("T")[0];

const today = () => new Date().toISOString().split("T")[0];

const addMinutes = (oldDate, minutes) =>
  new Date(oldDate.getTime() + minutes * 60000);

exports.dateUtils = {
  substractDaysFromNewDate,
  addDaysFromNewDate,
  today,
  addMinutes,
};
