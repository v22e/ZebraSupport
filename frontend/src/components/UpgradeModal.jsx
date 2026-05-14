import { useNavigate } from "react-router-dom";
import { getNextTierLabel } from "../utils/plans";

const UpgradeModal = ({ isOpen, onClose, context, onTalkToSales }) => {
  const navigate = useNavigate();

  if (!isOpen || !context) {
    return null;
  }

  const { type, limit, current, plan } = context;
  const planLabel = String(plan || "free").toUpperCase();

  const body =
    type === "users"
      ? `Your organisation has reached the maximum of ${limit} users on the ${planLabel} plan. Upgrade to add more team members.`
      : `Your organisation has reached ${current}/${limit} tickets this month on the ${planLabel} plan. Upgrade to continue receiving support requests.`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-xl border border-black bg-white p-6">
        <h3 className="text-3xl font-black">Plan Limit Reached</h3>
        <p className="mt-3 text-sm text-black/75">{body}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-black px-4 py-2 font-semibold hover:bg-zebra-gray"
          >
            Maybe Later
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/admin/billing");
            }}
            className="rounded-md border border-black bg-black px-4 py-2 font-bold text-white hover:bg-white hover:text-black"
          >
            View Plans
          </button>
        </div>

        <div className="mt-5 border-t border-black/10 pt-4 text-sm">
          <p className="text-black/70">Or book a demo directly:</p>
          <button
            type="button"
            onClick={() => onTalkToSales(getNextTierLabel(plan))}
            className="mt-2 font-bold underline"
          >
            Talk to Sales
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
