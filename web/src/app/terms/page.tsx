"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Scale } from "lucide-react";

export default function TermsPage() {
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
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Scale size={32} />
          </div>
          <h1 className="text-4xl font-bold text-[#18181B]">
            Terms & Conditions
          </h1>
        </div>

        <p className="text-[#717182] text-lg leading-relaxed">
          Welcome to Zendvo. By using our services, you agree to comply with the
          following terms. Please read them carefully to understand your rights
          and responsibilities.
        </p>

        <div className="space-y-6 pt-4 text-[#18181B]">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p className="text-[#717182]">
              By accessing or usingzendvo.online, you agree to be bound by these
              Terms and Conditions and all applicable laws and regulations.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-3">2. Eligibility</h2>
            <p className="text-[#717182]">
              You must be at least 18 years old to use our services. By using
              Zendvo, you represent and warrant that you meet this requirement.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
