import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminInfo } from "@/lib/firebaseAdmin";

const DEVICES_COLLECTION = "devices";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET - Health check
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Add-sessions endpoint is alive",
    firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    vercelCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
    hasServiceAccount: getAdminInfo().hasServiceAccount,
  });
}

// POST - Add sessions to device
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const debugId = crypto.randomUUID();
  try {
    const adminDb = getAdminDb();
    const { id } = await params;
    const body = await request.json();
    const { sessions } = body;

    console.log(`[add-sessions] ${debugId} device=${id} sessions=${sessions}`);

    if (typeof sessions !== "number" || !Number.isFinite(sessions) || sessions < 1) {
      return NextResponse.json(
        { ok: false, message: "Invalid session count", debugId },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection(DEVICES_COLLECTION).doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ ok: false, message: "Device not found", debugId }, { status: 404 });
    }

    await docRef.update({
      remainingSessions: FieldValue.increment(sessions),
      lastSeen: Date.now(),
    } as any);

    const updatedSnapshot = await docRef.get();
    const updatedData = updatedSnapshot.data();

    return NextResponse.json({
      ok: true,
      message: `Added ${sessions} sessions`,
      newTotal: updatedData?.remainingSessions,
      firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
      vercelCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
      debugId,
    });
  } catch (error) {
    const errorText =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    console.error(`[add-sessions] ${debugId} Error adding sessions:`, error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to add sessions",
        error: errorText,
        stack: error instanceof Error ? error.stack ?? "" : "",
        firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
        vercelCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
        hasServiceAccount: getAdminInfo().hasServiceAccount,
        serviceAccountProjectId: getAdminInfo().serviceAccountProjectId,
        debugId,
      },
      { status: 500 }
    );
  }
}








