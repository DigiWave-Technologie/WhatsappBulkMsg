const Credittype = require('../models/Credittype');

exports.getAllCredittype = async () => {
  try {
    const credittypes = await Credittype.find({});
    return credittypes;
  } catch (error) {
    console.error('Error fetching credittypes:', error);
    throw error;
  }
};
