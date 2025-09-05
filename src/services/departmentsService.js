const { departmentQueries } = require("../database/query/department");

const getAllDepartmentsByCompanyId = async (companyId) => {
  const departments = await departmentQueries.getAllDepartmentsByCompanyId(
    companyId
  );

  return departments;
};

const createDepartment = async (decodedBody, companyId) => {
  const created = departmentQueries.createDepartment(decodedBody, companyId);

  return created;
};

const bulkCreateDepartments = async (decodedBody, companyId) => {
  const created = await departmentQueries.bulkCreateDepartments(
    decodedBody,
    companyId
  );

  return created;
};

exports.departmentsService = {
  getAllDepartmentsByCompanyId,
  createDepartment,
  bulkCreateDepartments,
};
