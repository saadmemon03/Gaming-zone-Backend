import { Router } from "express";
import Message from "../models/Message.model.js";
import User from "../models/User.model.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/history/:roomId", async (req, res) => {
  try {
    const isStaff = ["admin", "manager", "staff"].includes(req.user.role);
    const expectedRoomId = `room_${req.user._id}`;
    if (!isStaff && req.params.roomId !== expectedRoomId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const query = { roomId: req.params.roomId };
    if (req.user.role === "user") query.deletedForUser = { $ne: true };
    else query.deletedForAdmin = { $ne: true };

    const messages = await Message.find(query).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/admin/users", authorize("admin", "manager", "staff"), async (_req, res) => {
  try {
    const users = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$text" },
          fileName: { $first: "$fileName" },
          fileType: { $first: "$fileType" },
          lastTime: { $first: "$createdAt" },
          senderName: { $first: "$senderName" },
          senderId: { $first: "$senderId" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$isRead", false] }, { $eq: ["$senderType", "user"] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { lastTime: -1 } }
    ]);
    const userIds = users
      .map(({ _id }) => _id.startsWith("room_") ? _id.slice(5) : "")
      .filter((id) => /^[a-f\d]{24}$/i.test(id));
    const roomUsers = await User.find({ _id: { $in: userIds } }).select("name");
    const namesById = new Map(roomUsers.map((user) => [user._id.toString(), user.name]));
    res.json({
      success: true,
      users: users.map((room) => {
        const userId = room._id.startsWith("room_") ? room._id.slice(5) : "";
        return {
          ...room,
          senderId: userId,
          senderName: namesById.get(userId) || room.senderName || "Customer",
        };
      }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
});

router.post("/mark-read", async (req, res) => {
  try {
    const isStaff = ["admin", "manager", "staff"].includes(req.user.role);
    const expectedRoomId = `room_${req.user._id}`;
    const { roomId } = req.body;
    if (typeof roomId !== "string" || (!isStaff && roomId !== expectedRoomId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const senderType = isStaff ? "user" : "admin";
    await Message.updateMany(
      { roomId, senderType, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
