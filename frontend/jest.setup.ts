// Adds custom jest matchers like toBeInTheDocument, toHaveTextContent, etc.
import "@testing-library/jest-dom";
// jest-axe custom matcher used by accessibility tests (toHaveNoViolations).
// The package ships without first-party types; the ambient shim at
// `frontend/types/jest-axe.d.ts` exposes the runtime shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations as unknown as () => Record<string, never>);
