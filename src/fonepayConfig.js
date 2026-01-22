// src/fonepayConfig.js
// Get these credentials from Fonepay dashboard
export const FONEPAY_CONFIG = {
  MERCHANT_CODE: "YOUR_MERCHANT_CODE", // Get from Fonepay
  MERCHANT_PASSWORD: "YOUR_MERCHANT_PASSWORD", // Get from Fonepay
  PAYMENT_GATEWAY_URL: "https://api.fonepay.com/api/v1/merchant/payment/initiate",
  VERIFY_URL: "https://api.fonepay.com/api/v1/merchant/payment/verify",
};

// Generate unique reference ID
export const generateRefId = () => {
  return "GHARSATHI-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
};
