import { prisma } from "@/lib/prisma";

export async function logItemEvent(opts: {
  itemId: number;
  type: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorEmail?: string | null;
}) {
  return prisma.itemEvent.create({
    data: {
      itemId: opts.itemId,
      type: opts.type,
      fromStatus: opts.fromStatus ?? null,
      toStatus: opts.toStatus ?? null,
      actorEmail: opts.actorEmail ?? null,
    },
  });
}
