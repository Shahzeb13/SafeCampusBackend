import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ─────────────────────────────────────────────
// Custom Error Class
// ─────────────────────────────────────────────
export class EmailError extends Error {
    public readonly code: string;
    public readonly recipient?: string;
    public readonly emailType?: string;

    constructor(message: string, code: string, recipient?: string, emailType?: string) {
        super(message);
        this.name = 'EmailError';
        this.code = code;
        this.recipient = recipient;
        this.emailType = emailType;
    }
}

// ─────────────────────────────────────────────
// Env-var Validation
// ─────────────────────────────────────────────
const REQUIRED_MAIL_VARS = [
    'MAIL_HOST',
    'MAIL_USERNAME',
    'MAIL_PASSWORD',
    'MAIL_FROM_ADDRESS',
] as const;

function validateMailConfig(): void {
    const missing = REQUIRED_MAIL_VARS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(
            `❌ [EmailService] Missing required environment variables: ${missing.join(', ')}. Emails will NOT be sent.`
        );
    }
}

validateMailConfig();

// ─────────────────────────────────────────────
// SMTP Error Classifier
// ─────────────────────────────────────────────
function classifyMailError(error: unknown, recipient?: string, emailType?: string): EmailError {
    const err = error as Record<string, unknown>;
    const code = (err?.code as string) ?? 'UNKNOWN';
    const responseCode = (err?.responseCode as number) ?? 0;
    const command = (err?.command as string) ?? '';

    let message: string;

    // Auth failures
    if (code === 'EAUTH' || responseCode === 535 || responseCode === 534 || responseCode === 530) {
        message = `SMTP authentication failed for user "${process.env.MAIL_USERNAME}". Check MAIL_USERNAME and MAIL_PASSWORD in your .env file.`;
    }
    // DNS / hostname resolution
    else if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
        message = `Cannot resolve SMTP host "${process.env.MAIL_HOST}". Check MAIL_HOST in your .env file.`;
    }
    // Connection refused / port issue
    else if (code === 'ECONNREFUSED') {
        message = `Connection refused by SMTP server at ${process.env.MAIL_HOST}:${process.env.MAIL_PORT}. Check MAIL_PORT and MAIL_ENCRYPTION.`;
    }
    // Connection reset
    else if (code === 'ECONNRESET') {
        message = `SMTP connection was reset by the server. This may be a TLS/SSL mismatch. Check MAIL_ENCRYPTION setting.`;
    }
    // Timeout
    else if (code === 'ETIMEDOUT' || code === 'ESOCKET') {
        message = `SMTP connection timed out while connecting to ${process.env.MAIL_HOST}. Server may be unreachable.`;
    }
    // Sender rejected (554, 553)
    else if (responseCode === 554 || responseCode === 553) {
        message = `Sender address "${process.env.MAIL_FROM_ADDRESS}" was rejected by the SMTP server. Ensure it matches MAIL_USERNAME.`;
    }
    // Recipient rejected (550, 551, 552)
    else if (responseCode >= 550 && responseCode <= 552) {
        message = `Recipient address "${recipient}" was rejected by the SMTP server. The address may not exist.`;
    }
    // Rate limiting (421, 450)
    else if (responseCode === 421 || responseCode === 450) {
        message = `SMTP server is temporarily unavailable or rate-limiting requests. Try again later.`;
    }
    // TLS required
    else if (command === 'STARTTLS' || responseCode === 538) {
        message = `SMTP server requires TLS encryption. Set MAIL_ENCRYPTION=tls and MAIL_PORT=587 in your .env file.`;
    }
    // Generic SMTP error with response code
    else if (responseCode > 0) {
        message = `SMTP error ${responseCode}: ${(err?.response as string) ?? 'No additional details provided.'}`.trim();
    }
    // Fallback
    else {
        message = (err?.message as string) ?? 'An unknown email error occurred.';
    }

    return new EmailError(message, code, recipient, emailType);
}

// ─────────────────────────────────────────────
// Transporter
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 465,
    secure: process.env.MAIL_ENCRYPTION === 'ssl', // true for port 465, false for 587 (STARTTLS)
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
    // Retry on transient failures
    pool: true,
    maxConnections: 3,
    socketTimeout: 15000, // 15 seconds
    connectionTimeout: 10000, // 10 seconds
});

// Verify SMTP connection on startup (non-blocking, with retries)
const MAX_SMTP_ATTEMPTS = 4;
const SMTP_RETRY_DELAY_MS = 5000;

function verifySMTPConnection(attemptsLeft: number = MAX_SMTP_ATTEMPTS): void {
    transporter.verify((error) => {
        if (error) {
            const classified = classifyMailError(error);
            const currentAttempt = MAX_SMTP_ATTEMPTS - attemptsLeft + 1;
            console.error(`❌ [EmailService] SMTP connection verification attempt ${currentAttempt}/${MAX_SMTP_ATTEMPTS} failed — ${classified.message}`);
            
            if (attemptsLeft > 1) {
                console.log(`⏳ [EmailService] Retrying SMTP connection in ${SMTP_RETRY_DELAY_MS / 1000}s...`);
                setTimeout(() => verifySMTPConnection(attemptsLeft - 1), SMTP_RETRY_DELAY_MS);
            } else {
                console.error(`❌ [EmailService] SMTP connection verification failed after ${MAX_SMTP_ATTEMPTS} attempts.`);
            }
        } else {
            console.log(`✅ [EmailService] SMTP connection verified. Ready to send emails via ${process.env.MAIL_HOST}.`);
        }
    });
}

verifySMTPConnection();


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
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [EmailService] OTP email sent to ${email} (messageId: ${info.messageId})`);
    } catch (error) {
        const classified = classifyMailError(error, email, 'OTP');
        console.error(`❌ [EmailService] Failed to send OTP email to ${email} — [${classified.code}] ${classified.message}`);
        // Re-throw for OTP since the caller (forgotPassword) depends on delivery
        throw classified;
    }
};
export const sendWelcomeEmail = async (email: string, username: string, role: string = 'student') => {
    const isSecurity = role === 'security_personnel';
    
    const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'SafeCampus Support'}" <${process.env.MAIL_FROM_ADDRESS}>`,
        to: email,
        subject: isSecurity ? 'Mission Briefing: Welcome to the Security Team! 🛡️' : 'Welcome to SafeCampus! 🛡️',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: ${isSecurity ? '#1A237E' : '#FF3B70'}; padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">
                        ${isSecurity ? 'Security Personnel Portal' : 'Welcome to SafeCampus'}
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">
                        ${isSecurity ? 'Official Duty Onboarding' : 'Your Safety, Our Priority'}
                    </p>
                </div>
                <div style="padding: 30px; line-height: 1.6; color: #333333;">
                    <h2 style="color: #1A237E; margin-bottom: 20px;">Hi ${username},</h2>
                    <p>
                        ${isSecurity 
                            ? "Welcome to the SafeCampus Security Force. Your role is critical in maintaining the safety and integrity of our campus community. You have been granted access to the Security Dashboard." 
                            : "We're thrilled to have you join the SafeCampus community! You've taken a significant step toward a safer and more secure campus experience."
                        }
                    </p>
                    
                    <div style="background-color: #f8f9fa; border-left: 4px solid ${isSecurity ? '#1A237E' : '#FF3B70'}; padding: 20px; margin: 25px 0; border-radius: 4px;">
                        <h3 style="margin-top: 0; color: ${isSecurity ? '#1A237E' : '#FF3B70'}; font-size: 18px;">
                            ${isSecurity ? 'Your Responsibilities:' : 'Quick Start Guide:'}
                        </h3>
                        <ul style="padding-left: 20px; margin-bottom: 0;">
                            ${isSecurity ? `
                                <li><strong>Monitor Dashboard:</strong> Keep an eye on incoming incidents assigned by Admin.</li>
                                <li><strong>Swift Response:</strong> Update your status to 'Responding' as soon as you head to an incident.</li>
                                <li><strong>Duty Status:</strong> Keep your status updated so Admin knows your availability.</li>
                                <li><strong>Evidence Review:</strong> Use the app to view images/videos reported by students.</li>
                            ` : `
                                <li><strong>Setup SOS:</strong> Configure your personal emergency contacts in the app.</li>
                                <li><strong>Shake to Trigger:</strong> Remember, you can shake your phone in emergencies to alert security.</li>
                                <li><strong>Report Incidents:</strong> Use the Report feature to notify us of any suspicious activity.</li>
                            `}
                        </ul>
                    </div>
                    
                    <p>If you have any questions or need assistance, our support team is always here to help.</p>
                    
                    <div style="text-align: center; margin-top: 40px;">
                        <a href="#" style="background-color: ${isSecurity ? '#1A237E' : '#FF3B70'}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">
                            ${isSecurity ? 'Access Guard Dashboard' : 'Get Started Now'}
                        </a>
                    </div>
                </div>
                <div style="background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #777;">
                    <p>© 2026 SafeCampus Inc. | Your University Security Partner</p>
                    <p>Protecting what matters most.</p>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [EmailService] Welcome email (${role}) sent to ${email} (messageId: ${info.messageId})`);
    } catch (error) {
        const classified = classifyMailError(error, email, 'Welcome');
        // Non-critical — log but do not throw (registration already succeeded)
        console.error(`❌ [EmailService] Failed to send welcome email to ${email} — [${classified.code}] ${classified.message}`);
    }
};
export const sendAssignmentEmail = async (
    recipientEmail: string, 
    recipientName: string, 
    incidentData: { id: string; title: string; type: string; location: string; description: string; reporterName?: string },
    isGuard: boolean = true
) => {
    const subject = isGuard 
        ? `🚨 MISSION ASSIGNED: ${incidentData.title} 🛡️` 
        : `🛡️ Security Dispatched: Help is on the way!`;

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background-color: ${isGuard ? '#1e1b24' : '#6366f1'}; padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">
                    ${isGuard ? 'URGENT ASSIGNMENT' : 'SECURITY DISPATCHED'}
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">
                    ${isGuard ? 'Immediate Response Required' : 'Campus Security is heading to your location'}
                </p>
            </div>
            
            <div style="padding: 30px; line-height: 1.6; color: #333333;">
                <h2 style="color: #1e1b24; margin-bottom: 20px;">Hello ${recipientName},</h2>
                
                <p style="font-size: 16px;">
                    ${isGuard 
                        ? `You have been officially assigned to handle a new incident on campus. Please proceed to the location immediately.` 
                        : `Good news! Our security team has assigned a guard to assist with your report. Help will be with you shortly.`
                    }
                </p>

                <div style="background-color: #f8f9fa; border-left: 4px solid ${isGuard ? '#ef4444' : '#6366f1'}; padding: 25px; margin: 25px 0; border-radius: 8px;">
                    <h3 style="margin-top: 0; color: #1e1b24; font-size: 18px; text-transform: uppercase;">Incident Dossier</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Title:</strong></td>
                            <td style="padding: 8px 0;">${incidentData.title}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Type:</strong></td>
                            <td style="padding: 8px 0;"><span style="background: #eee; padding: 2px 8px; border-radius: 4px;">${incidentData.type.replace(/_/g, ' ')}</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
                            <td style="padding: 8px 0; color: #6366f1; font-weight: bold;">📍 ${incidentData.location}</td>
                        </tr>
                        ${isGuard ? `
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Reporter:</strong></td>
                            <td style="padding: 8px 0;">${incidentData.reporterName || 'Anonymous Student'}</td>
                        </tr>
                        ` : ''}
                    </table>
                    
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <strong style="color: #666; display: block; margin-bottom: 5px;">Description:</strong>
                        <p style="margin: 0; font-style: italic; color: #444;">"${incidentData.description}"</p>
                    </div>
                </div>

                ${isGuard ? `
                <div style="text-align: center; margin-top: 40px;">
                    <p style="color: #ef4444; font-weight: bold; margin-bottom: 20px;">⚠️ Protocol: Open your Guard Dashboard to start response tracking.</p>
                    <a href="https://safecampus.app/dashboard" style="background-color: #1e1b24; color: #ffffff; padding: 16px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        START RESPONSE
                    </a>
                </div>
                ` : `
                <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                    Stay calm and stay in a safe location if possible. Security personnel are on their way.
                </p>
                `}
            </div>

            <div style="background-color: #f1f1f1; padding: 25px; text-align: center; font-size: 12px; color: #777;">
                <p><strong>SafeCampus Emergency Response System</strong></p>
                <p>© 2026 SafeCampus Inc. | Protecting what matters most.</p>
                <p style="margin-top: 10px; color: #999;">This is an automated security dispatch. Do not reply to this email.</p>
            </div>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'SafeCampus Security'}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: recipientEmail,
            subject: subject,
            html: htmlContent,
        });
        console.log(`✅ [EmailService] Assignment email sent to ${recipientEmail} (messageId: ${info.messageId})`);
    } catch (error) {
        const classified = classifyMailError(error, recipientEmail, 'Assignment');
        // Non-critical — assignment is still saved in DB even if email fails
        console.error(`❌ [EmailService] Failed to send assignment email to ${recipientEmail} — [${classified.code}] ${classified.message}`);
    }
};

export const sendSOSAssignmentEmail = async (
    recipientEmail: string, 
    recipientName: string, 
    sosData: { id: string; user: string; location: string; status: string },
    isGuard: boolean = true
) => {
    const subject = isGuard 
        ? `🚨 EMERGENCY DISPATCH: SOS from ${sosData.user} 🛡️` 
        : `🛡️ SOS Update: Help is on the way!`;

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #ef4444; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 15px rgba(239,68,68,0.1);">
            <div style="background-color: #ef4444; padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">
                    ${isGuard ? 'EMERGENCY DISPATCH' : 'SOS RESPONSE ACTIVE'}
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">
                    ${isGuard ? 'Immediate SOS Intervention Required' : 'Campus Security is responding to your SOS signal'}
                </p>
            </div>
            
            <div style="padding: 30px; line-height: 1.6; color: #333333;">
                <h2 style="color: #1e1b24; margin-bottom: 20px;">Hello ${recipientName},</h2>
                
                <p style="font-size: 16px; font-weight: bold; color: #ef4444;">
                    ${isGuard 
                        ? `A high-priority SOS alert has been assigned to you. Every second counts. Proceed to the coordinates now.` 
                        : `Campus Security has assigned a guard to your SOS alert. Emergency personnel are heading to your location.`
                    }
                </p>

                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 25px; margin: 25px 0; border-radius: 8px;">
                    <h3 style="margin-top: 0; color: #1e1b24; font-size: 18px; text-transform: uppercase;">SOS Telemetry</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Signal From:</strong></td>
                            <td style="padding: 8px 0;"><strong>${sosData.user}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Last Location:</strong></td>
                            <td style="padding: 8px 0; color: #ef4444; font-weight: bold;">📍 ${sosData.location}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Alert ID:</strong></td>
                            <td style="padding: 8px 0;">${sosData.id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Status:</strong></td>
                            <td style="padding: 8px 0;"><span style="background: #ef4444; color: #fff; padding: 2px 8px; border-radius: 4px;">${sosData.status.toUpperCase()}</span></td>
                        </tr>
                    </table>
                </div>

                ${isGuard ? `
                <div style="text-align: center; margin-top: 40px;">
                    <p style="color: #ef4444; font-weight: bold; margin-bottom: 20px;">⚠️ Respond immediately via the Security App.</p>
                    <a href="https://safecampus.app/sos-dashboard" style="background-color: #ef4444; color: #ffffff; padding: 16px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(239,68,68,0.3);">
                        VIEW SOS LOCATION
                    </a>
                </div>
                ` : `
                <p style="text-align: center; color: #ef4444; font-weight: bold; font-size: 16px; margin-top: 30px;">
                    HELP IS ON THE WAY. STAY WHERE YOU ARE.
                </p>
                `}
            </div>

            <div style="background-color: #f1f1f1; padding: 25px; text-align: center; font-size: 12px; color: #777;">
                <p><strong>SafeCampus Emergency Response System</strong></p>
                <p>© 2026 SafeCampus Inc. | Protecting what matters most.</p>
            </div>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'SafeCampus Emergency'}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: recipientEmail,
            subject: subject,
            html: htmlContent,
        });
        console.log(`✅ [EmailService] SOS assignment email sent to ${recipientEmail} (messageId: ${info.messageId})`);
    } catch (error) {
        const classified = classifyMailError(error, recipientEmail, 'SOS Assignment');
        // Non-critical — SOS is still active in DB even if notification email fails
        console.error(`❌ [EmailService] Failed to send SOS assignment email to ${recipientEmail} — [${classified.code}] ${classified.message}`);
    }
};

export const sendRejectionEmail = async (
    recipientEmail: string, 
    recipientName: string, 
    itemData: { title: string; type: string; reason?: string },
    isSOS: boolean = false
) => {
    const subject = isSOS 
        ? `⚠️ SOS Alert Update: Declined` 
        : `⚠️ Incident Report Update: Declined`;

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background-color: #374151; padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">
                    ${isSOS ? 'SOS ALERT DECLINED' : 'INCIDENT DECLINED'}
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">
                    Review complete by Campus Administration
                </p>
            </div>
            
            <div style="padding: 30px; line-height: 1.6; color: #333333;">
                <h2 style="color: #111827; margin-bottom: 20px;">Hello ${recipientName},</h2>
                
                <p style="font-size: 16px;">
                    Your ${isSOS ? 'SOS alert' : 'incident report'} has been reviewed by our administration team. At this time, we have decided to decline/reject this request.
                </p>

                <div style="background-color: #f9fafb; border-left: 4px solid #374151; padding: 25px; margin: 25px 0; border-radius: 8px;">
                    <h3 style="margin-top: 0; color: #111827; font-size: 18px; text-transform: uppercase;">Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Title/Type:</strong></td>
                            <td style="padding: 8px 0;">${itemData.title || itemData.type.replace(/_/g, ' ')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280;"><strong>Status:</strong></td>
                            <td style="padding: 8px 0;"><span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-weight: bold;">REJECTED</span></td>
                        </tr>
                    </table>
                    
                    ${itemData.reason ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                        <strong style="color: #6b7280; display: block; margin-bottom: 5px;">Reason for Rejection:</strong>
                        <p style="margin: 0; font-style: italic; color: #111827;">"${itemData.reason}"</p>
                    </div>
                    ` : ''}
                </div>

                <p style="color: #4b5563; font-size: 14px;">
                    If you believe this is an error, please contact the campus security office directly or visit the administrative portal. In case of a life-threatening emergency, always contact local emergency services immediately.
                </p>
            </div>

            <div style="background-color: #f3f4f6; padding: 25px; text-align: center; font-size: 12px; color: #6b7280;">
                <p><strong>SafeCampus Security Administration</strong></p>
                <p>© 2026 SafeCampus Inc. | Protecting what matters most.</p>
                <p style="margin-top: 10px; color: #9ca3af;">This is an automated administrative notification. Do not reply to this email.</p>
            </div>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'SafeCampus Admin'}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: recipientEmail,
            subject: subject,
            html: htmlContent,
        });
        console.log(`✅ [EmailService] Rejection email sent to ${recipientEmail} (messageId: ${info.messageId})`);
    } catch (error) {
        const classified = classifyMailError(error, recipientEmail, 'Rejection');
        // Non-critical — rejection is still recorded in DB even if email fails
        console.error(`❌ [EmailService] Failed to send rejection email to ${recipientEmail} — [${classified.code}] ${classified.message}`);
    }
};

export const sendLeadEmail = async (leadData: { name: string; email: string; institution: string; message: string }) => {
    const brandColor = "#0f172a"; // Slate 900
    const accentColor = "#2563eb"; // Blue 600
    
    // 1. Email to the User (Confirmation)
    const userMailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'SafeCampus Team'}" <${process.env.MAIL_FROM_ADDRESS}>`,
        to: leadData.email,
        subject: 'We received your SafeCampus request! 🛡️',
        html: `
            <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f1f5f9; border-radius: 24px; background-color: #ffffff; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="display: inline-block; padding: 12px; background: ${brandColor}; border-radius: 12px; margin-bottom: 16px;">
                        <img src="https://img.icons8.com/ios-filled/50/ffffff/shield.png" width="24" height="24" alt="Shield" />
                    </div>
                    <h1 style="color: ${brandColor}; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">SafeCampus</h1>
                </div>
                
                <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">Hello ${leadData.name},</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                    Thank you for reaching out to SafeCampus! We've successfully received your inquiry for <strong>${leadData.institution}</strong>. 
                </p>

                <div style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                    <div style="background-color: #f8fafc; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                        <h3 style="margin: 0; font-size: 14px; color: #0f172a; font-weight: 700;">Your Inquiry Details</h3>
                    </div>
                    <div style="padding: 16px 20px; font-size: 14px; color: #334155; line-height: 1.5;">
                        <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${leadData.name}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Institution:</strong> ${leadData.institution}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${leadData.email}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Message:</strong></p>
                        <p style="margin: 4px 0 0 0; padding: 12px; background-color: #f1f5f9; border-radius: 8px; font-style: italic; color: #475569;">"${leadData.message}"</p>
                    </div>
                </div>
                
                <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
                    <p style="margin: 0; color: ${accentColor}; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Next Steps</p>
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                        Our institutional security team is currently reviewing your message. A representative will contact you via this email address within 24 hours to schedule a personalized demo.
                    </p>
                </div>

                <div style="text-align: center; font-size: 14px; color: #94a3b8; border-top: 1px solid #f1f5f9; pt: 32px; margin-top: 32px;">
                    <p>© 2026 SafeCampus Inc. | Empowering Institutions with Real-Time Safety</p>
                </div>
            </div>
        `,
    };

    // 2. Email to the Super Admin (Notification)
    const adminMailOptions = {
        from: `"SafeCampus Lead Bot" <${process.env.MAIL_FROM_ADDRESS}>`,
        to: "safecampus7@gmail.com",
        subject: `🚨 NEW LEAD: ${leadData.institution}`,
        html: `
            <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 2px solid ${brandColor}; border-radius: 24px; background-color: #ffffff;">
                <div style="background: ${brandColor}; color: white; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
                    <p style="margin: 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.7;">System Notification</p>
                    <h2 style="margin: 8px 0 0; font-size: 20px; font-weight: 800;">New Institutional Request</h2>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                    <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px; width: 140px;"><strong>Lead Name</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">${leadData.name}</td></tr>
                    <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;"><strong>Institution</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">${leadData.institution}</td></tr>
                    <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;"><strong>Email Address</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: ${accentColor}; font-weight: 600;">${leadData.email}</td></tr>
                </table>

                <div style="padding: 24px; background: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; margin-bottom: 32px;">
                    <p style="margin: 0 0 12px; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Message Body</p>
                    <p style="margin: 0; font-size: 15px; color: #334155; line-height: 1.6; font-style: italic;">"${leadData.message}"</p>
                </div>

                <div style="text-align: center;">
                    <a href="https://safecampus.app/dashboard/superAdmin/leads" style="display: inline-block; background: ${brandColor}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                        Review Lead in Dashboard
                    </a>
                </div>
            </div>
        `,
    };

    try {
        const [userInfo, adminInfo] = await Promise.allSettled([
            transporter.sendMail(userMailOptions),
            transporter.sendMail(adminMailOptions),
        ]);

        if (userInfo.status === 'fulfilled') {
            console.log(`✅ [EmailService] Lead confirmation email sent to ${leadData.email} (messageId: ${userInfo.value.messageId})`);
        } else {
            const classified = classifyMailError(userInfo.reason, leadData.email, 'Lead Confirmation');
            console.error(`❌ [EmailService] Failed to send lead confirmation to ${leadData.email} — [${classified.code}] ${classified.message}`);
        }

        if (adminInfo.status === 'fulfilled') {
            console.log(`✅ [EmailService] Lead notification sent to admin (messageId: ${adminInfo.value.messageId})`);
        } else {
            const classified = classifyMailError(adminInfo.reason, 'safecampus7@gmail.com', 'Lead Admin Notification');
            console.error(`❌ [EmailService] Failed to send lead notification to admin — [${classified.code}] ${classified.message}`);
        }
    } catch (error) {
        // Catches any unexpected synchronous errors in mail option construction
        const classified = classifyMailError(error, leadData.email, 'Lead');
        console.error(`❌ [EmailService] Unexpected error in sendLeadEmail — [${classified.code}] ${classified.message}`);
    }
};

export const sendStatusUpdateEmail = async (
    recipientEmail: string,
    recipientName: string,
    data: { id: string; title?: string; type?: string; status: string; reason?: string },
    isSOS: boolean = false
) => {
    const status = data.status || 'updated';
    const subject = isSOS ? `SOS Update: status changed to ${status}` : `Incident Update: status changed to ${status}`;

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #111827; padding: 28px 20px; text-align: center; color: #fff;">
                <h1 style="margin:0; font-size:20px;">${isSOS ? 'SOS Status Update' : 'Incident Status Update'}</h1>
                <p style="margin:6px 0 0 0; opacity:0.9;">Status: <strong style="text-transform:capitalize">${status}</strong></p>
            </div>

            <div style="padding:20px; color:#111827; line-height:1.5;">
                <h2 style="font-size:16px; margin:0 0 8px 0;">Hello ${recipientName || 'User'},</h2>
                <p style="margin:0 0 12px 0;">This is an update regarding your ${isSOS ? 'SOS alert' : 'incident report'}${data.title ? `: "${data.title}"` : ''}.</p>

                <div style="background:#f8fafc;border-left:4px solid #6366f1;padding:12px;border-radius:6px;margin-bottom:12px;">
                    <p style="margin:0;"><strong>ID:</strong> ${data.id}</p>
                    ${data.title ? `<p style="margin:6px 0 0 0;"><strong>Title:</strong> ${data.title}</p>` : ''}
                    <p style="margin:6px 0 0 0;"><strong>Current Status:</strong> ${status}</p>
                    ${data.reason ? `<p style="margin:6px 0 0 0;"><strong>Note:</strong> ${data.reason}</p>` : ''}
                </div>

                <p style="margin:0 0 10px 0; color:#374151;">If you have any questions or need further assistance, reply to this message or contact campus security.</p>
            </div>

            <div style="background:#f3f4f6;padding:16px;text-align:center;color:#6b7280;font-size:12px;">
                <div>© 2026 SafeCampus Inc. | Your Campus Security Partner</div>
            </div>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'SafeCampus'}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: recipientEmail,
            subject,
            html: htmlContent,
        });
        console.log(`✅ [EmailService] Status update email sent to ${recipientEmail} (messageId: ${info.messageId})`);
    } catch (error) {
        const classified = classifyMailError(error, recipientEmail, 'StatusUpdate');
        console.error(`❌ [EmailService] Failed to send status update email to ${recipientEmail} — [${classified.code}] ${classified.message}`);
    }
};
