type ValidationResult = { valid: true } | { valid: false; error: string; detail: string };

export const validateEmail = (email: string): boolean => {
  const emailRegex =
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const sanitizeInput = (input: string): string => {
  return input.trim();
};

export const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/[\s\-().]/g, "");
};

export const validatePhoneNumber = (phone: string): boolean => {
  const normalized = normalizePhoneNumber(phone);
  return /^\+?\d{7,15}$/.test(normalized);
};

export const sanitizePhoneNumber = (phone: string): string => {
  let sanitized = phone.trim();
  sanitized = normalizePhoneNumber(sanitized);
  
  if (!sanitized.startsWith('+')) {
    if (sanitized.startsWith('0')) {
      sanitized = '+234' + sanitized.substring(1);
    } else if (sanitized.startsWith('234')) {
      sanitized = '+' + sanitized;
    } else {
      sanitized = '+234' + sanitized;
    }
  }
  
  return sanitized;
};

export const validateE164PhoneNumber = (phone: string): boolean => {
  const normalized = normalizePhoneNumber(phone.trim());

  if (!normalized.startsWith('+') && normalized.startsWith('234')) {
    return false;
  }

  const sanitized = sanitizePhoneNumber(phone);
  
  if (!/^\+[1-9]\d{6,14}$/.test(sanitized)) {
    return false;
  }

  if (sanitized.startsWith('+234') && /^0+$/.test(sanitized.slice(4))) {
    return false;
  }

  return true;
};

