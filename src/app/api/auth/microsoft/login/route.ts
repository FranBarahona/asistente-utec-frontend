
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  // In a real application, this is where you would initiate
  // the Microsoft OAuth flow, handle a callback from Microsoft,
  // and exchange code for tokens, then get user info.

  // For simulation purposes, we'll return one of the predefined emails.
  // This helps in testing different user roles.
  const adminEmail = "estefany.perez@mail.utec.edu.sv";
  const studentEmail = "2715282023@mail.utec.edu.sv";

  // You could add logic here to alternate or randomly pick one if needed for broader testing.
  // For now, let's try to be somewhat deterministic or allow a query param for testing.
  // Or simply pick one:
  const simulatedEmail = Math.random() > 0.5 ? adminEmail : studentEmail;
  // const simulatedEmail = studentEmail; // Or force one for specific testing

  if (simulatedEmail) {
    // In a real app, you might set an HTTP-only cookie here for session management.
    return NextResponse.json({ email: simulatedEmail });
  } else {
    // This case should ideally not be reached with hardcoded emails.
    return NextResponse.json({ error: "Login simulation failed. Could not determine an email." }, { status: 500 });
  }
}

    