"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { launchCelebrationConfetti } from "@/lib/confetti";

interface GiftSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
}

const GiftSuccessModal: React.FC<GiftSuccessModalProps> = ({
  isOpen,
  onClose,
  recipientName,
}) => {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const hasFiredConfettiRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }

      if (e.key === "Tab" && isOpen && modalRef.current) {
        const focusableElements =
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
        if (focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 50);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || hasFiredConfettiRef.current) {
      return;
    }

    hasFiredConfettiRef.current = true;
    return launchCelebrationConfetti();
  }, [isOpen]);

  const handleDone = () => {
    onClose();
    router.push("/dashboard/sender");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 sm:bg-black/50 overflow-hidden sm:backdrop-blur-sm transition-all duration-300">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative flex flex-col items-center w-full h-full sm:h-auto sm:max-w-[420px] bg-white sm:rounded-2xl sm:shadow-2xl focus:outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
          >
            <div className="w-full flex items-center justify-start p-4 sm:p-6 pb-0">
              <button
                onClick={onClose}
                className="p-1 -ml-1 text-gray-800 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]"
                aria-label="Close modal"
              >
                <X size={32} strokeWidth={1} />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 w-full mx-auto pb-10 sm:pb-8">
              <div className="relative mb-12 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className="w-[100px] h-[100px] bg-[#e8fbf4] rounded-full flex items-center justify-center relative"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: 0.2,
                    }}
                    className="w-[60px] h-[60px] bg-[#00d084] rounded-full flex items-center justify-center relative z-10"
                  >
                    <Check size={36} className="text-white" strokeWidth={2.5} />
                  </motion.div>

                  <svg
                    className="absolute w-[180%] h-[180%] -m-[40%] text-[#00d084] z-0 pointer-events-none"
                    viewBox="0 0 100 100"
                    fill="currentColor"
                  >
                    <circle cx="50" cy="18" r="1.5" className="opacity-80" />
                    <circle cx="58" cy="18" r="2" />
                    <circle cx="68" cy="22" r="1" className="opacity-60" />

                    <circle cx="78" cy="35" r="2" />
                    <circle cx="82" cy="50" r="1.5" className="opacity-70" />
                    <circle cx="76" cy="65" r="2" className="opacity-90" />
                    <circle cx="80" cy="72" r="1" className="opacity-60" />

                    <circle cx="60" cy="80" r="2" className="opacity-80" />
                    <circle cx="50" cy="84" r="1.5" />
                    <circle cx="40" cy="82" r="2" className="opacity-70" />
                    <circle cx="34" cy="78" r="1" className="opacity-50" />

                    <circle cx="24" cy="65" r="2" className="opacity-90" />
                    <circle cx="20" cy="50" r="1.5" className="opacity-70" />
                    <circle cx="26" cy="35" r="2" className="opacity-80" />
                    <circle cx="32" cy="24" r="1.5" className="opacity-60" />
                  </svg>
                </motion.div>
              </div>

              <h2
                id="modal-title"
                className="text-[26px] font-bold text-gray-900 mb-6 text-center tracking-tight"
              >
                Gift sent successfully
              </h2>

              <div className="flex items-start justify-center text-gray-600 text-[16px] text-center w-full max-w-[320px] px-2 leading-relaxed">
                <div className="mt-[10px] mr-3 w-[5px] h-[5px] rounded-full bg-gray-500 shrink-0" />
                <p className="text-left font-medium text-gray-500">
                  You have successfully gifted {recipientName}. You will be
                  receiving email shortly
                </p>
              </div>
            </div>

            <div className="w-full p-4 sm:p-6 sm:pt-0 mt-auto sm:mt-0">
              <Button
                onClick={handleDone}
                className="w-full h-14 rounded-xl text-lg font-medium tracking-wide flex items-center justify-center bg-[#5F52FF] hover:bg-[#5F52FF]/95 transition-all text-white shadow-sm"
                variant="primary"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GiftSuccessModal;
