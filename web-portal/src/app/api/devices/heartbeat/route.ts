import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

const DEVICES_COLLECTION = "devices";

export const runtime = "nodejs";

// POST - Heartbeat from device (update lastSeen and get session count)
export async function POST(request: Request) {
  try {
    const adminDb = getAdminDb();
    const body = await request.json();
    const { machineId } = body;

    if (!machineId || typeof machineId !== "string") {
      return NextResponse.json({ ok: false, message: "Machine ID is required" }, { status: 400 });
    }

    // Find device by machine ID
    const snapshot = await adminDb
      .collection(DEVICES_COLLECTION)
      .where("machineId", "==", machineId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ ok: false, message: "Device not found" }, { status: 404 });
    }

    const deviceDoc = snapshot.docs[0];
    const deviceData = deviceDoc.data();

    // Update last seen
    await deviceDoc.ref.update({ lastSeen: Date.now() });

    return NextResponse.json({
      ok: true,
      deviceId: deviceDoc.id,
      deviceName: deviceData.name,
      remainingSessions: deviceData.remainingSessions,
    });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}








