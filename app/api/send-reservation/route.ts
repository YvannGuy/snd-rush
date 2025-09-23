import { NextRequest, NextResponse } from 'next/server';
import { sendReservationEmails } from '../../../../lib/email-sender';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await sendReservationEmails(data);
    if (result.success) {
      return NextResponse.json({ success: true, orderNumber: result.orderNumber });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
} 