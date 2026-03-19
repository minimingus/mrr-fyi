import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMRR } from "@/lib/utils";
import { AdminActions } from "./admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>;
}) {
  const { secret } = await searchParams;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || secret !== adminSecret) {
    redirect("/");
  }

  const founders = await prisma.founder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      payments: {
        where: { active: true },
        select: { type: true },
      },
    },
  });

  return (
    <main
      className="min-h-screen px-4 py-12"
      style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Admin Dashboard
          </h1>
          <span
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            {founders.length} founders
          </span>
        </div>

        <div
          className="overflow-hidden rounded-lg border"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-card)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="border-b text-xs uppercase tracking-wider"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  <th className="px-4 py-3 font-medium">Founder</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium text-right">MRR</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {founders.map((founder) => {
                  const paymentTypes = founder.payments.map((p) => p.type);
                  const isFeatured = paymentTypes.includes("FEATURED");
                  const isVerified = paymentTypes.includes("VERIFIED");

                  return (
                    <tr
                      key={founder.id}
                      className="border-b transition-colors"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-4 py-3 font-medium">{founder.name}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`/${founder.slug}`}
                          className="underline decoration-dotted underline-offset-4 transition-colors hover:opacity-80"
                          style={{ color: "var(--amber)" }}
                        >
                          {founder.productName}
                        </a>
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {founder.email ?? "—"}
                      </td>
                      <td className="mono px-4 py-3 text-right">
                        {formatMRR(founder.mrr, founder.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {isFeatured && (
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                background: "var(--amber-glow)",
                                color: "var(--amber)",
                              }}
                            >
                              Featured
                            </span>
                          )}
                          {isVerified && (
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                background: "rgba(16, 185, 129, 0.12)",
                                color: "var(--emerald)",
                              }}
                            >
                              Verified
                            </span>
                          )}
                          {!isFeatured && !isVerified && (
                            <span
                              className="text-xs"
                              style={{ color: "var(--text-dim)" }}
                            >
                              Free
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 whitespace-nowrap"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {new Date(founder.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AdminActions
                          founderId={founder.id}
                          founderName={founder.name}
                          secret={secret}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
