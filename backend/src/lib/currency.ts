export const supportedCurrencyCodes = ["NGN", "USD"] as const;
export type SupportedCurrencyCode = (typeof supportedCurrencyCodes)[number];