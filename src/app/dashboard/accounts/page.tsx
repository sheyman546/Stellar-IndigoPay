import React from "react";
import BankSelection from "@/components/dashboard/accounts/BankSelection";

export const metadata = {
  title: "Link Bank Account | Zendvo",
  description: "Select the currency of the account you want to link.",
};

export default function AccountsPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center p-4 relative w-full overflow-hidden">
      {}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-[100px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 w-full">
        <BankSelection />
      </div>
    </main>
  );
}
