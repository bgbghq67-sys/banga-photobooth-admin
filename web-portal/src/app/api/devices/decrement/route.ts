import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

const DEVICES_COLLECTION = "devices";

export const runtime = "nodejs";

// POST - Decrement session count for a device
export async function POST(request: Request) {
  try {
    const adminDb = getAdminDb();
    const body = await request.json();
    const { machineId } = body;

    if (!machineId || typeof machineId !== "string") {
      return NextResponse.json({ ok: false, message: "Machine ID is required" }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection(DEVICES_COLLECTION)
      .where("machineId", "==", machineId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ ok: false, message: "Device not found" }, { status: 404 });
    }

    const deviceDoc = snapshot.docs[0];
    const deviceRef = deviceDoc.ref;

    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(deviceRef);
      const data = snap.data() as any;
      const current = Number(data?.remainingSessions ?? 0);
      if (!Number.isFinite(current) || current <= 0) {
        return { ok: false as const, remaining: 0, status: 403 as const, message: "No sessions remaining" };
      }
      tx.update(deviceRef, {
        remainingSessions: FieldValue.increment(-1),
        lastSeen: Date.now(),
      } as any);
      return { ok: true as const, remaining: current - 1, status: 200 as const };
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: result.status });
    }

    return NextResponse.json({ ok: true, remainingSessions: result.remaining });
  } catch (error) {
    console.error("Decrement error:", error);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}








