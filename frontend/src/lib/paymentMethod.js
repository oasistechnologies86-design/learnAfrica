const PAYMENT_METHOD_LABELS = {
  any: 'Any',
  card: 'Card',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  mtn_momo: 'Mobile Money',
  mtn_mobile_money: 'Mobile Money',
  vodafone_cash: 'Mobile Money',
  airteltigo_money: 'Mobile Money',
  coupon: 'Coupon',
};

export function formatPaymentMethod(value) {
  const key = String(value || '').trim().toLowerCase();
  if (!key) return 'Not recorded';
  if (PAYMENT_METHOD_LABELS[key]) return PAYMENT_METHOD_LABELS[key];
  return key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
