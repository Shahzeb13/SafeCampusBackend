import EmergencyContactModel from './Models/emergencyContactModel.js';
import { logger } from './Utils/logger.js';

export const seedEmergencyContacts = async () => {
    try {
        const count = await EmergencyContactModel.countDocuments();
        if (count === 0) {
            logger.info("🌱 Seeding initial campus emergency contacts...");
            const defaultContacts = [
                {
                    name: "Campus Security Central",
                    phoneNumber: "051-1234567",
                    category: "security",
                    isPrimary: true
                },
                {
                    name: "University Ambulance Service",
                    phoneNumber: "051-9876543",
                    category: "ambulance",
                    isPrimary: true
                },
                {
                    name: "Main Fire Station",
                    phoneNumber: "1122",
                    category: "fire",
                    isPrimary: false
                },
                {
                    name: "Student Affairs Office",
                    phoneNumber: "051-5550199",
                    category: "admin",
                    isPrimary: false
                },
                {
                    name: "Hostel Warden Office",
                    phoneNumber: "051-4443322",
                    category: "hostel",
                    isPrimary: false
                }
            ];
            await EmergencyContactModel.insertMany(defaultContacts);
            logger.info("✅ Seeding complete!");
        }
    } catch (error: any) {
        logger.error("❌ Error seeding emergency contacts:", error.message);
    }
};
