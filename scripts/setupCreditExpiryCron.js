const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

// Schedule credit expiry check to run daily at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running credit expiry check...');
  
  // Get the absolute path to the checkCredits.js script
  const scriptPath = path.join(__dirname, 'checkCredits.js');
  
  // Execute the script
  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing credit expiry check: ${error}`);
      return;
    }
    
    console.log(`Credit expiry check output: ${stdout}`);
    
    if (stderr) {
      console.error(`Credit expiry check errors: ${stderr}`);
    }
  });
});

console.log('Credit expiry cron job scheduled to run daily at midnight'); 