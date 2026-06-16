"use client";

import React, { useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface FocusTrapProps {
  
  isActive: boolean;
  
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  className?: string;
}


export const FocusTrap: React.FC<FocusTrapProps> = ({
  isActive,
  initialFocusRef,
  children,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(containerRef, isActive, { initialFocusRef });

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default FocusTrap;