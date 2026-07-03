import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/token.js";
import { User } from "../models/User.js";

const authSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

function userPayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    language: user.language
  };
}

export const register = asyncHandler(async (req, res) => {
  const data = authSchema.extend({ name: z.string().min(2) }).parse(req.body);
  const exists = await User.findOne({ email: data.email });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const user = await User.create(data);
  res.status(201).json({ token: signToken(user), user: userPayload(user) });
});

export const login = asyncHandler(async (req, res) => {
  const data = authSchema.omit({ name: true }).parse(req.body);
  const user = await User.findOne({ email: data.email }).select("+password");
  if (!user || !(await user.comparePassword(data.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  res.json({ token: signToken(user), user: userPayload(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: userPayload(req.user) });
});
