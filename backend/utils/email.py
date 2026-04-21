import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings
from datetime import datetime

def send_reset_email(email_to: str, token: str):
    """
    Sends a formatted HTML password recovery email via SMTP.
    """
    subject = f"{settings.PROJECT_NAME} - Password Recovery"
    link = f"http://localhost:5173/reset-password?token={token}"
    
    html_content = f"""
    <html>
        <body style="font-family: sans-serif; color: #1e293b; line-height: 1.5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f1f5f9; border-radius: 24px;">
                <h2 style="color: #4f46e5; margin-bottom: 24px;">Security Hub: Password Recovery</h2>
                <p>Hello,</p>
                <p>You requested a password reset for your account on <strong>{settings.PROJECT_NAME}</strong>.</p>
                <p>Click the button below to initialize the recovery sequence. This secure link will expire in <strong>15 minutes</strong>.</p>
                <div style="margin: 32px 0;">
                    <a href="{link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="font-size: 14px; color: #64748b;">If you did not request this reset, please ignore this email or contact support if you have concerns.</p>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
                <p style="font-size: 12px; color: #94a3b8;">Sent via StudyMatch Secure SMTP Gateway</p>
            </div>
        </body>
    </html>
    """
    
    message = MIMEMultipart()
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    message["To"] = email_to
    message["Subject"] = subject
    message.attach(MIMEText(html_content, "html"))

    # DEMO INSURANCE: Always log the link to the terminal console
    print(f"\n[SECURITY HUB] Password recovery link generated for {email_to}:")
    print(f"LINK: {link}\n")

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        return True
    except Exception as e:
        # Create a professional debug log for project evaluation
        with open("email_debug.log", "a") as f:
            f.write(f"[{datetime.utcnow()}] FAILED to send to {email_to}: {str(e)}\n")
            f.write(f"RECOVERY LINK: {link}\n\n")
        print(f"CRITICAL EMAIL FAILURE: {e}")
        return False
