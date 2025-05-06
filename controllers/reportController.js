const reportService = require('../services/reportService');
const { validateDateRange } = require('../middleware/validation');
const { format } = require('date-fns');

/**
 * Get system-wide statistics (Super Admin only)
 */
const getSystemStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    validateDateRange(startDate, endDate);

    const stats = await reportService.getSystemStats({ startDate, endDate });
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get admin-level statistics
 */
const getAdminStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    validateDateRange(startDate, endDate);

    const stats = await reportService.getAdminStats(req.user._id, { startDate, endDate });
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get reseller-level statistics
 */
const getResellerStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    validateDateRange(startDate, endDate);

    const stats = await reportService.getResellerStats(req.user._id, { startDate, endDate });
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get user-level statistics
 */
const getUserStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    validateDateRange(startDate, endDate);

    const stats = await reportService.getUserStats(req.user._id, { startDate, endDate });
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get campaign report
 */
const getCampaignReport = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const report = await reportService.getCampaignReport(campaignId);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Export report to CSV
 */
const exportReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    validateDateRange(startDate, endDate);

    let data;
    switch (type) {
      case 'system':
        data = await reportService.getSystemStats({ startDate, endDate });
        break;
      case 'admin':
        data = await reportService.getAdminStats(req.user._id, { startDate, endDate });
        break;
      case 'reseller':
        data = await reportService.getResellerStats(req.user._id, { startDate, endDate });
        break;
      case 'user':
        data = await reportService.getUserStats(req.user._id, { startDate, endDate });
        break;
      default:
        throw new Error('Invalid report type');
    }

    const csvData = await reportService.exportReport(data, type);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    
    // Write headers
    res.write(csvData.headers.join(',') + '\n');
    
    // Write rows
    csvData.rows.forEach(row => {
      res.write(row.join(',') + '\n');
    });
    
    res.end();
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getSystemStats,
  getAdminStats,
  getResellerStats,
  getUserStats,
  getCampaignReport,
  exportReport
}; 