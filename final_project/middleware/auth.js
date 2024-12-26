const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1] || 
                req.cookies.token || 
                req.body.token;

  if (!token) {
    return res.status(403).json({ message: "A token is required for authentication" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = verifyToken; 