"use client";

import React from "react";
import Button from "@/components/Button";

export type SenderDetailsValues = {
  fullName: string;
  email: string;
  confirmEmail: string;
  imageName: string;
};

type SenderDetailsFormProps = {
  amountLabel: string;
  value: SenderDetailsValues;
  onChange: (next: SenderDetailsValues) => void;
  onContinue: () => void;
  onBack?: () => void;
  isLoading?: boolean;
};

const SenderDetailsForm: React.FC<SenderDetailsFormProps> = ({
  amountLabel,
  value,
  onChange,
  onContinue,
  onBack,
  isLoading = false,
}) => {
  const isSubmitDisabled =
    !value.fullName.trim() ||
    !value.email.trim() ||
    !value.confirmEmail.trim() ||
    value.email.trim().toLowerCase() !== value.confirmEmail.trim().toLowerCase();

  return (
    <div className="w-full px-3 py-6 md:py-8">
      <div className="w-full max-w-[360px] mx-auto rounded-3xl bg-[#FAFAFB] border border-[#EEEEF3] p-4 md:p-5">
        <h2 className="text-[32px] leading-7 font-semibold text-[#18181B]">
          Sender detail
        </h2>
        <p className="text-[10px] leading-4 text-[#717182] mt-2">
          Please provide your details as a sender
        </p>

        <p className="text-[12px] text-[#18181B] mt-3 font-medium">
          Upload your image(Optional)
        </p>
        <label className="mt-2 h-[138px] rounded-2xl border border-dashed border-[#E5E7EB] bg-[#F6F6FA] flex flex-col items-center justify-center cursor-pointer">
          <input
            type="file"
            accept="image}
        <div className="flex gap-3 mt-3">
          {onBack && (
            <Button
              onClick={onBack}
              disabled={isLoading}
              className="flex-1 h-8 rounded-[8px] bg-white border border-[#E5E7EB] text-[#18181B] text-[11px] font-semibold hover:bg-gray-50"
            >
              Back
            </Button>
          )}
          <Button
            onClick={onContinue}
            disabled={isSubmitDisabled || isLoading}
            isLoading={isLoading}
            className={`h-8 rounded-[8px] bg-[#5A42DE] hover:bg-[#4E37CC] text-[11px] ${
              onBack ? "flex-1" : "w-full"
            }`}
          >
            Gift {amountLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SenderDetailsForm;
