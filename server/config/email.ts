import nodemailer from "nodemailer";

// Email configuration using provided SMTP settings
export const emailConfig = {
  host: "mail.setech.pk",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "no-reply@setech.pk",
    pass: "sachiMUCHI79513",
  },
};

// Create reusable transporter object using the email config
export const emailTransporter = nodemailer.createTransport(emailConfig);

// Verify connection configuration
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    await emailTransporter.verify();
    console.log("✅ Email server connection verified");
    return true;
  } catch (error) {
    console.error("❌ Email server connection failed:", error);
    return false;
  }
};

// Email templates
export const emailTemplates = {
  passwordReset: (resetLink: string, userName: string) => ({
    subject: "Password Reset Request - SE TECH Voice Recording System",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .button { 
            display: inline-block; 
            background-color: #dc2626; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { background-color: #e5e5e5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SE TECH Voice Recording System</h1>
            <p>Password Reset Request</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName || "User"},</h2>
            
            <p>We received a request to reset your password for your SE TECH Voice Recording System account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset My Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 3px;">
              ${resetLink}
            </p>
            
            <div class="warning">
              <strong>Security Notice:</strong>
              <ul>
                <li>This link will expire in 1 hour for security reasons</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            
            <p>If you have any questions, please contact your system administrator.</p>
            
            <p>Best regards,<br>SE TECH Support Team</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} SE TECH (Pvt.) Ltd. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      SE TECH Voice Recording System - Password Reset Request
      
      Hello ${userName || "User"},
      
      We received a request to reset your password for your SE TECH Voice Recording System account.
      
      Please visit the following link to reset your password:
      ${resetLink}
      
      Security Notice:
      - This link will expire in 1 hour for security reasons
      - If you didn't request this password reset, please ignore this email
      - Never share this link with anyone
      
      If you have any questions, please contact your system administrator.
      
      Best regards,
      SE TECH Support Team
      
      © ${new Date().getFullYear()} SE TECH (Pvt.) Ltd. All rights reserved.
      This is an automated message, please do not reply to this email.
    `,
  }),
};

// Send email function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<boolean> => {
  try {
    const info = await emailTransporter.sendMail({
      from: `"SE TECH System" <${emailConfig.auth.user}>`,
      to,
      subject,
      html,
      text,
    });

    console.log("✅ Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return false;
  }
};
