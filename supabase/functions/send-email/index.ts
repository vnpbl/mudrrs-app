// supabase/functions/send-email/index.ts
import { serve } from "@std/http";
import { createClient } from "@supabase/supabase-js";
import { SmtpClient } from "@smtp";

// --- Initialize Supabase client (bypasses RLS) ---
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// --- SMTP client setup (with validation) ---
const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
const SMTP_USER = Deno.env.get("SMTP_USER");
const SMTP_PASS = Deno.env.get("SMTP_PASS");

// ✅ Validate required secrets
if (!SMTP_USER || !SMTP_PASS) {
  console.error("❌ Missing SMTP credentials. Set SMTP_USER and SMTP_PASS secrets.");
}

const smtpConfig = {
  hostname: SMTP_HOST,
  port: SMTP_PORT,
  username: SMTP_USER || "",
  password: SMTP_PASS || "",
};

// --- Send email function ---
async function sendEmail(to: string, subject: string, html: string) {
  const client = new SmtpClient();
  try {
    await client.connectTLS(smtpConfig);
    await client.send({
      from: Deno.env.get("SMTP_FROM") || smtpConfig.username,
      to,
      subject,
      content: html,
    });
    console.log(`✅ Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ SMTP error:", errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    await client.close();
  }
}

// --- Main handler ---
serve(async (req) => {
  try {
    // 1. Parse request
    const { type, reservationId } = await req.json();

    // 2. Validate input
    if (!reservationId) {
      return new Response(
        JSON.stringify({ error: "Missing reservationId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch reservation WITH the student join
    const { data: reservation, error: rError } = await supabase
      .from("reservations")
      .select(`*, student:students(*)`)
      .eq("reservation_id", reservationId)
      .single();

    if (rError || !reservation) {
      console.error("❌ Reservation query error:", rError);
      return new Response(
        JSON.stringify({ error: "Reservation not found", details: rError?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Extract student from the joined data
    const student = reservation.student;
    if (!student) {
      console.error("❌ No student linked to this reservation");
      return new Response(
        JSON.stringify({ error: "Student not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Fetch user email using student.user_id
    const { data: user, error: uError } = await supabase
      .from("users")
      .select("email")
      .eq("user_id", student.user_id)
      .single();

    if (uError || !user) {
      console.error("❌ User query error:", uError);
      return new Response(
        JSON.stringify({ error: "User email not found", details: uError?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Found email: ${user.email} for student ${student.student_id}`);

    // 6. Build email data
    const roomName = reservation.room?.room_name || "Unknown Room";
    const campus = reservation.room?.campus || "Unknown Campus";
    const startTime = new Date(reservation.start_time);
    const endTime = new Date(reservation.end_time);

    const emailData = {
      room_name: roomName,
      campus: campus,
      date: startTime.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      start_time: startTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      end_time: endTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      student_name: `${student.first_name} ${student.last_name}`,
    };

    // 7. Send email based on type
    let result;
    if (type === "confirmation") {
      const subject = `✅ Booking Confirmed: ${emailData.room_name}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; }
            .header { background: #991b1b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; }
            .detail { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #555; }
            .footer { margin-top: 20px; text-align: center; color: #888; font-size: 12px; }
            .badge { background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
            .warning { background: #fef2f2; border-left: 4px solid #991b1b; padding: 12px; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">✅ Booking Confirmed</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${emailData.student_name}</strong>,</p>
            <p>Your reservation has been <strong>approved</strong> by the library staff.</p>
            <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <div class="detail"><span class="label">Room</span><span>${emailData.room_name}</span></div>
              <div class="detail"><span class="label">Campus</span><span>${emailData.campus}</span></div>
              <div class="detail"><span class="label">Date</span><span>${emailData.date}</span></div>
              <div class="detail"><span class="label">Time</span><span>${emailData.start_time} - ${emailData.end_time}</span></div>
              <div class="detail"><span class="label">Status</span><span><span class="badge">Approved</span></span></div>
            </div>
            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Important:</strong> Please check in at the library desk within <strong>15 minutes</strong> of your start time. Late arrivals will be auto-cancelled.</p>
            </div>
            <p>View your reservations: <a href="${Deno.env.get("APP_URL") || "http://localhost:5173"}/reservations">My Reservations</a></p>
          </div>
          <div class="footer">
            <p>Mapúa University Discussion Room Reservation System (MUDRRS)</p>
          </div>
        </body>
        </html>
      `;
      result = await sendEmail(user.email, subject, html);
    } else if (type === "rejection") {
      const subject = `❌ Booking Rejected: ${emailData.room_name}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; }
            .header { background: #991b1b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; }
            .detail { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #555; }
            .footer { margin-top: 20px; text-align: center; color: #888; font-size: 12px; }
            .badge-rejected { background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">❌ Booking Rejected</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${emailData.student_name}</strong>,</p>
            <p>Your reservation has been <strong>rejected</strong> by the library staff.</p>
            <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <div class="detail"><span class="label">Room</span><span>${emailData.room_name}</span></div>
              <div class="detail"><span class="label">Date</span><span>${emailData.date}</span></div>
              <div class="detail"><span class="label">Time</span><span>${emailData.start_time}</span></div>
              <div class="detail"><span class="label">Status</span><span><span class="badge-rejected">Rejected</span></span></div>
            </div>
            <p>You can book another time slot: <a href="${Deno.env.get("APP_URL") || "http://localhost:5173"}/book">Book a Room</a></p>
          </div>
          <div class="footer">
            <p>Mapúa University Discussion Room Reservation System (MUDRRS)</p>
          </div>
        </body>
        </html>
      `;
      result = await sendEmail(user.email, subject, html);
    } else {
      return new Response(
        JSON.stringify({ error: "Unknown email type", type }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 8. Return response
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("💥 Unhandled error:", errorMessage);
    console.error(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});