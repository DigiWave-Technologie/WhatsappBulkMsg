const express = require("express");
const router = express.Router();
const creditsController = require("../controllers/creditsController");
const { authenticateToken } = require("../middleware/auth");

// Protected routes with authentication middleware
router.post("/transfer", authenticateToken, creditsController.transferCredit);
router.post("/debit", authenticateToken, creditsController.debitCredit);
router.get("/balance/:userId", authenticateToken, creditsController.getUserCreditBalance);
router.get("/user/:userId", authenticateToken, creditsController.getUserCreditsByUserId);
router.get("/transactions", authenticateToken, creditsController.getCreditsTransaction);
router.get("/transactions/user/:userId", authenticateToken, creditsController.getCreditsTransactionByUserId);
router.get("/transactions/user/:userId/category/:categoryId", authenticateToken, creditsController.getCreditsTransactionByUserIdCategoryId);
router.get("/categories", authenticateToken, creditsController.getUserCategory);
router.post("/decrement", authenticateToken, creditsController.decrementCreditByUser);

// Credit usage statistics
router.get("/stats", authenticateToken, creditsController.getCreditUsageStats);

// Credit balance check
router.get("/check/:userId", authenticateToken, creditsController.checkUserCredits);

module.exports = router;
