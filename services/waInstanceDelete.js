const waapi = require("@api/waapi");

const DeleteInstance = async function (instanceId) {
  try {
    const Auth = process.env.WAAPI_KEY;
    waapi.auth(Auth); // Get a dynamic instance id, and convert it to a string if it's not already
    const response = await waapi.postInstancesIdClientActionLogout({
      id: instanceId,
    });
    return response.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = {
  DeleteInstance,
};
