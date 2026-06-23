import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="pt-32 pb-20 container mx-auto px-4 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-xl border border-slate-100 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Terms & Conditions
          </h1>
        </div>

        <div className="space-y-8 text-slate-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              1. Platform Usage
            </h2>
            <p className="font-normal">
              The Vektorion platform is specifically intended for Physics ITERA 2025
              cohort students. You agree to use this site only for lawful purposes
              and in accordance with the cohort's norms and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              2. Account & Security
            </h2>
            <p className="font-normal">
              Each member is responsible for the security of their own account.
              Using another member's data or unauthorized access to the administrator
              system area is strictly prohibited and may be subject to sanctions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              3. Transactions & Finance
            </h2>
            <p className="font-normal">
              Every recorded treasury payment or fee must be accompanied by a valid
              transfer receipt. Forging transaction receipts is a serious violation
              and will be dealt with according to the mutual agreement of the cohort.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              4. Policy Changes
            </h2>
            <p className="font-normal">
              The cohort administrators reserve the right to update or modify parts
              or all of these terms and conditions at any time according to the
              developing needs of the cohort, without prior notice.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <Link
            to="/home"
            className="inline-block px-8 py-3 bg-slate-900 text-white text-xs font-bold tracking-widest hover:bg-amber-500 transition-colors rounded-sm"
          >
            RETURN
          </Link>
        </div>
      </div>
    </div>
  );
}
