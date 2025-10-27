import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.utils import formataddr
from app.core.config import settings
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self._server: Optional[smtplib.SMTP] = None
        self._is_connected = False

    def _check_smtp_config(self) -> bool:
        """Check if SMTP configuration is available"""
        if not settings.SMTP_HOST:
            print("❌ SMTP_HOST not configured")
            return False
        if not settings.SMTP_USER:
            print("❌ SMTP_USER not configured")
            return False
        if not settings.SMTP_PASSWORD:
            print("❌ SMTP_PASSWORD not configured")
            return False
        return True

    async def send_verification_email(self, email: str, token: str, name: str):
        """Send email verification email"""
        print(f"📧 DEBUG: Starting verification email to: {email}")
        
        if not self._check_smtp_config():
            print(f"❌ DEBUG: SMTP not configured. Token for {email}: {token}")
            return

        subject = "Confirm Your Email – Activate Your Podacium Account"
        verification_url = f"{settings.FRONTEND_URL}/auth/verify-email?token={token}"

        print(f"🔗 DEBUG: Verification URL: {verification_url}")

        # HTML version
        html_body = self._create_verification_html(name, verification_url, email)
        
        # Plain text fallback
        text_body = f"""
Hi {name},

Welcome to Podacium — where your journey in Data Science, Machine Learning, AI, and Business Intelligence begins.

To activate your account, please verify your email by clicking the link below:

{verification_url}

This link expires in 7 days for your security.

If you didn't create a Podacium account, you can safely ignore this message.

— The Podacium Team
Empowering the Future of Intelligence
        """

        await self._send_email_with_retry(email, subject, text_body, html_body)

    async def send_password_reset_email(self, email: str, token: str, name: str):
        """Send password reset email"""
        print(f"📧 DEBUG: Starting password reset email to: {email}")
        
        if not self._check_smtp_config():
            print(f"❌ DEBUG: SMTP not configured. Reset token for {email}: {token}")
            return

        subject = "Reset Your Podacium Password"
        reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"

        # HTML version
        html_body = self._create_password_reset_html(name, reset_url, email)
        
        # Plain text fallback
        text_body = f"""
Hi {name},

We received a request to reset your Podacium password for {email}.

To reset your password, visit this link:
{reset_url}

This link will expire in 24 hours for security reasons.

If you didn't request a password reset, please ignore this email. Your account remains secure.

— The Podacium Team
Empowering the Future of Intelligence
        """

        await self._send_email_with_retry(email, subject, text_body, html_body)

    def _create_verification_html(self, name: str, verification_url: str, email: str) -> str:
        """Create HTML template for verification email"""
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {{
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
      background-color: #f4f6f8;
      margin: 0;
      padding: 0;
      color: #333;
    }}
    .container {{
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }}
    .header {{
      background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
      color: #fff;
      text-align: center;
      padding: 40px 20px;
    }}
    .header h1 {{
      margin: 0;
      font-size: 26px;
    }}
    .content {{
      padding: 30px;
      line-height: 1.7;
    }}
    .content h2 {{
      margin-top: 0;
      color: #222;
      font-size: 22px;
    }}
    .button {{
      display: inline-block;
      background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
      color: #fff;
      padding: 14px 35px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }}
    .link-box {{
      word-break: break-all;
      background: #f8f9fa;
      padding: 10px;
      border-radius: 6px;
      font-size: 13px;
      color: #555;
    }}
    .note {{
      background: #fffbea;
      border-left: 4px solid #ffcd38;
      padding: 12px 15px;
      margin: 25px 0;
      border-radius: 6px;
      font-size: 14px;
      color: #7a6700;
    }}
    .footer {{
      text-align: center;
      color: #999;
      font-size: 13px;
      padding: 25px;
      border-top: 1px solid #eee;
      background: #fafafa;
    }}
    .footer p {{
      margin: 5px 0;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Welcome to Podacium</h1>
      <p>Empowering the Future of Intelligence</p>
    </div>
    <div class="content">
      <h2>Hello {name},</h2>
      <p>We're thrilled to have you at <strong>Podacium</strong> — your new platform for Data Science, Machine Learning, AI, and Business Intelligence learning.</p>
      <p>To activate your account, please verify your email address:</p>
      <p style="text-align:center;">
        <a href="{verification_url}" class="button" 
          style="color:#ffffff !important; text-decoration:none; font-weight:600;">
          Verify My Email
        </a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <div class="link-box">{verification_url}</div>
      <div class="note">
        🔒 For your security, this link will expire in <strong>7 days</strong>.
      </div>
      <p>If you didn't sign up for Podacium, you can safely ignore this message.</p>
      <p>Welcome aboard — let's unlock your learning and earning potential together!</p>
      <p>Warm regards,<br><strong>The Podacium Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 Podacium. All rights reserved.</p>
      <p>This email was sent to {email}. Need help? <a href="#" style="color:#2575fc;">Contact Support</a></p>
    </div>
  </div>
</body>
</html>
        """

    def _create_password_reset_html(self, name: str, reset_url: str, email: str) -> str:
        """Create HTML template for password reset email"""
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {{
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
      background-color: #f4f6f8;
      margin: 0;
      padding: 0;
      color: #333;
    }}
    .container {{
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }}
    .header {{
      background: linear-gradient(135deg, #ff512f 0%, #dd2476 100%);
      color: #fff;
      text-align: center;
      padding: 40px 20px;
    }}
    .header h1 {{
      margin: 0;
      font-size: 26px;
    }}
    .content {{
      padding: 30px;
      line-height: 1.7;
    }}
    .content h2 {{
      margin-top: 0;
      color: #222;
      font-size: 22px;
    }}
    .button {{
      display: inline-block;
      background: linear-gradient(135deg, #ff512f 0%, #dd2476 100%);
      color: #fff;
      padding: 14px 35px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }}
    .link-box {{
      word-break: break-all;
      background: #f8f9fa;
      padding: 10px;
      border-radius: 6px;
      font-size: 13px;
      color: #555;
    }}
    .note {{
      background: #fffbea;
      border-left: 4px solid #ffcd38;
      padding: 12px 15px;
      margin: 25px 0;
      border-radius: 6px;
      font-size: 14px;
      color: #7a6700;
    }}
    .alert {{
      background: #fdecea;
      border-left: 4px solid #f44336;
      padding: 12px 15px;
      margin: 25px 0;
      border-radius: 6px;
      font-size: 14px;
      color: #721c24;
    }}
    .footer {{
      text-align: center;
      color: #999;
      font-size: 13px;
      padding: 25px;
      border-top: 1px solid #eee;
      background: #fafafa;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    <div class="content">
      <h2>Hello {name},</h2>
      <p>We received a request to reset your Podacium password for <strong>{email}</strong>.</p>
      <p>To reset your password, click the button below:</p>
      <p style="text-align:center;">
        <a href="{reset_url}" class="button"
          style="color:#ffffff !important; text-decoration:none; font-weight:600;">
          Reset Password
        </a>
      </p>
      <p>If that doesn't work, copy and paste this link into your browser:</p>
      <div class="link-box">{reset_url}</div>
      <div class="note">
        ⏰ This reset link will expire in <strong>24 hours</strong>.
      </div>
      <div class="alert">
        ⚠️ If you didn't request a password reset, please ignore this email. Your account remains secure.
      </div>
      <p>If you need help, our support team is ready to assist you.</p>
      <p>Stay secure,<br><strong>The Podacium Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 Podacium. All rights reserved.</p>
      <p>This email was sent to {email} in response to a password reset request.</p>
    </div>
  </div>
</body>
</html>
        """

    async def _send_email_with_retry(self, to_email: str, subject: str, text_body: str, html_body: str, max_retries: int = 3):
        """Send email with retry logic"""
        for attempt in range(max_retries):
            try:
                await self._send_email(to_email, subject, text_body, html_body)
                print(f"✅ Email sent successfully to {to_email}")
                return
            except Exception as e:
                print(f"❌ Attempt {attempt + 1}/{max_retries} failed: {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                else:
                    print(f"💥 All {max_retries} attempts failed for {to_email}")
                    raise

    async def _send_email(self, to_email: str, subject: str, text_body: str, html_body: str = None):
        """Internal method to send email via SMTP"""
        try:
            print(f"🔧 DEBUG: Preparing email to: {to_email}")
            print(f"🔧 DEBUG: SMTP Config - Host: {settings.SMTP_HOST}, Port: {settings.SMTP_PORT}, User: {settings.SMTP_USER}")

            # Create message container
            msg = MIMEMultipart('alternative')
            msg['From'] = formataddr(("Podacium", settings.SMTP_USER))
            msg['To'] = to_email
            msg['Subject'] = Header(subject, 'utf-8')
            msg['Reply-To'] = settings.SMTP_USER

            # Attach both text and HTML versions
            part1 = MIMEText(text_body, 'plain', 'utf-8')
            msg.attach(part1)
            
            if html_body:
                part2 = MIMEText(html_body, 'html', 'utf-8')
                msg.attach(part2)

            print(f"🔧 DEBUG: Connecting to SMTP server: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
            
            # Create SMTP connection
            if getattr(settings, 'SMTP_USE_SSL', False):
                print("🔧 DEBUG: Using SMTP_SSL")
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
            else:
                print("🔧 DEBUG: Using regular SMTP")
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            
            print("🔧 DEBUG: Connection established")
            
            # Start TLS if not using SSL
            if not getattr(settings, 'SMTP_USE_SSL', False):
                print("🔧 DEBUG: Starting TLS")
                server.starttls()
                print("🔧 DEBUG: TLS started")
            
            # Login
            print(f"🔧 DEBUG: Logging in as: {settings.SMTP_USER}")
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            print("🔧 DEBUG: Login successful")
            
            # Send email
            print(f"🔧 DEBUG: Sending email to {to_email}...")
            server.send_message(msg)
            print("🔧 DEBUG: Email sent successfully")
            
            # Quit
            server.quit()
            print(f"✅ Email successfully sent to {to_email}")

        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"❌ SMTP Authentication failed: {str(e)}"
            print(error_msg)
            print("💡 TIP: Make sure you're using an App Password for Gmail, not your regular password")
            logger.error(error_msg)
            raise
        except smtplib.SMTPException as e:
            error_msg = f"❌ SMTP error: {str(e)}"
            print(error_msg)
            logger.error(error_msg)
            raise
        except Exception as e:
            error_msg = f"❌ Failed to send email to {to_email}: {str(e)}"
            print(error_msg)
            logger.error(error_msg)
            raise

    async def test_connection(self) -> bool:
        """Test SMTP connection and credentials"""
        try:
            print(f"🔧 Testing SMTP connection to {settings.SMTP_HOST}:{settings.SMTP_PORT}")
            
            if getattr(settings, 'SMTP_USE_SSL', False):
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
            else:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
                
            if not getattr(settings, 'SMTP_USE_SSL', False):
                server.starttls()
                
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.quit()
            
            print("✅ SMTP connection test successful")
            return True
        except Exception as e:
            print(f"❌ SMTP connection test failed: {str(e)}")
            return False

# Singleton instance
email_service = EmailService()