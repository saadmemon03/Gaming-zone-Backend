import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    receiverId: { type: String, required: true }, // "admin" ya user ki ID
    roomId: { type: String, required: true, index: true },
    senderType: { type: String, enum: ["user", "admin"], required: true },
    text: { type: String, maxlength: 5000000 }, // badha diya taake base64 ya long URLs asaken
    fileData: { type: String }, // Base64 or URL
    fileName: { type: String },
    fileType: { type: String, enum: ["image", "document"] },
    isRead: { type: Boolean, default: false },
    isDeletedForEveryone: { type: Boolean, default: false },
    deletedForUser: { type: Boolean, default: false },
    deletedForAdmin: { type: Boolean, default: false },
    reaction: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
