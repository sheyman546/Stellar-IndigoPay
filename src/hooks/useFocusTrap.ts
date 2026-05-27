import { useEffect, useRef } from "react";


const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  "details > summary",
].join(", ");


function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (el) => !el.closest("[hidden]") && getComputedStyle(el).display !== "none"
  );
}


export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean,
  options?: { initialFocusRef?: React.RefObject<HTMLElement | null> }
) {
  
  const previouslyFocusedRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    
    previouslyFocusedRef.current = document.activeElement;

    
    const moveFocusIn = () => {
      const preferredEl = options?.initialFocusRef?.current;
      if (preferredEl) {
        preferredEl.focus();
        return;
      }
      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        
        container.focus();
      }
    };

    
    const rafId = requestAnimationFrame(moveFocusIn);

    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (e.shiftKey) {
        
        if (document.activeElement === firstEl || !container.contains(document.activeElement)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        
        if (document.activeElement === lastEl || !container.contains(document.activeElement)) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", handleKeyDown);

      
      if (
        previouslyFocusedRef.current &&
        typeof (previouslyFocusedRef.current as HTMLElement).focus === "function"
      ) {
        (previouslyFocusedRef.current as HTMLElement).focus();
      }
    };
  }, [isActive, containerRef, options?.initialFocusRef]);
}