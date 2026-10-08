import jwt from "jsonwebtoken";
import Message from "../models/Message.model.js";
import User from "../models/User.model.js";

const rateLimits = new Map();

function isRateLimited(socketId) {
  const now = Date.now();
  const recent = (rateLimits.get(socketId) || []).filter((time) => now - time < 5000);
  if (recent.length >= 5) return true;
  recent.push(now);
  rateLimits.set(socketId, recent);
  return false;
}

export function initChatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user || !user.isActive) return next(new Error("Active user not found"));

      socket.user = user;
      socket.userId = user._id.toString();
      socket.role = user.role;
      socket.name = user.name;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const isStaff = ["admin", "manager", "staff"].includes(socket.role);
    const ownRoom = `room_${socket.userId}`;

    if (isStaff) {
      socket.join("admin_room");
    } else {
      socket.join(ownRoom);
      io.to("admin_room").emit("user_status", { userId: socket.userId, status: "online" });
    }

    const canAccessRoom = (roomId) =>
      isStaff
        ? typeof roomId === "string" && /^room_[a-f\d]{24}$/i.test(roomId)
        : roomId === ownRoom;

    socket.on("send_message", async (data = {}, callback) => {
      try {
        if (isRateLimited(socket.id)) {
          if (callback) callback({ error: "Too many messages. Please wait." });
          return;
        }

        const { receiverId, text, fileData, fileName, fileType } = data;
        if ((!text || typeof text !== "string" || !text.trim()) && !fileData) {
          if (callback) callback({ error: "Empty message not allowed." });
          return;
        }

        const validReceiver = isStaff
          ? typeof receiverId === "string" && /^[a-f\d]{24}$/i.test(receiverId)
          : receiverId === "admin";
        if (!validReceiver) {
          if (callback) callback({ error: "Invalid recipient." });
          return;
        }

        const roomId = isStaff ? `room_${receiverId}` : ownRoom;
        const message = await Message.create({
          senderId: socket.userId,
          senderName: socket.name,
          receiverId: isStaff ? receiverId : "admin",
          roomId,
          senderType: isStaff ? "admin" : "user",
          text: typeof text === "string" ? text.trim() : "",
          fileData,
          fileName,
          fileType,
          isRead: false,
        });

        io.to(roomId).emit("receive_message", message);
        if (!isStaff) io.to("admin_room").emit("admin_alert_new_message", message);
        if (callback) callback({ success: true, message });
      } catch (error) {
        console.error("Send message error:", error);
        if (callback) callback({ error: "Failed to send message." });
      }
    });

    socket.on("delete_message", async (data = {}, callback) => {
      try {
        const { messageId, type } = data;
        if (!["me", "everyone"].includes(type)) {
          if (callback) callback({ error: "Invalid delete option." });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message || !canAccessRoom(message.roomId)) {
          if (callback) callback({ error: "Message not found." });
          return;
        }
        if (
          type === "everyone" &&
          !isStaff &&
          (message.senderId !== socket.userId || message.senderType !== "user")
        ) {
          if (callback) callback({ error: "You can only delete your own messages for everyone." });
          return;
        }

        if (type === "everyone") {
          message.isDeletedForEveryone = true;
          message.text = "This message was deleted";
          message.fileData = null;
          message.fileName = null;
          message.fileType = null;
        } else if (isStaff) {
          message.deletedForAdmin = true;
        } else {
          message.deletedForUser = true;
        }

        await message.save();
        io.to(message.roomId).emit("message_deleted", {
          messageId,
          type,
          role: isStaff ? "admin" : "user",
          updatedMessage: message,
        });
        if (callback) callback({ success: true });
      } catch (error) {
        console.error("Delete message error:", error);
        if (callback) callback({ error: "Failed to delete message." });
      }
    });

    socket.on("react_message", async (data = {}, callback) => {
      try {
        const message = await Message.findById(data.messageId);
        if (!message || !canAccessRoom(message.roomId)) {
          if (callback) callback({ error: "Message not found." });
          return;
        }

        message.reaction = typeof data.reaction === "string" ? data.reaction.slice(0, 16) : "";
        await message.save();
        io.to(message.roomId).emit("message_reacted", {
          messageId: message._id,
          reaction: message.reaction,
        });
        if (callback) callback({ success: true });
      } catch (error) {
        console.error("React message error:", error);
        if (callback) callback({ error: "Failed to react to message." });
      }
    });

    socket.on("typing", ({ roomId, isTyping } = {}) => {
      if (canAccessRoom(roomId)) {
        socket.to(roomId).emit("user_typing", {
          isTyping: Boolean(isTyping),
          senderType: isStaff ? "admin" : "user",
        });
      }
    });

    socket.on("join_call_room", ({ roomId } = {}, callback) => {
      if (!isStaff || !canAccessRoom(roomId)) {
        if (callback) callback({ error: "Access denied." });
        return;
      }

      socket.join(roomId);
      if (callback) callback({ success: true });
    });

    socket.on("leave_call_room", ({ roomId } = {}) => {
      if (isStaff && canAccessRoom(roomId)) socket.leave(roomId);
    });

    socket.on("start_call", ({ roomId, callType } = {}, callback) => {
      if (!canAccessRoom(roomId)) {
        if (callback) callback({ error: "Access denied." });
        return;
      }

      const destination = isStaff ? roomId : "admin_room";
      socket.to(destination).emit("incoming_call", {
        callerId: socket.userId,
        callerName: socket.name,
        callType: callType === "video" ? "video" : "audio",
        roomId,
      });
      if (callback) callback({ success: true });
    });

    const callEvents = {
      accept_call: "call_accepted",
      reject_call: "call_rejected",
      end_call: "call_ended",
    };
    for (const [event, outgoingEvent] of Object.entries(callEvents)) {
      socket.on(event, ({ roomId } = {}) => {
        if (canAccessRoom(roomId)) socket.to(roomId).emit(outgoingEvent);
      });
    }

    for (const event of ["webrtc_offer", "webrtc_answer", "webrtc_ice_candidate"]) {
      socket.on(event, ({ roomId, sdp, candidate } = {}) => {
        if (!canAccessRoom(roomId)) return;
        socket.to(roomId).emit(event, event === "webrtc_ice_candidate" ? candidate : sdp);
      });
    }

    socket.on("disconnect", () => {
      rateLimits.delete(socket.id);
      if (!isStaff) {
        io.to("admin_room").emit("user_status", { userId: socket.userId, status: "offline" });
      }
    });
  });
}
