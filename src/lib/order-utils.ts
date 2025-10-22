/**
 * Order processing utilities for delivery fees and minimum order validation
 */

import { AppConfig } from './database.types';

export interface OrderCalculation {
  subtotal: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  isFreeDelivery: boolean;
  total: number;
  minimumOrderMet: boolean;
  minimumOrderAmount: number;
}

/**
 * Calculate order totals including delivery fees
 */
export function calculateOrderTotals(
  subtotal: number,
  config: AppConfig
): OrderCalculation {
  const minimumOrderAmount = config.minimumOrderAmount || 0;
  const deliveryFee = config.deliveryFee || 0;
  const freeDeliveryThreshold = config.freeDeliveryThreshold || 0;
  
  const minimumOrderMet = subtotal >= minimumOrderAmount;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;
  const finalDeliveryFee = isFreeDelivery ? 0 : deliveryFee;
  const total = subtotal + finalDeliveryFee;

  return {
    subtotal,
    deliveryFee: finalDeliveryFee,
    freeDeliveryThreshold,
    isFreeDelivery,
    total,
    minimumOrderMet,
    minimumOrderAmount
  };
}

/**
 * Validate if order meets minimum requirements
 */
export function validateOrderRequirements(
  subtotal: number,
  config: AppConfig
): { isValid: boolean; errorMessage?: string } {
  const minimumOrderAmount = config.minimumOrderAmount || 0;
  
  if (minimumOrderAmount > 0 && subtotal < minimumOrderAmount) {
    return {
      isValid: false,
      errorMessage: `Minimum order amount is Rp ${minimumOrderAmount.toLocaleString('id-ID')}. Please add more items to your cart.`
    };
  }

  return { isValid: true };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Get delivery fee display text
 */
export function getDeliveryFeeText(
  subtotal: number,
  config: AppConfig
): string {
  const calculation = calculateOrderTotals(subtotal, config);
  
  if (calculation.isFreeDelivery) {
    return 'Gratis ongkir';
  }
  
  if (calculation.deliveryFee === 0) {
    return 'Tidak ada ongkir';
  }
  
  return `Ongkir: ${formatCurrency(calculation.deliveryFee)}`;
}

/**
 * Get free delivery progress text
 */
export function getFreeDeliveryProgressText(
  subtotal: number,
  config: AppConfig
): string | null {
  const freeDeliveryThreshold = config.freeDeliveryThreshold || 0;
  
  if (freeDeliveryThreshold === 0 || subtotal >= freeDeliveryThreshold) {
    return null;
  }
  
  const remaining = freeDeliveryThreshold - subtotal;
  return `Tambah ${formatCurrency(remaining)} lagi untuk gratis ongkir`;
}
