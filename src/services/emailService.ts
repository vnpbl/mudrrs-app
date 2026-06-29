// src/services/emailService.ts
import emailjs from '@emailjs/browser';

// EmailJS credentials (store in .env)
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Template IDs (different for each email type)
const TEMPLATE_IDS = {
  confirmation: import.meta.env.VITE_EMAILJS_TEMPLATE_CONFIRMATION || '',
  rejection: import.meta.env.VITE_EMAILJS_TEMPLATE_REJECTION || '',
} as const;

export type EmailTemplateType = keyof typeof TEMPLATE_IDS;

export interface EmailParams {
  to_email: string;
  student_name: string;
  room_name: string;
  campus: string;
  date: string;
  start_time: string;
  end_time?: string; // Optional for rejection (only needs start_time)
  status: string;
}

/**
 * Send an email using EmailJS with the specified template type.
 * @param templateType - The type of email to send ('confirmation', 'rejection', etc.)
 * @param params - The dynamic parameters for the template
 */
export async function sendReservationEmail(
  templateType: EmailTemplateType,
  params: EmailParams
): Promise<{ success: boolean; error?: string }> {
  const templateId = TEMPLATE_IDS[templateType];

  if (!templateId) {
    const error = `Missing template ID for type: ${templateType}. Check your environment variables.`;
    console.error('❌ Email error:', error);
    return { success: false, error };
  }

  if (!SERVICE_ID || !PUBLIC_KEY) {
    const error = 'Missing EmailJS credentials. Check your environment variables.';
    console.error('❌ Email error:', error);
    return { success: false, error };
  }

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      templateId,
      {
        to_email: params.to_email,
        student_name: params.student_name,
        room_name: params.room_name,
        campus: params.campus,
        date: params.date,
        start_time: params.start_time,
        end_time: params.end_time || '',
        status: params.status,
      },
      PUBLIC_KEY
    );

    console.log(`✅ ${templateType} email sent successfully to ${params.to_email}:`, response);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${templateType} email failed:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}