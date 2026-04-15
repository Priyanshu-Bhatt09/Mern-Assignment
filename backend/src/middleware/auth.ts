import type { Request, Response, NextFunction } from "express"; //express types for ts only
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { UserRole } from "../models/User.js";

export interface AuthRequest extends Request { //using it bcz now req obj can have user like req.user
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

function isJwtPayload(value: string | JwtPayload): value is JwtPayload { //this fun is used bcz jwt.verify can return a string or a JwtPayLoad obj so it checks if it is an obj or not
  return typeof value === "object" && value !== null;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization; //gets auth header like - bearer <token>

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!secret) {
    return res.status(500).json({ error: "Missing JWT secret" });
  }

  try {
    const payload = jwt.verify(token, secret);

    if (!isJwtPayload(payload) || !payload.sub || !payload.email || !payload.role) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as UserRole,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: UserRole[]) { //creates a middleware that only allows users whose role is allowed in the list
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}
