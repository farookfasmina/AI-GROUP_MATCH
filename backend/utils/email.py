import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from core.config import settings

PURPOSE_TEXT = {
    "verify": ("Confirm your email", "Use this code to confirm your email address and finish creating your account."),
    "reset": ("Reset your password", "Use this code to choose a new password. If you did not ask for this, you can ignore this email."),
}


def send_email(to: str, subject: str, html: str, text: str) -> bool:
    """Send one email over SMTP (STARTTLS on 587, SSL on 465). Returns False when email is
    not set up or sending failed - callers never fail because of email."""
    return send_email_checked(to, subject, html, text) is None


def send_email_checked(to: str, subject: str, html: str, text: str):
    """Like send_email, but returns None on success or a plain reason on failure (for the admin check)."""
    if not settings.email_enabled:
        return "Email is not set up: SMTP_USER and SMTP_PASSWORD are empty."
    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL or settings.SMTP_USER}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))
    try:
        context = ssl.create_default_context()
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15, context=context) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                server.starttls(context=context)
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
        return None
    except smtplib.SMTPAuthenticationError as exc:
        print(f"Email to {to} failed: {exc}")
        return "Gmail refused the login: check SMTP_USER is the full Gmail address and SMTP_PASSWORD is the 16-letter app password (no spaces)."
    except Exception as exc:  # never show SMTP details to the user
        print(f"Email to {to} failed: {exc}")
        return f"Sending failed: {type(exc).__name__}."


def send_code_email(to: str, code: str, purpose: str) -> bool:
    title, line = PURPOSE_TEXT[purpose]
    text = f"{title}\n\n{line}\n\nYour code: {code}\n\nIt expires in 10 minutes. Never share this code with anyone."
    html = f"""<div style="font-family:Arial,sans-serif;color:#111;max-width:480px;margin:0 auto;padding:24px">
<p style="font-size:18px;font-weight:bold;margin:0 0 12px">{title}</p>
<p style="margin:0 0 20px;color:#333">{line}</p>
<p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:0 0 20px">{code}</p>
<p style="margin:0;color:#555;font-size:13px">It expires in 10 minutes. Never share this code with anyone.</p>
<p style="margin:24px 0 0;color:#555;font-size:12px">StudyMatch AI</p></div>"""
    return send_email(to, f"{code} is your StudyMatch code", html, text)
