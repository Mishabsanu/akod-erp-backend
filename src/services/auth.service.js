import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { createError } from "../utils/AppError.js";
import { User } from "../models/User.model.js";

export const register = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw createError("Email already exists", 400);

  if (!role) throw createError("Role is required", 400);

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  const populatedUser = await User.findById(user._id).populate("role");

  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  populatedUser.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date(),
  });

  await populatedUser.save();

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(populatedUser),
  };
};

export const login = async ({ email, password }) => {
  const identifier = email ? email.trim() : "";
  const queryConditions = [];

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  if (isEmail) {
    queryConditions.push({ email: identifier.toLowerCase() });
  } else {
    const digits = identifier.replace(/\D/g, "");
    if (digits.length > 0) {
      const suffix = digits.slice(-8);
      const regexString = suffix.split("").join("[\\s\\-()]*") + "$";
      queryConditions.push({ mobile: { $regex: regexString } });
    }
    queryConditions.push({ email: identifier.toLowerCase() });
  }

  const user = await User.findOne({ $or: queryConditions });
  if (!user) throw createError("Invalid credentials", 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw createError("Invalid credentials", 401);

  const populatedUser = await User.findById(user._id).populate("role");

  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  populatedUser.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date(),
  });

  await populatedUser.save();

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(populatedUser),
  };
};

export const refreshToken = async (token) => {
  const decoded = verifyRefreshToken(token);

  const user = await User.findById(decoded.id);
  if (!user) throw createError("User not found", 404);

  const isValid = user.refreshTokens.some((t) => t.token === token);
  if (!isValid) throw createError("Invalid refresh token", 403);

  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);

  return { accessToken };
};

export const logout = async (req, res, successResponse) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return successResponse(res, "Logged out", 200);

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.id);
  if (!user) throw createError("User not found", 404);

  user.refreshTokens = user.refreshTokens.filter(
    (t) => t.token !== refreshToken
  );

  await user.save();

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  return successResponse(res, "Logged out successfully", 200);
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});
