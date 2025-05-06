const credittypeService = require("../services/credittypeService");

exports.getAllCredittype = async (req, res) => {
  try {
    const data = await credittypeService.getAllCredittype();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
