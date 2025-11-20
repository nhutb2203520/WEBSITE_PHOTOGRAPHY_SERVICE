import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "MY_SECRET_KEY_DEFAULT";

export const verifyAdmin = (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Không có token" });

    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};
