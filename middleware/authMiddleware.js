import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  let token;

  // Check Authorization Header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {

      // Get token
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Save user id into request
      req.user = decoded.id;

      next();

    } catch (error) {
      return res.status(401).json({
        message: "Invalid Token",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "No Token Provided",
    });
  }
};

export default protect;