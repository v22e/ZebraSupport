import { DEMO_MODE } from "../config";

const DemoBanner = () => {
  if (!DEMO_MODE) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 border-b border-yellow-500 bg-yellow-300 px-4 py-2 text-center text-sm font-bold text-black">
      You are viewing demo data. Sign up to use ZebraSupport with your own data.
    </div>
  );
};

export default DemoBanner;