import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Message Sub-Schema
 */
interface IMessage {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  message: string;
  timestamp: Date;
}

const messageSchema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

/**
 * Chat Conversation Schema (General Collection)
 */
export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  messages: IMessage[]; // Sub-collection (nested array)
  lastMessage: string;
  updatedAt: Date;
  createdAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [messageSchema],
    lastMessage: { type: String },
  },
  { timestamps: true }
);

// Index for faster lookup of conversations by participants
chatSchema.index({ participants: 1 });

const ChatModel: Model<IChat> = mongoose.model<IChat>('Chat', chatSchema);

export default ChatModel;
