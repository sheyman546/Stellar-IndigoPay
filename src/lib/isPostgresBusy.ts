
export function isPostgresBusyError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as { code?: string; message?: string };

  if (
    
    err.code === "40001" ||

    
    err.code === "40P01" ||

    
    err.code === "53300" ||

    
    err.message?.includes("deadlock detected") ||
    err.message?.includes("could not serialize access")
  ){
    return true
  }

  return false
}