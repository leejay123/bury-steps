export const RESET_CONFIRM_WORD = "delete";

export function isResetConfirmWord(raw: string): boolean {
  return raw.trim().toLowerCase() === RESET_CONFIRM_WORD;
}
