import { NextResponse } from "next/server";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const DEVICES_COLLECTION = "devices";

// GET - List all devices
export async function GET() {
  try {
    const devicesRef = collection(db, DEVICES_COLLECTION);
    const q = query(devicesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const devices = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ ok: true, devices });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json({ ok: false, message: "Failed to fetch devices" }, { status: 500 });
  }
}

// POST - Create new device
export async function POST(request: Request) {
  try {
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

    const docRef = await addDoc(collection(db, DEVICES_COLLECTION), newDevice);

    return NextResponse.json({
      ok: true,
      device: { id: docRef.id, ...newDevice },
    });
  } catch (error) {
    console.error("Error creating device:", error);
    return NextResponse.json({ ok: false, message: "Failed to create device" }, { status: 500 });
  }
}

