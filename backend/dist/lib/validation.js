"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateE164PhoneNumber = exports.sanitizePhoneNumber = exports.validatePhoneNumber = exports.normalizePhoneNumber = exports.sanitizeInput = exports.validatePassword = exports.validateEmail = void 0;
const validateEmail = (email) => {
    const emailRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
exports.validatePassword = validatePassword;
const sanitizeInput = (input) => {
    return input.trim();
};
exports.sanitizeInput = sanitizeInput;
const normalizePhoneNumber = (phone) => {
    return phone.replace(/[\s\-().]/g, "");
};
exports.normalizePhoneNumber = normalizePhoneNumber;
const validatePhoneNumber = (phone) => {
    const normalized = (0, exports.normalizePhoneNumber)(phone);
    return /^\+?\d{7,15}$/.test(normalized);
};
exports.validatePhoneNumber = validatePhoneNumber;
const sanitizePhoneNumber = (phone) => {
    let sanitized = phone.trim();
    sanitized = (0, exports.normalizePhoneNumber)(sanitized);
    if (!sanitized.startsWith('+')) {
        if (sanitized.startsWith('0')) {
            sanitized = '+234' + sanitized.substring(1);
        }
        else if (sanitized.startsWith('234')) {
            sanitized = '+' + sanitized;
        }
        else {
            sanitized = '+234' + sanitized;
        }
    }
    return sanitized;
};
exports.sanitizePhoneNumber = sanitizePhoneNumber;
const validateE164PhoneNumber = (phone) => {
    const normalized = (0, exports.normalizePhoneNumber)(phone.trim());
    if (!normalized.startsWith('+') && normalized.startsWith('234')) {
        return false;
    }
    const sanitized = (0, exports.sanitizePhoneNumber)(phone);
    if (!/^\+[1-9]\d{6,14}$/.test(sanitized)) {
        return false;
    }
    if (sanitized.startsWith('+234') && /^0+$/.test(sanitized.slice(4))) {
        return false;
    }
    return true;
};
exports.validateE164PhoneNumber = validateE164PhoneNumber;
