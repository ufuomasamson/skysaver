import { NextResponse } from "next/server";
import { getConnection } from "@/lib/mysql";

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }
    const conn = await getConnection();
    const [result] = await conn.execute(
      "UPDATE users SET role = ? WHERE email = ?",
      [role, email]
    );
    await conn.end();
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "User not found or role not updated" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
