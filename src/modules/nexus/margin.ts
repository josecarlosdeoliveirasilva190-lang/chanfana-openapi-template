const MIN_MARGIN_BRL = Number(process.env.MIN_MARGIN_BRL) || 7;

export interface MarginCheck {
  originalPrice: number;
  proposedPrice: number;
  margin: number;
  isValid: boolean;
  reason: string;
}

export function checkMargin(
  basePrice: number,
  proposedPrice: number,
  customMinMargin?: number
): MarginCheck {
  const minMargin = customMinMargin ?? MIN_MARGIN_BRL;
  const margin = basePrice - proposedPrice;
  const isValid = margin >= minMargin;

  return {
    originalPrice: basePrice,
    proposedPrice,
    margin,
    isValid,
    reason: isValid
      ? `Margem de R$${margin.toFixed(2)} aprovada (mínimo R$${minMargin.toFixed(2)})`
      : `Margem de R$${margin.toFixed(2)} insuficiente (mínimo R$${minMargin.toFixed(2)}) - compra cancelada`,
  };
}

export function calculateMinSellingPrice(
  basePrice: number,
  customMinMargin?: number
): number {
  const minMargin = customMinMargin ?? MIN_MARGIN_BRL;
  return basePrice - minMargin;
}
