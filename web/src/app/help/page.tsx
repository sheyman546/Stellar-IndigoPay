"use client";

import NewGiftSuccessModal from "@/components/gift/NewGiftSuccessModal";
import React, { useState } from "react";
import Button from "@/components/Button";

export default function HelpPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold font-br-firma">Help Center</h1>
      <p className="mt-4 text-[#717182] font-br-firma">
        Find answers to your questions about Zendvo.
      </p>

      <div className="mt-8">
        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#5A42DE] hover:bg-[#4E37CC] text-white px-6 py-2 rounded-lg font-br-firma"
        >
          Open Success Modal
        </Button>
      </div>

      <NewGiftSuccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        recipientName="John Eze"
      />
    </div>
  );
}
