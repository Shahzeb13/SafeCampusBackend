import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 465,
    secure: process.env.MAIL_ENCRYPTION === 'ssl', // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});

export const sendOTPEmail = async (email: string, otp: string) => {
    const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'SafeCampus Support'}" <${process.env.MAIL_FROM_ADDRESS}>`,
        to: email,
        subject: 'Password Reset OTP - SafeCampus',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #FF3B70; text-align: center;">SafeCampus Password Reset</h2>
                <p>Hello,</p>
                <p>You requested a password reset for your SafeCampus account. Please use the following One-Time Password (OTP) to reset your password:</p>
                <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 5px; margin: 20px 0;">
                    ${otp}
                </div>
                <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">SafeCampus - Your Campus Security Partner</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send OTP email');
    }
};
