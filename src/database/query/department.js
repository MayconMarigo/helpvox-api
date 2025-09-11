const { Department } = require("../../../models");
const { sequelize } = require("../database");

const getAllDepartmentsByCompanyId = async (companyId) => {
  const data = Department.findAll({
    where: { userId: companyId },
    attributes: ["name", "code"],
  });

  return data;
};

const createDepartment = async (payload, companyId) => {
  const { departmentName, departmentCode } = payload;

  const created = Department.findOrCreate({
    where: { name: departmentName, code: departmentCode },
    defaults: {
      id: crypto.randomUUID(),
      name: departmentName,
      code: departmentCode,
      userId: companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return created;
};

const bulkCreateDepartments = async (decodedBody, companyId) => {
  const departmentsList = decodedBody.map((department) => {
    return {
      ...department,
      name: department.departmentName,
      code: department.departmentCode,
      userId: companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const created = Department.bulkCreate(departmentsList);

  return created;
};

exports.departmentQueries = {
  getAllDepartmentsByCompanyId,
  createDepartment,
  bulkCreateDepartments,
};
