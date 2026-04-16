import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../middleware/auth.js";
import { USER_ROLES, User, type UserRole } from "../models/User.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,20}$/;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT secret");
  }

  return secret;
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validatePassword(value: unknown) {
  return typeof value === "string" ? value : "";
}

function defaultUsernameFromEmail(email: string) {
  return email.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase() ?? "";
}

function buildUserPayload(user: {
  _id: { toString(): string };
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username ?? null,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const signJwt = (userId: string, email: string, role: UserRole) =>
  jwt.sign({ email, role }, getJwtSecret(), {
    subject: userId,
    expiresIn: "7d",
  });

export async function register(req: Request, res: Response) {
  try {
    const name = normalizeName(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = validatePassword(req.body.password);
    const usernameInput = normalizeUsername(req.body.username);
    const username = usernameInput || defaultUsernameFromEmail(email);

    if (name.length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters." });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    if (!USERNAME_PATTERN.test(username)) {
      return res
        .status(400)
        .json({ error: "Username must be 3-20 characters and use letters, numbers, dot, dash, or underscore." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ error: "A user with this email or username already exists." });
    }

    const user = new User({
      name,
      username,
      email,
      password,
      role: "User",
      status: "Active",
    });
    await user.save();

    const token = signJwt(user._id.toString(), user.email, user.role);

    return res.status(201).json({
      user: buildUserPayload(user),
      token,
    });
  } catch {
    return res.status(500).json({ error: "Registration failed." });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const identifier = normalizeUsername(req.body.identifier ?? req.body.email);
    const password = validatePassword(req.body.password);

    if (!identifier || !password) {
      return res.status(400).json({ error: "Email or username and password are required." });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ error: "This account is inactive. Please contact an administrator." });
    }

    const token = signJwt(user._id.toString(), user.email, user.role);

    return res.json({
      user: buildUserPayload(user),
      token,
    });
  } catch {
    return res.status(500).json({ error: "Login failed." });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.json(buildUserPayload(user));
  } catch {
    return res.status(500).json({ error: "Failed to load user." });
  }
}
