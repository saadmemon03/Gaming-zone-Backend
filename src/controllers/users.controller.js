import User from "../models/User.model.js";
import bcrypt from "bcryptjs";

export const getUsers = async (req, res) => {
  try {
    const { search = "", role = "", page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];
    if (role)   filter.role = role;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, data: users, total, page: Number(page), limit: Number(limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createUser = async (req, res) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) return res.status(409).json({ success: false, message: "Email already in use" });
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateUser = async (req, res) => {
  try {
    if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return res.status(400).json({ success: false, message: "Name and contact number are required." });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "user", isActive: true },
      { $set: { name: name.trim(), phone: phone.trim() } },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "Active customer not found." });
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const archiveCustomer = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "user", isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "Active customer not found." });
    res.json({ success: true, message: "Customer archived successfully." });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
