import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  
  // Delete cookie in response (Next.js 15 API routes require this approach)
  const cookieName = process.env.COOKIE_NAME || "menumate_session";
  response.cookies.delete(cookieName);
  
  return response;
}



