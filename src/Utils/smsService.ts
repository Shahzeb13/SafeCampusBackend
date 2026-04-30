import { logger } from './logger.js';

/**
 * Modular SMS Service
 * In a real production app, you would integrate Twilio, Vonage, or a local SMS gateway here.
 * For this implementation, we simulate the broadcast for debugging and safety verification.
 */
export const sendEmergencySMS = async (to: string, message: string) => {
    try {
        // Log the outgoing "SMS" for verification
        logger.info(`🚨 EMERGENCY BROADCAST to [${to}]: ${message}`);
        
        // This is where you'd call Twilio or another API:
        /*
        await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_NUMBER,
            to: to
        });
        */
        
        return { success: true, provider: 'Simulated Gateway' };
    } catch (error: any) {
        logger.error(`❌ SMS Broadcast failed for ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Broadcast SOS to multiple contacts
 */
export const broadcastEmergencyAlert = async (contacts: { name: string; phoneNumber: string }[], userName: string, location: { latitude: number; longitude: number }) => {
    const mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    const message = `🚨 EMERGENCY ALERT from ${userName}: I am in danger! My current location is: ${mapsLink}. Please help!`;

    const results = await Promise.all(
        contacts.map(contact => sendEmergencySMS(contact.phoneNumber, message))
    );

    return results;
};
