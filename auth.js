const jwt = require('jsonwebtoken');
let secretkey = '6382';

const authenticateToken = (req, res, next) => {
    let jwtToken;
    const authHeader = req.headers["authorization"];
    if (authHeader !== undefined) {
      jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
      res.status(401);
      res.send("Invalid JWT Token");
    } else {
      jwt.verify(jwtToken, secretkey , (error, payload) => {
        if (error) {
          res.status(401);
          res.send("Invalid JWT Token");
        } else {
          req.username = payload.username;
          next();
        }
      });
    }
  };

  module.exports = authenticateToken;