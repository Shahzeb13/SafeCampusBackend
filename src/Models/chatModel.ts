import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConversation extends Document {
  organizationId: mongoose.Types.ObjectId;
  campusId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  lastMessage: mongoose.Types.ObjectId | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
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
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ organizationId: 1, campusId: 1 });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const ConversationModel: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', conversationSchema);

export const MessageModel: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);

export default ConversationModel;
