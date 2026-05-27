"use client";

import React from "react";
import { X } from "lucide-react";
import Button from "@/components/Button";

interface SignupSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export const SignupSuccessModal: React.FC<SignupSuccessModalProps> = ({
  isOpen,
  onClose,
  onProceed,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] md:rounded-[24px] w-full max-w-[360px] md:max-w-[420px] p-6 md:p-8 relative shadow-xl animate-in fade-in zoom-in duration-200">
        {}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 md:top-7 md:left-7 text-[#18181B] hover:text-[#52525B] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {}
        <div className="flex justify-center mt-10 md:mt-8 mb-6 md:mb-7">
          <div className="w-[100px] h-[100px] md:w-[110px] md:h-[110px] bg-gradient-to-br from-[#A59AFF] to-[#7C6FFF] rounded-full flex items-center justify-center relative">
            <div className="w-[88px] h-[88px] md:w-[96px] md:h-[96px] bg-[#6C5CE7] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-[42px] md:text-[48px]">🎉</span>
            </div>
          </div>
        </div>

        {}
        <div className="text-center mb-8 md:mb-9">
          <h2 className="text-[22px] md:text-[24px] font-bold text-[#18181B] mb-3 md:mb-4 leading-tight">
            Signup successful
          </h2>
          <p className="text-[14px] md:text-[15px] text-[#52525B] leading-relaxed px-2">
            start receiving surprises from the people who matter.
          </p>
        </div>

        {}
        <div>
          <Button
            variant="primary"
            className="w-full py-[18px] md:py-5 text-[15px] md:text-[16px] font-semibold rounded-[14px] md:rounded-[16px] bg-[#6C5CE7] hover:bg-[#5B4BC4] transition-all duration-200"
            onClick={onProceed}
          >
            Proceed to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
