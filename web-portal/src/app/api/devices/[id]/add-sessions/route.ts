import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  });
}

// POST - Add sessions to device
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sessions } = body;

    if (typeof sessions !== "number" || !Number.isFinite(sessions) || sessions < 1) {
      return NextResponse.json({ ok: false, message: "Invalid session count" }, { status: 400 });
    }

    const docRef = doc(db, DEVICES_COLLECTION, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ ok: false, message: "Device not found" }, { status: 404 });
    }

    await updateDoc(docRef, {
      remainingSessions: increment(sessions),
    });

    const updatedSnapshot = await getDoc(docRef);
    const updatedData = updatedSnapshot.data();

    return NextResponse.json({
      ok: true,
      message: `Added ${sessions} sessions`,
      newTotal: updatedData?.remainingSessions,
      firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
      vercelCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
    });
  } catch (error) {
    const errorText =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    console.error("[add-sessions] Error adding sessions:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to add sessions",
        error: errorText,
        firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
        vercelCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
      },
      { status: 500 }
    );
  }
}








