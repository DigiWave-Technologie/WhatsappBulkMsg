const waapi = require("@api/waapi");
const Auth = process.env.WAAPI_KEY;
waapi.auth(Auth);

const getInstanceById = async function (QRInstanceid) {
  try {
    const response = await waapi.getInstancesIdClientMe({ id: QRInstanceid });
    console.log(response.data);
    return response.data;
  } catch (err) {
    console.error("Error fetching instance:", err);
    throw err;
  }
};
module.exports = {
  getInstanceById,
};
