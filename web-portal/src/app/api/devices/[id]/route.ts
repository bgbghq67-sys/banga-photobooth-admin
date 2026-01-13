import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

const DEVICES_COLLECTION = "devices";

export const runtime = "nodejs";

// GET - Get single device
export async function GET(
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

    return NextResponse.json({
      ok: true,
      device: { id: snapshot.id, ...snapshot.data() },
    });
  } catch (error) {
    console.error("Error fetching device:", error);
    return NextResponse.json({ ok: false, message: "Failed to fetch device" }, { status: 500 });
  }
}

// PUT - Update device
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminDb = getAdminDb();
    const { id } = await params;
    const body = await request.json();
    const { name, remainingSessions } = body;

    const docRef = adminDb.collection(DEVICES_COLLECTION).doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ ok: false, message: "Device not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (remainingSessions !== undefined) updates.remainingSessions = remainingSessions;

    await docRef.update(updates);

    return NextResponse.json({ ok: true, message: "Device updated" });
  } catch (error) {
    console.error("Error updating device:", error);
    return NextResponse.json({ ok: false, message: "Failed to update device" }, { status: 500 });
  }
}

// DELETE - Delete device
export async function DELETE(
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

    await docRef.delete();

    return NextResponse.json({ ok: true, message: "Device deleted" });
  } catch (error) {
    console.error("Error deleting device:", error);
    return NextResponse.json({ ok: false, message: "Failed to delete device" }, { status: 500 });
  }
}








