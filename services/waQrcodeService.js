const waapi = require("@api/waapi");

const getQRCode = async function (instanceId) {
  try {
    const Auth = process.env.WAAPI_KEY;
    waapi.auth(Auth); // Get a dynamic instance id, and convert it to a string if it's not already
    const response = await waapi.getInstancesIdClientQr({ id: instanceId });
    return response.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = {
  getQRCode,
};
