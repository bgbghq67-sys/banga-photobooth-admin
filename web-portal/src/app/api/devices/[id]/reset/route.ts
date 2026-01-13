import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

const DEVICES_COLLECTION = "devices";

export const runtime = "nodejs";

// POST - Reset machine binding for device
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminDb = getAdminDb();
    const { id } = await params;
    const docRef = adminDb.collection(DEVICES_COLLECTION).doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ ok: false, message: "Device not found" }, { status: 404 });
    }

    await docRef.update({
      machineId: null,
      activated: false,
      lastSeen: null,
    });

    return NextResponse.json({ ok: true, message: "Machine binding reset" });
  } catch (error) {
    console.error("Error resetting machine:", error);
    return NextResponse.json({ ok: false, message: "Failed to reset machine" }, { status: 500 });
  }
}








