"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white p-8 md:p-16 max-w-4xl mx-auto">
      <Link
        href="/auth/login"
        className="inline-flex items-center text-[#5A42DE] font-medium hover:underline mb-12"
      >
        <ChevronLeft size={20} />
        Back to login
      </Link>

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-4xl font-bold text-[#18181B]">Privacy Policy</h1>
        </div>

        <p className="text-[#717182] text-lg leading-relaxed">
          At Zendvo, your privacy is our top priority. We are committed to
          protecting your personal data and ensuring that your experience on our
          platform is safe and secure.
        </p>

        <div className="space-y-6 pt-4 text-[#18181B]">
          <section>
            <h2 className="text-2xl font-bold mb-3">
              1. Information We Collect
            </h2>
            <p className="text-[#717182]">
              We collect information you provide directly to us when you create
              an account, make a transaction, or communicate with our support
              team.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-3">2. How We Use Your Data</h2>
            <p className="text-[#717182]">
              Your information is used to facilitate gifts, process payments,
              and improve the quality of our services. We never sell your
              personal information to third parties.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
