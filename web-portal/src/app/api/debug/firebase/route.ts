import { NextResponse } from "next/server";
import { getAdminInfo, getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const debugId = crypto.randomUUID();
  try {
    const info = getAdminInfo();
    const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
    const vercelCommitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? "";

    // If service account exists, also prove we can read devices collection (count only).
    let devicesCount: number | null = null;
    if (info.hasServiceAccount) {
      const db = getAdminDb();
      const snap = await db.collection("devices").select().get();
      devicesCount = snap.size;
    }

    return NextResponse.json({
      ok: true,
      debugId,
      firebase: {
        publicProjectId,
        serviceAccountProjectId: info.serviceAccountProjectId,
        hasServiceAccount: info.hasServiceAccount,
      },
      vercel: {
        commitSha: vercelCommitSha,
      },
      devicesCount,
      timestamp: Date.now(),
    });
  } catch (error) {
    const err =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack ?? "" }
        : { name: "Unknown", message: String(error), stack: "" };
    console.error(`[debug/firebase] ${debugId} error`, error);
    return NextResponse.json(
      {
        ok: false,
        debugId,
        error: err,
        firebase: {
          publicProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
          ...getAdminInfo(),
        },
        vercel: {
          commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
        },
      },
      { status: 500 }
    );
  }
}


