import { NextResponse } from "next/server";
import { getServerDb, getServerInfo } from "@/lib/firestoreServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const debugId = crypto.randomUUID();
  try {
    const info = getServerInfo();
    const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
    const vercelCommitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? "";

    // If service account exists, also prove we can read devices collection (count only).
    let devicesCount: number | null = null;
    if (info.hasServiceAccount) {
      const db = getServerDb();
      const snap = await db.collection("devices").get();
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
          ...getServerInfo(),
        },
        vercel: {
          commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
        },
      },
      { status: 500 }
    );
  }
}


