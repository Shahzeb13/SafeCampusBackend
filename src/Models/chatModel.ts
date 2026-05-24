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
  // SaaS multi-tenant
  organizationId: mongoose.Types.ObjectId; // TODO: backfill old chats via scripts/backfillOrganizationId.ts
  campusId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  messages: IMessage[];
  lastMessage: string;
  updatedAt: Date;
  createdAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    // SaaS multi-tenant
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    campusId: {
      type: Schema.Types.ObjectId,
      ref: 'campus',
      required: true,
      index: true,
    },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [messageSchema],
    lastMessage: { type: String },
  },
  { timestamps: true }
);

// Composite tenant-safe indexes
chatSchema.index({ organizationId: 1, campusId: 1 });
chatSchema.index({ participants: 1 });

const ChatModel: Model<IChat> = mongoose.model<IChat>('Chat', chatSchema);

export default ChatModel;


// Remember this
// Give me conversation where I am a participant.
// Then give me messages from that conversation.
