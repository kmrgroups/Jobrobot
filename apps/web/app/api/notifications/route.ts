import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Never statically render/cache this route — the nav bell polls this.
export const dynamic = "force-dynamic";

// Powers the in-app notification bell. Returns the most recent notifications
// plus an unread count, polled every 30s from the nav bar.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.notification.count({ where: { userId, read: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

// Mark one notification (body.id) or all of a user's (body.userId, no id) as read.
export async function POST(req: NextRequest) {
  const { userId, id } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  if (id) {
    await db.notification.update({ where: { id }, data: { read: true } });
  } else {
    await db.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  }

  return NextResponse.json({ ok: true });
}
