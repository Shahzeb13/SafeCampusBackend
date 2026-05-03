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
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email (${role}) sent to ${email}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
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
        await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'SafeCampus Security'}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: recipientEmail,
            subject: subject,
            html: htmlContent,
        });
        console.log(`📧 Assignment email sent to ${recipientEmail}`);
    } catch (error) {
        console.error('❌ Error sending assignment email:', error);
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
        await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'SafeCampus Emergency'}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: recipientEmail,
            subject: subject,
            html: htmlContent,
        });
        console.log(`📧 SOS Assignment email sent to ${recipientEmail}`);
    } catch (error) {
        console.error('❌ Error sending SOS assignment email:', error);
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
        await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'SafeCampus Admin'}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: recipientEmail,
            subject: subject,
            html: htmlContent,
        });
        console.log(`📧 Rejection email sent to ${recipientEmail}`);
    } catch (error) {
        console.error('❌ Error sending rejection email:', error);
    }
};
