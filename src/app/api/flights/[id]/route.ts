import { NextResponse } from "next/server";
import { getConnection } from "@/lib/mysql";

// DELETE /api/flights/[id]
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const db = await getConnection();
  try {
    const id = params.id;
    if (!id || isNaN(Number(id))) {
      await db.end();
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 });
    }
    const [result] = await db.execute("DELETE FROM flights WHERE id = ?", [id]);
    await db.end();
    return NextResponse.json({ success: true });
  } catch (err) {
    await db.end();
    return NextResponse.json({ error: "Failed to delete flight", details: String(err) }, { status: 500 });
  }
}
