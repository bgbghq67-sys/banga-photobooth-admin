import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminInfo } from "@/lib/firebaseAdmin";

const DEVICES_COLLECTION = "devices";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms at ${label}`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

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
  const start = Date.now();
  let stage = "start";
  try {
    stage = "init-admin";
    const adminDb = getAdminDb();

    stage = "read-params";
    const { id } = await params;

    stage = "parse-json";
    const body = await withTimeout(request.json(), 5000, "request.json()");
    const { sessions } = body;

    console.log(`[add-sessions] ${debugId} device=${id} sessions=${sessions}`);

    if (typeof sessions !== "number" || !Number.isFinite(sessions) || sessions < 1) {
      return NextResponse.json(
        { ok: false, message: "Invalid session count", debugId },
        { status: 400 }
      );
    }

    stage = "get-doc";
    const docRef = adminDb.collection(DEVICES_COLLECTION).doc(id);
    const snapshot = await withTimeout(docRef.get(), 8000, "docRef.get()");

    if (!snapshot.exists) {
      return NextResponse.json({ ok: false, message: "Device not found", debugId }, { status: 404 });
    }

    stage = "update-doc";
    await withTimeout(
      docRef.update({
        remainingSessions: FieldValue.increment(sessions),
        lastSeen: Date.now(),
      } as any),
      8000,
      "docRef.update()"
    );

    stage = "get-updated-doc";
    const updatedSnapshot = await withTimeout(docRef.get(), 8000, "docRef.get() after update");
    const updatedData = updatedSnapshot.data();

    return NextResponse.json({
      ok: true,
      message: `Added ${sessions} sessions`,
      newTotal: updatedData?.remainingSessions,
      firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
      vercelCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
      debugId,
      elapsedMs: Date.now() - start,
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
        stage,
        elapsedMs: Date.now() - start,
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








