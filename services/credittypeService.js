const dbconnection = require("../config/database");

exports.getAllCredittype = () => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM credittype";
    dbconnection.query(query, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};
