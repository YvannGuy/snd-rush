import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY n\'est pas configurée dans les variables d\'environnement');
}

export const resend = new Resend(process.env.RESEND_API_KEY);