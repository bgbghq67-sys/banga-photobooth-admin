import { NextResponse } from "next/server";
import { getServerDb } from "@/lib/firestoreServer";

const DEVICES_COLLECTION = "devices";

export const runtime = "nodejs";

// GET - List all devices
export async function GET() {
  try {
    const db = getServerDb();
    const snapshot = await db.collection(DEVICES_COLLECTION).get();
    const devices = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Sort client-side to avoid index requirement
    devices.sort((a, b) => ((b as any).createdAt || 0) - ((a as any).createdAt || 0));

    return NextResponse.json({ ok: true, devices });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json({ ok: false, message: "Failed to fetch devices", error: String(error) }, { status: 500 });
  }
}

// POST - Create new device
export async function POST(request: Request) {
  try {
    const db = getServerDb();
    const body = await request.json();
    const { name, remainingSessions = 100 } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ ok: false, message: "Device name is required" }, { status: 400 });
    }

    const newDevice = {
      name: name.trim(),
      machineId: null,
      remainingSessions: remainingSessions,
      activated: false,
      createdAt: Date.now(),
      lastSeen: null,
    };

    const docRef = await db.collection(DEVICES_COLLECTION).add(newDevice);

    return NextResponse.json({
      ok: true,
      device: { id: docRef.id, ...newDevice },
    });
  } catch (error) {
    console.error("Error creating device:", error);
    return NextResponse.json({ ok: false, message: "Failed to create device" }, { status: 500 });
  }
}

