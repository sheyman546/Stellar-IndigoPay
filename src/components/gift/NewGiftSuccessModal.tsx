"use client";

import React, { useEffect, useRef } from "react";
import Button from "@/components/Button";
import { Check, X } from "lucide-react";
import { launchCelebrationConfetti } from "@/lib/confetti";

type GiftSuccessModalProps = {
    isOpen: boolean;
    recipientName: string;
    onClose: () => void;
};

const NewGiftSuccessModal: React.FC<GiftSuccessModalProps> = ({
    isOpen,
    recipientName,
    onClose,
}) => {
    const hasFiredConfettiRef = useRef(false);

    useEffect(() => {
        if (!isOpen || hasFiredConfettiRef.current) {
            return;
        }

        hasFiredConfettiRef.current = true;
        return launchCelebrationConfetti();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCopyLink = () => {
        
        navigator.clipboard.writeText("https://zendvo.com/gift/12345");
        
        alert("Gift link copied to clipboard!");
    };

    return (
        <div className="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-[480px] h-auto sm:h-[420px] bg-white rounded-2xl shadow-2xl flex flex-col p-6 sm:p-8 gap-8 animate-in zoom-in-95 duration-200">
                {}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-6 sm:top-8 left-6 sm:left-8 text-[#18181B] hover:opacity-70 transition-opacity"
                    aria-label="Close modal"
                >
                    <X size={24} strokeWidth={1.5} />
                </button>

                <div className="flex flex-col items-center justify-center flex-1 gap-8 mt-4 sm:mt-0">
                    {}
                    <div className="relative w-25 h-25 flex items-center justify-center">
                        {}
                        <svg
                            width="100"
                            height="100"
                            viewBox="0 0 100 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="absolute pointer-events-none"
                        >
                            <circle cx="50" cy="18" r="1.5" fill="#00CA71" />
                            <circle cx="78" cy="28" r="1.5" fill="#00CA71" />
                            <circle cx="88" cy="50" r="1.5" fill="#00CA71" />
                            <circle cx="82" cy="74" r="1" fill="#00CA71" />
                            <circle cx="62" cy="90" r="2" fill="#00CA71" />
                            <circle cx="38" cy="90" r="1.5" fill="#00CA71" />
                            <circle cx="18" cy="74" r="1.5" fill="#00CA71" />
                            <circle cx="12" cy="50" r="2" fill="#00CA71" />
                            <circle cx="22" cy="28" r="1" fill="#00CA71" />
                            <circle cx="34" cy="16" r="1" fill="#00CA71" />
                        </svg>

                        {}
                        <div className="bg-[#e4faf0] p-3 rounded-full flex items-center justify-center">

                        <div className="w-14 h-14 bg-[#00CA71] rounded-full flex items-center justify-center z-10">
                           <Check className="text-white" size={24} strokeWidth={2.5} />
                        </div>
                        </div>
                    </div>

                    <div className="text-center flex flex-col gap-2">
                        <h3
                            className="text-[#18181B] text-[24px] sm:text-[28px] leading-tight font-br-firma"
                            style={{ fontWeight: 600 }}
                        >
                            Gift sent successfully
                        </h3>
                        <p className="text-[#717182] text-[14px] sm:text-[16px] leading-relaxed max-w-[340px] mx-auto font-br-firma">
                            You have successfully gifted {recipientName}. You will be receiving
                            email shortly
                        </p>
                    </div>

                    <Button
                        onClick={handleCopyLink}
                        className="w-full bg-[#5A42DE] hover:bg-[#4E37CC] text-white py-3 sm:py-4 rounded-xl text-[16px] font-medium font-br-firma transition-all active:scale-[0.98]"
                    >
                        Copy Link
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NewGiftSuccessModal;
