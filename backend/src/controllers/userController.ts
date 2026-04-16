import type { Response } from "express";
import { Types } from "mongoose";
import { User, USER_ROLES, USER_STATUSES, type IUser, type UserRole, type UserStatus } from "../models/User.js";
import type { AuthRequest } from "../middleware/auth.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,20}$/;
const NAME_MIN_LENGTH = 2;
const PASSWORD_MIN_LENGTH = 6;

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePassword(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

function isStatus(value: unknown): value is UserStatus {
  return typeof value === "string" && USER_STATUSES.includes(value as UserStatus);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function defaultUsernameFromEmail(email: string) {
  return email.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase() ?? "";
}

function summarizeUser(user: {
  _id: { toString(): string };
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
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

function summarizeActor(
  user:
    | {
        _id: { toString(): string };
        name: string;
        username?: string;
        email: string;
        role: UserRole;
      }
    | null
    | undefined,
) {
  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username ?? null,
    email: user.email,
    role: user.role,
  };
}

async function ensureUniqueFields({
  email,
  username,
  excludeUserId,
}: {
  email?: string;
  username?: string;
  excludeUserId?: string;
}) {
  const conditions: Array<Record<string, unknown>> = [];

  if (email) {
    conditions.push({ email });
  }

  if (username) {
    conditions.push({ username });
  }

  if (conditions.length === 0) {
    return null;
  }

  const query: Record<string, unknown> = { $or: conditions }; //find a user where email or username matches

  if (excludeUserId) {
    query._id = { $ne: excludeUserId }; //ne - not equal
  }

  return User.findOne(query).lean(); //findone - return first matching user or null , lean - return plain js obj
}

function canManageUser(
  requester: NonNullable<AuthRequest["user"]>,
  target: Pick<IUser, "_id" | "role">,
) {
  const targetId = target._id.toString();

  if (requester.role === "Admin") {
    return true;
  }

  if (requester.role === "Manager") {
    return target.role !== "Admin" && targetId !== requester.id;
  }

  return false;
}

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    if (!req.user || !["Admin", "Manager"].includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden." });
    }

    const queryText = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const role = typeof req.query.role === "string" ? req.query.role : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(25, Math.max(1, Number.parseInt(String(req.query.limit ?? "8"), 10) || 8));

    const filter: Record<string, unknown> = {};

    if (queryText) {
      const regex = new RegExp(escapeRegex(queryText), "i");
      filter.$or = [{ name: regex }, { email: regex }, { username: regex }];
    }

    if (isRole(role)) {
      filter.role = role;
    }

    if (isStatus(status)) {
      filter.status = status;
    }

    if (req.user.role === "Manager") {
      filter.role = { ...(filter.role ? { $eq: filter.role } : {}), $ne: "Admin" };
    }

    const [totalItems, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.json({
      items: users.map(summarizeUser),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    });
  } catch {
    return res.status(500).json({ error: "Failed to load users." });
  }
}

export async function getMyProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findById(userId)
      .select("-password")
      .populate("createdBy", "name username email role")
      .populate("updatedBy", "name username email role");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.json({
      ...summarizeUser(user),
      createdBy: summarizeActor(user.createdBy as never),
      updatedBy: summarizeActor(user.updatedBy as never),
    });
  } catch {
    return res.status(500).json({ error: "Failed to load profile." });
  }
}

export async function getUserDetails(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("createdBy", "name username email role")
      .populate("updatedBy", "name username email role");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isSelf = user._id.toString() === req.user.id;
    const isAdmin = req.user.role === "Admin";
    const isManagerAllowed = req.user.role === "Manager" && user.role !== "Admin";

    if (!isSelf && !isAdmin && !isManagerAllowed) {
      return res.status(403).json({ error: "Forbidden." });
    }

    return res.json({
      ...summarizeUser(user),
      createdBy: summarizeActor(user.createdBy as never),
      updatedBy: summarizeActor(user.updatedBy as never),
    });
  } catch {
    return res.status(500).json({ error: "Failed to load user details." });
  }
}

export async function createUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({ error: "Forbidden." });
    }

    const name = normalizeName(req.body.name);
    const email = normalizeEmail(req.body.email);
    const usernameInput = normalizeUsername(req.body.username);
    const username = usernameInput || defaultUsernameFromEmail(email);
    const password = normalizePassword(req.body.password);
    const role = req.body.role;
    const status = req.body.status;

    if (name.length < NAME_MIN_LENGTH) {
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

    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    if (!isRole(role)) {
      return res.status(400).json({ error: "A valid role is required." });
    }

    if (!isStatus(status)) {
      return res.status(400).json({ error: "A valid status is required." });
    }

    const existingUser = await ensureUniqueFields({ email, username });
    if (existingUser) {
      return res.status(409).json({ error: "A user with this email or username already exists." });
    }

    const user = new User({
      name,
      username,
      email,
      password,
      role,
      status,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    await user.save();

    return res.status(201).json(summarizeUser(user));
  } catch {
    return res.status(500).json({ error: "Failed to create user." });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!canManageUser(req.user, user)) {
      return res.status(403).json({ error: "Forbidden." });
    }

    const name = req.body.name === undefined ? undefined : normalizeName(req.body.name);
    const email = req.body.email === undefined ? undefined : normalizeEmail(req.body.email);
    const username =
      req.body.username === undefined ? undefined : normalizeUsername(req.body.username) || defaultUsernameFromEmail(email ?? user.email);
    const password = req.body.password === undefined ? undefined : normalizePassword(req.body.password);
    const role = req.body.role;
    const status = req.body.status;

    if (name !== undefined) {
      if (name.length < NAME_MIN_LENGTH) {
        return res.status(400).json({ error: "Name must be at least 2 characters." });
      }
      user.name = name;
    }

    if (email !== undefined) {
      if (!EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ error: "A valid email is required." });
      }
      user.email = email;
    }

    if (username !== undefined) {
      if (!USERNAME_PATTERN.test(username)) {
        return res
          .status(400)
          .json({ error: "Username must be 3-20 characters and use letters, numbers, dot, dash, or underscore." });
      }
      user.username = username;
    }

    if (password !== undefined) {
      if (password && password.length < PASSWORD_MIN_LENGTH) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
      }

      if (password) {
        user.password = password;
      }
    }

    if (req.user.role === "Admin" && role !== undefined) {
      if (!isRole(role)) {
        return res.status(400).json({ error: "A valid role is required." });
      }

      user.role = role;
    }

    if (status !== undefined) {
      if (!isStatus(status)) {
        return res.status(400).json({ error: "A valid status is required." });
      }

      user.status = status;
    }

    const duplicateUser = await ensureUniqueFields({
      email: user.email,
      ...(user.username ? { username: user.username } : {}),
      excludeUserId: user._id.toString(),
    });

    if (duplicateUser) {
      return res.status(409).json({ error: "A user with this email or username already exists." });
    }

    user.updatedBy = new Types.ObjectId(req.user.id);
    await user.save();

    return res.json(summarizeUser(user));
  } catch {
    return res.status(500).json({ error: "Failed to update user." });
  }
}

export async function updateMyProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const name = req.body.name === undefined ? undefined : normalizeName(req.body.name);
    const username = req.body.username === undefined ? undefined : normalizeUsername(req.body.username);
    const password = req.body.password === undefined ? undefined : normalizePassword(req.body.password);

    if (name !== undefined) {
      if (name.length < NAME_MIN_LENGTH) {
        return res.status(400).json({ error: "Name must be at least 2 characters." });
      }

      user.name = name;
    }

    if (username !== undefined) {
      if (!USERNAME_PATTERN.test(username)) {
        return res
          .status(400)
          .json({ error: "Username must be 3-20 characters and use letters, numbers, dot, dash, or underscore." });
      }

      const duplicateUsername = await ensureUniqueFields({
        username,
        excludeUserId: user._id.toString(),
      });

      if (duplicateUsername) {
        return res.status(409).json({ error: "This username is already taken." });
      }

      user.username = username;
    }

    if (password !== undefined) {
      if (password.length < PASSWORD_MIN_LENGTH) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
      }

      user.password = password;
    }

    user.updatedBy = new Types.ObjectId(req.user.id);
    await user.save();

    return res.json(summarizeUser(user));
  } catch {
    return res.status(500).json({ error: "Failed to update profile." });
  }
}

export async function deactivateUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({ error: "Forbidden." });
    }

    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: "You cannot deactivate your own account." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.status = "Inactive";
    user.updatedBy = new Types.ObjectId(req.user.id);
    await user.save();

    return res.json({
      message: "User deactivated successfully.",
      user: summarizeUser(user),
    });
  } catch {
    return res.status(500).json({ error: "Failed to deactivate user." });
  }
}
