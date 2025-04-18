const express = require("express");
const router = express.Router();

// Import the credittype controller
const credittypeController = require("../controllers/credittypeController");

// Define a GET route to fetch all data from the credittype table
router.get("/getallcredittype", credittypeController.getAllCredittype);

module.exports = router;
