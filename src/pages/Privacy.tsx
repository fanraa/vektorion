import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="pt-32 pb-20 container mx-auto px-4 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-xl border border-slate-100 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
        </div>

        <div className="space-y-8 text-slate-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              1. Data Collection
            </h2>
            <p className="font-normal">
              We collect minimal information necessary for cohort operations,
              including name, student ID (NIM), email address, and treasury transaction
              data. This data is used exclusively to ensure the transparency of the Physics ITERA 2025
              (Vektorion) cohort and facilitate smooth communication among members.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              2. Usage of Information
            </h2>
            <p className="font-normal">
              The information collected is used exclusively for internal cohort purposes,
              financial reporting, gallery management, activity agendas, and academic coordination.
              We do not sell, trade, or otherwise transfer your personally identifiable
              information to outside parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              3. Data Security
            </h2>
            <p className="font-normal">
              We implement various security measures to maintain the safety of your
              personal information. Access to sensitive administrative and financial data
              is strictly restricted to authorized cohort administrators (such as the president
              and treasurer).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              4. Use of Cookies
            </h2>
            <p className="font-normal">
              This site uses cookies to provide an optimal user experience, remember
              your session preferences, and simplify navigation across the application
              interface.
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
