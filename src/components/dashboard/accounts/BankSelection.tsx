"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Building2 } from "lucide-react";
import clsx from "clsx";

const currencies = [
  {
    id: "USD",
    code: "USD",
    name: "US Dollar",
    flag: "🇺🇸",
  },
];

export default function BankSelection() {
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedCurrency) return;
    
    console.log(`Proceeding with currency: ${selectedCurrency}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]"
    >
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 font-br-firma">
          Link Bank Account
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Select the currency of the account you want to link. We currently support USD accounts.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {currencies.map((currency) => {
          const isSelected = selectedCurrency === currency.id;

          return (
            <motion.button
              key={currency.id}
              onClick={() => setSelectedCurrency(currency.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                "relative w-full flex items-center p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden",
                isSelected
                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 dark:border-indigo-500"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
              )}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 animate-shine pointer-events-none" />
              )}
              
              <div className="flex items-center space-x-4 flex-1 z-10">
                <div className="text-3xl filter drop-shadow-sm">
                  {currency.flag}
                </div>
                <div>
                  <h3 className={clsx("font-semibold text-lg leading-tight", isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-zinc-900 dark:text-zinc-100")}>
                    {currency.code}
                  </h3>
                  <p className={clsx("text-sm", isSelected ? "text-indigo-600 dark:text-indigo-300" : "text-zinc-500 dark:text-zinc-400")}>
                    {currency.name}
                  </p>
                </div>
              </div>

              <div className="z-10 ml-4 flex items-center justify-center w-6 h-6">
                {isSelected ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </motion.div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700 transition-colors duration-300 group-hover:border-indigo-300" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={handleContinue}
        disabled={!selectedCurrency}
        className={clsx(
          "w-full flex items-center justify-center py-4 rounded-2xl font-semibold text-white transition-all duration-300",
          selectedCurrency
            ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 translate-y-0"
            : "bg-zinc-300 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-600 cursor-not-allowed opacity-70"
        )}
        whileHover={selectedCurrency ? { scale: 1.01 } : {}}
        whileTap={selectedCurrency ? { scale: 0.98 } : {}}
      >
        <span>Continue</span>
        <ArrowRight className="w-5 h-5 ml-2" />
      </motion.button>
    </motion.div>
  );
}
