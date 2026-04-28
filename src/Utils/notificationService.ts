import admin from "../Database/firebaseAdmin.js";
import UserModel from "../Models/userModel.js";

type NotificationPayload = {
    title: string;
    body: string;
    data?: Record<string, string>;
};

export const sendNotificationToUser = async (userId: string, payload: NotificationPayload) => {
    try {
        // 1. Get the user and their tokens
        const user = await UserModel.findById(userId);
        
        if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
            console.log(`ℹ️ No FCM tokens found for user: ${userId}`);
            return;
        }

        // 2. Prepare the message
        // We use sendEachForMulticast to send to all devices of the user
        const response = await admin.messaging().sendEachForMulticast({
            tokens: user.fcmTokens,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data,
            android: {
                priority: "high",
                notification: {
                    sound: "default",
                    channelId: "default",
                    priority: "max",
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                        contentAvailable: true,
                    },
                },
            },
        });

        console.log(`✅ Sent ${response.successCount} notifications to user ${userId}`);
        
        // 3. Clean up invalid tokens (optional but recommended)
        if (response.failureCount > 0) {
            const invalidTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const error = resp.error;
                    if (error?.code === 'messaging/invalid-registration-token' || 
                        error?.code === 'messaging/registration-token-not-registered') {
                        invalidTokens.push(user.fcmTokens[idx]);
                    }
                }
            });

            if (invalidTokens.length > 0) {
                user.fcmTokens = user.fcmTokens.filter(token => !invalidTokens.includes(token));
                await user.save();
                console.log(`🧹 Cleaned up ${invalidTokens.length} invalid tokens`);
            }
        }

    } catch (error: any) {
        console.error("❌ Error sending notification:", error.message);
    }
};

/**
 * Send notification to all users (Global Broadcast)
 */
export const broadcastNotification = async (payload: NotificationPayload) => {
    try {
        // This is a simplified version. For a real app with 10k+ users, 
        // you should use Firebase Topics instead.
        const users = await UserModel.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } });
        
        for (const user of users) {
            await sendNotificationToUser(user._id.toString(), payload);
        }
    } catch (error: any) {
        console.error("❌ Error broadcasting notification:", error.message);
    }
};
