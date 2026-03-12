import { useEffect, useMemo, useState } from "react";
import DemoRequestModal from "../../components/DemoRequestModal";
import PlanBadge from "../../components/PlanBadge";
import { fetchCurrentBilling } from "../../api/billing";
import { useAuth } from "../../context/AuthContext";
import { getNextTierLabel } from "../../utils/plans";

const BillingPage = () => {
  const { user } = useAuth();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demoPlan, setDemoPlan] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCurrentBilling();
        setBilling(data);
      } catch (err) {
        setError(err.message || "Failed to load billing");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const usagePct = useMemo(() => {
    const used = Number(billing?.monthlyUsage?.tickets || 0);
    const limit = billing?.monthlyUsage?.limit;
    if (!limit) return 15;
    return Math.min(100, Math.round((used / limit) * 100));
  }, [billing]);

  if (loading) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading billing...</div>;
  }

  if (error) {
    return <div className="zebra-card p-6 text-red-700">{error}</div>;
  }

  const org = billing.organisation;
  const currentPlan = org.plan;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Billing & Plans</h1>
        <p className="text-sm text-black/70">Manage your ZebraSupport subscription options.</p>
      </div>

      <section className="zebra-card p-6">
        <p className="text-xs uppercase tracking-[0.12em] text-black/60">Current Plan</p>
        <div className="mt-2 flex items-center gap-3">
          <h2 className="text-3xl font-black">{String(currentPlan).toUpperCase()}</h2>
          <PlanBadge plan={currentPlan} />
        </div>
        <p className="mt-2 text-sm text-black/70">Member since {new Date(org.createdAt).toLocaleDateString()}</p>

        <ul className="mt-4 space-y-2 text-sm">
          <li>Users: {billing.currentPlan.maxUsers ?? "Unlimited"}</li>
          <li>Tickets/month: {billing.currentPlan.maxTickets ?? "Unlimited"}</li>
          <li>Analytics: {billing.currentPlan.analytics}</li>
          <li>CSV Export: {billing.currentPlan.csvExport ? "Included" : "Not included"}</li>
        </ul>

        <div className="mt-5">
          <p className="text-sm font-semibold">
            Current usage: {billing.monthlyUsage.tickets}/{billing.monthlyUsage.limit ?? "Unlimited"} tickets this month
          </p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-zebra-gray">
            <div className="h-full bg-black" style={{ width: `${usagePct}%` }} />
          </div>
        </div>
      </section>

      <section className="zebra-card overflow-x-auto p-4">
        <table className="min-w-full text-sm">
          <thead className="bg-zebra-gray/50 text-left uppercase tracking-[0.1em]">
            <tr>
              <th className="px-3 py-2">Feature</th>
              <th className="px-3 py-2">Free</th>
              <th className="px-3 py-2">Plus</th>
              <th className="px-3 py-2">Pro</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-black/10"><td className="px-3 py-2 font-semibold">Users</td><td className="px-3 py-2">3</td><td className="px-3 py-2">10</td><td className="px-3 py-2">Unlimited</td></tr>
            <tr className="border-t border-black/10"><td className="px-3 py-2 font-semibold">Tickets/month</td><td className="px-3 py-2">50</td><td className="px-3 py-2">500</td><td className="px-3 py-2">Unlimited</td></tr>
            <tr className="border-t border-black/10"><td className="px-3 py-2 font-semibold">Analytics</td><td className="px-3 py-2">Basic</td><td className="px-3 py-2">Full</td><td className="px-3 py-2">Full</td></tr>
            <tr className="border-t border-black/10"><td className="px-3 py-2 font-semibold">CSV Export</td><td className="px-3 py-2">No</td><td className="px-3 py-2">No</td><td className="px-3 py-2">Yes</td></tr>
            <tr className="border-t border-black/10"><td className="px-3 py-2 font-semibold">Support</td><td className="px-3 py-2">Community</td><td className="px-3 py-2">Email</td><td className="px-3 py-2">Dedicated</td></tr>
            <tr className="border-t border-black/10"><td className="px-3 py-2 font-semibold">Custom Branding</td><td className="px-3 py-2">No</td><td className="px-3 py-2">No</td><td className="px-3 py-2">Coming Soon</td></tr>
          </tbody>
        </table>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {["free", "plus", "pro"].map((plan) => {
          const isCurrent = plan === currentPlan;
          const isDowngrade = ["plus", "pro"].includes(currentPlan) && plan === "free";
          const buttonLabel = isCurrent ? "Current Plan" : isDowngrade ? "Contact Us" : "Book a Demo";

          return (
            <div key={plan} className={`zebra-card p-5 ${isCurrent ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase">{plan}</h3>
                <PlanBadge plan={plan} />
              </div>
              <p className="mt-2 text-sm text-black/70">
                {plan === "plus"
                  ? "Our team will set everything up for you"
                  : plan === "pro"
                    ? "Includes onboarding and dedicated support"
                    : "We can help find the right plan for your needs"}
              </p>

              <button
                type="button"
                disabled={isCurrent}
                onClick={() => setDemoPlan(plan)}
                className={`mt-4 w-full rounded-md border px-4 py-2 font-bold ${
                  isCurrent
                    ? "cursor-not-allowed border-black/20 bg-zebra-gray text-black/50"
                    : isDowngrade
                      ? "border-black text-black hover:bg-zebra-gray"
                      : "border-black bg-black text-white hover:bg-white hover:text-black"
                }`}
              >
                {buttonLabel}
              </button>
            </div>
          );
        })}
      </section>

      <p className="text-sm italic text-black/60">
        ZebraSupport is currently in demo mode. Payment integration coming soon. Plan changes are free during this period.
      </p>

      <DemoRequestModal
        isOpen={Boolean(demoPlan)}
        onClose={() => setDemoPlan(null)}
        interestedPlan={demoPlan || getNextTierLabel(currentPlan)}
        readOnlyPlan
        orgId={user?.orgId}
        initialValues={{
          name: user?.name || "",
          email: user?.email || "",
          company: user?.company || ""
        }}
      />
    </div>
  );
};

export default BillingPage;
