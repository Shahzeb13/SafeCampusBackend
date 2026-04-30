export interface IUser {
    username: string;
    email: string;
    password: string;
    role: "student" | "staff" | "admin";
    avatar?: string | null;
    rollNumber?: string;
    universityName?: string;
    departmentName?: string;
    program?: string;
    semester?: string;
    section?: string;
    fcmTokens: string[];
    resetPasswordOTP?: string | null;
    resetPasswordOTPExpires?: Date | null;
    phoneNumber?: string;
    personalEmergencyContacts?: { name: string; phoneNumber: string }[];
    createdAt?: Date;
    updatedAt?: Date;
}




export interface UserRegistrationRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  avatar?: string | null;
  rollNumber?: string;
  universityName?: string;
  departmentName?: string;
  program?: string;
  semester?: string;
  section?: string;
}