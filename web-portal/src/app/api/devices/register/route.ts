import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

const DEVICES_COLLECTION = "devices";

export const runtime = "nodejs";

// GET - Health check for keep-alive pings
export async function GET() {
  return NextResponse.json({ ok: true, message: "Register endpoint is alive", timestamp: Date.now() });
}

// POST - Register device (called by Desktop App on startup)
export async function POST(request: Request) {
  try {
    const adminDb = getAdminDb();
    const body = await request.json();
    const { machineId, machineName } = body;

    if (!machineId || typeof machineId !== "string") {
      return NextResponse.json({ ok: false, message: "Machine ID is required" }, { status: 400 });
    }

    // Check if device already exists
    const snapshot = await adminDb
      .collection(DEVICES_COLLECTION)
      .where("machineId", "==", machineId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const deviceDoc = snapshot.docs[0];
      const deviceData = deviceDoc.data();

      await deviceDoc.ref.update({ lastSeen: Date.now() });

      return NextResponse.json({
        ok: true,
        isNew: false,
        deviceId: deviceDoc.id,
        deviceName: deviceData.name,
        remainingSessions: deviceData.remainingSessions,
        activated: deviceData.remainingSessions > 0,
      });
    }

    // New device - create it
    const newDevice = {
      name: machineName || `New Device (${machineId.substring(0, 8)}...)`,
      machineId: machineId,
      remainingSessions: 0,
      activated: false,
      createdAt: Date.now(),
      lastSeen: Date.now(),
    };

    const docRef = await adminDb.collection(DEVICES_COLLECTION).add(newDevice);

    return NextResponse.json({
      ok: true,
      isNew: true,
      deviceId: docRef.id,
      deviceName: newDevice.name,
      remainingSessions: 0,
      activated: false,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}








