import nodemailer from "nodemailer"
import path from "path"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const BRAND_NAME = "Cipher Store"
const BRAND_COLOR = "#00f5ff"
const SECONDARY_COLOR = "#a855f7"

export async function sendVerificationEmail(email: string, code: string) {
  const mailOptions = {
    from: `"${BRAND_NAME}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `[ACTION REQUIRED] Verify Your Grid Identity - ${BRAND_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            background-color: #030712;
            color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #0a0a0c;
            border: 1px solid #00f5ff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0, 245, 255, 0.2);
          }
          .header {
            background-color: #010205;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 2px solid #a855f7;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
            background-color: #0a0a0c;
            background-image: linear-gradient(#0a0a0c, #111114);
          }
          h1 {
            font-size: 22px;
            margin-bottom: 20px;
            color: #00f5ff;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            color: #b0b0b0;
            margin-bottom: 30px;
            font-family: Arial, sans-serif;
          }
          .code-container {
            background-color: #000000;
            border: 1px solid #a855f7;
            border-radius: 4px;
            padding: 25px;
            margin: 30px 0;
            display: inline-block;
          }
          .code {
            font-size: 48px;
            font-weight: bold;
            letter-spacing: 16px;
            color: #00f5ff;
            font-family: monospace;
          }
          .footer {
            padding: 20px;
            background-color: #010205;
            text-align: center;
            font-size: 11px;
            color: #4b5563;
            border-top: 1px dashed #333;
            font-family: Arial, sans-serif;
          }
          .warning {
            color: #ff0055;
            font-size: 12px;
            margin-top: 20px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
           
          </div>
          <div class="content">
            <h1>Identity Verification Required</h1>
            <p>Connection established. To finalize your synchronization with the Cipher Store mainframe, please enter the following decryption key into your terminal.</p>
            
            <div class="code-container">
              <div class="code">${code}</div>
            </div>
            
            <p>This transmission will self-destruct in 10 minutes. If you did not initiate this uplink, ignore this message.</p>
            <div class="warning">/// SECURE TRANSMISSION ///</div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ${BRAND_NAME}. ALL SYSTEMS NOMINAL.<br>
            Automated system message. Do not reply to this transmission.
          </div>
        </div>
      </body>
      </html>
    `,

  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Verification email sent to ${email}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to send verification email:", error)
    return { success: false, error }
  }
}
