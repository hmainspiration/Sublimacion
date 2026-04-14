export const DEFAULT_WHATSAPP_NUMBER = '50557693382';

export const getWhatsAppLink = (message?: string, number: string = DEFAULT_WHATSAPP_NUMBER) => {
  const baseUrl = `https://wa.me/${number}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
};
