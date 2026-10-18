import nodemailer from 'nodemailer';
import { db } from './db.js';
import crypto from 'crypto';

export interface NotificationPayload {
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  type: 'booking_received' | 'booking_confirmed' | 'booking_cancelled' | 'booking_rescheduled' | 'reminder';
  subject: string;
  bookingReference: string;
  customerName: string;
  appointmentTypeName: string;
  appointmentDate: string;
  appointmentTime: string;
  additionalInfo?: string;
}

export async function sendNotification(payload: NotificationPayload) {
  const now = new Date().toISOString();
  const logId = `notif_${crypto.randomUUID()}`;

  // Read SMTP settings
  const settingsResult = await db.execute("SELECT key, value FROM website_settings");
  const settings: Record<string, string> = {};
  for (const row of settingsResult.rows) {
    settings[String(row.key)] = String(row.value);
  }

  const smtpHost = process.env.SMTP_HOST || settings.smtp_host;
  const smtpPort = parseInt(process.env.SMTP_PORT || settings.smtp_port || '587', 10);
  const smtpUser = process.env.SMTP_USER || settings.smtp_user;
  const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || settings.smtp_from || 'Advance IT Institute <info@advanceit.in>';

  const isConfigured = Boolean(smtpHost && smtpUser && smtpPass);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 8px;">
      <div style="background-color: #0b1220; padding: 20px; border-radius: 6px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Advance IT Institute</h1>
        <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Najafgarh, New Delhi</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 24px; border-radius: 6px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">${payload.subject}</h2>
        <p>Dear <strong>${payload.customerName}</strong>,</p>
        <p>Here are your appointment details at Advance IT Institute:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Booking Reference:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #3563FF; font-size: 14px;">${payload.bookingReference}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Purpose / Service:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; font-size: 14px;">${payload.appointmentTypeName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Date:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; font-size: 14px;">${payload.appointmentDate} (IST)</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Time:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; font-size: 14px;">${payload.appointmentTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Institute Address:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">First Floor, Plot No. 2, Main Road, opp. Gupta Market, near Anaj Mandi Road, Saraswati Enclave, Najafgarh, New Delhi 110043</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Helpline:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 14px;">+91 87005 73469</td>
          </tr>
        </table>

        ${payload.additionalInfo ? `<p style="background: #eff6ff; padding: 12px; border-radius: 4px; border-left: 4px solid #3563FF; font-size: 14px; color: #1e3a8a;">${payload.additionalInfo}</p>` : ''}

        <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
          If you need to reschedule or cancel, you can manage your reservation online using your booking reference.
        </p>
      </div>

      <div style="text-align: center; margin-top: 16px; font-size: 12px; color: #94a3b8;">
        Advance IT Institute • Software Training & IT Education • Najafgarh, New Delhi
      </div>
    </div>
  `;

  if (!isConfigured) {
    // Record honest unconfigured status
    await db.execute({
      sql: `INSERT INTO notification_logs (id, recipient_email, recipient_phone, type, status, payload, error_message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        logId,
        payload.recipientEmail || null,
        payload.recipientPhone || null,
        payload.type,
        'unconfigured',
        JSON.stringify(payload),
        'SMTP credentials not configured in environment or settings. Notification logged to audit trail.',
        now,
      ],
    });
    return {
      success: false,
      status: 'unconfigured',
      message: 'Email service requires SMTP setup in environment or Admin Settings. Logged to notification audit.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    if (payload.recipientEmail) {
      await transporter.sendMail({
        from: smtpFrom,
        to: payload.recipientEmail,
        subject: payload.subject,
        html: htmlContent,
      });

      await db.execute({
        sql: `INSERT INTO notification_logs (id, recipient_email, recipient_phone, type, status, payload, error_message, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          logId,
          payload.recipientEmail,
          payload.recipientPhone || null,
          payload.type,
          'sent',
          JSON.stringify(payload),
          null,
          now,
        ],
      });

      return { success: true, status: 'sent' };
    }
  } catch (err: any) {
    await db.execute({
      sql: `INSERT INTO notification_logs (id, recipient_email, recipient_phone, type, status, payload, error_message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        logId,
        payload.recipientEmail || null,
        payload.recipientPhone || null,
        payload.type,
        'failed',
        JSON.stringify(payload),
        err.message || String(err),
        now,
      ],
    });
    return { success: false, status: 'failed', error: err.message };
  }
}
