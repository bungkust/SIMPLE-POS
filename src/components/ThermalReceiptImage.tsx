import React, { useRef, useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/form-utils';

interface OrderItem {
  name_snapshot: string;
  price_snapshot: number;
  qty: number;
  notes?: string;
  line_total: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  payment_type: 'TRANSFER' | 'QRIS' | 'COD';
  is_active: boolean;
  sort_order: number;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
  qris_image_url?: string | null;
  qr_code?: string; // Fallback field
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  phone: string;
  pickup_date: string;
  subtotal: number;
  discount: number;
  service_fee: number;
  total: number;
  payment_method: string;
  status: string;
  notes?: string;
  created_at: string;
  order_items: OrderItem[];
  payment_methods: PaymentMethod[];
}

interface Tenant {
  name: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
}

interface ThermalReceiptImageProps {
  order: Order;
  tenant: Tenant;
  onImageGenerated?: (imageDataUrl: string) => void;
}

export const ThermalReceiptImage: React.FC<ThermalReceiptImageProps> = ({ 
  order, 
  tenant, 
  onImageGenerated 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageGenerated, setImageGenerated] = useState(false);
  
  const currentPaymentMethod = order.payment_methods.find(pm => pm.payment_type === order.payment_method);

  useEffect(() => {
    generateImage();
  }, [order, tenant]);

  const generateImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load QRIS image if available
    let qrisImage: HTMLImageElement | null = null;
    console.log('🔍 Current payment method:', currentPaymentMethod);
    console.log('🔍 Order payment method:', order.payment_method);
    console.log('🔍 Payment methods array:', order.payment_methods);
    
    if (currentPaymentMethod?.qris_image_url) {
      console.log('🔍 QRIS image URL:', currentPaymentMethod.qris_image_url);
      try {
        qrisImage = new Image();
        qrisImage.crossOrigin = 'anonymous';
        qrisImage.referrerPolicy = 'no-referrer';
        await new Promise((resolve, reject) => {
          qrisImage!.onload = () => {
            console.log('✅ QRIS image loaded successfully');
            resolve(true);
          };
          qrisImage!.onerror = (error) => {
            console.error('❌ QRIS image failed to load:', error);
            console.log('🔍 Trying fallback approach...');
            // Try without CORS
            const fallbackImage = new Image();
            fallbackImage.onload = () => {
              console.log('✅ QRIS fallback image loaded successfully');
              qrisImage = fallbackImage;
              resolve(true);
            };
            fallbackImage.onerror = (fallbackError) => {
              console.error('❌ QRIS fallback image also failed:', fallbackError);
              qrisImage = null;
              resolve(false);
            };
            fallbackImage.src = currentPaymentMethod.qris_image_url!;
          };
          qrisImage!.src = currentPaymentMethod.qris_image_url!;
        });
      } catch (error) {
        console.error('Error loading QRIS image:', error);
        qrisImage = null;
      }
    } else {
      console.log('❌ No QRIS image URL found');
    }

    // Set canvas size for thermal printer (300px width, dynamic height)
    const canvasWidth = 300;
    const lineHeight = 20;
    const padding = 10;
    
    // Calculate total height needed
    let totalHeight = padding * 2; // Top and bottom padding
    totalHeight += lineHeight * 3; // Header (name, address, phone)
    totalHeight += lineHeight * 2; // Separator
    totalHeight += lineHeight * 6; // Order info (6 lines)
    totalHeight += lineHeight * 2; // Separator
    totalHeight += order.order_items.length * (lineHeight * 2); // Items
    totalHeight += lineHeight * 2; // Separator
    totalHeight += lineHeight * 4; // Totals
    totalHeight += lineHeight * 2; // Separator
    totalHeight += lineHeight * 2; // Payment info
    if (currentPaymentMethod) {
      totalHeight += lineHeight * 3; // Payment details
    }
    if (order.notes) {
      totalHeight += lineHeight * 2; // Notes
    }
    totalHeight += lineHeight * 3; // Footer

    canvas.width = canvasWidth;
    canvas.height = totalHeight;

    // Set background to white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set font
    ctx.font = '12px monospace';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';

    let currentY = padding + lineHeight;

    // Header
    ctx.font = 'bold 14px monospace';
    ctx.fillText(tenant.name, canvasWidth / 2, currentY);
    currentY += lineHeight;

    if (tenant.address) {
      ctx.font = '10px monospace';
      ctx.fillText(tenant.address, canvasWidth / 2, currentY);
      currentY += lineHeight;
    }

    if (tenant.phone) {
      ctx.font = '10px monospace';
      ctx.fillText(`Telp: ${tenant.phone}`, canvasWidth / 2, currentY);
      currentY += lineHeight;
    }

    // Separator
    currentY += lineHeight;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(canvasWidth - padding, currentY);
    ctx.stroke();
    currentY += lineHeight;

    // Order info
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`No. Order: ${order.order_code}`, padding, currentY);
    currentY += lineHeight;
    ctx.fillText(`Tanggal: ${new Date(order.created_at).toLocaleDateString('id-ID')}`, padding, currentY);
    currentY += lineHeight;
    ctx.fillText(`Waktu: ${new Date(order.created_at).toLocaleTimeString('id-ID')}`, padding, currentY);
    currentY += lineHeight;
    ctx.fillText(`Customer: ${order.customer_name}`, padding, currentY);
    currentY += lineHeight;
    if (order.phone && order.phone !== 'Tidak ada') {
      ctx.fillText(`Telp: ${order.phone}`, padding, currentY);
      currentY += lineHeight;
    }
    // Status tidak ditampilkan di struk

    // Separator
    currentY += lineHeight;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(canvasWidth - padding, currentY);
    ctx.stroke();
    currentY += lineHeight;

    // Order items
    ctx.font = '10px monospace';
    order.order_items.forEach((item) => {
      ctx.fillText(item.name_snapshot, padding, currentY);
      currentY += lineHeight;
      ctx.fillText(`${item.qty} x ${formatCurrency(item.price_snapshot)} = ${formatCurrency(item.line_total)}`, padding + 10, currentY);
      currentY += lineHeight;
      if (item.notes) {
        ctx.fillText(`Note: ${item.notes}`, padding + 10, currentY);
        currentY += lineHeight;
      }
    });

    // Separator
    currentY += lineHeight;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(canvasWidth - padding, currentY);
    ctx.stroke();
    currentY += lineHeight;

    // Totals
    ctx.textAlign = 'right';
    ctx.fillText(`Subtotal: ${formatCurrency(order.subtotal)}`, canvasWidth - padding, currentY);
    currentY += lineHeight;
    if (order.discount > 0) {
      ctx.fillText(`Diskon: -${formatCurrency(order.discount)}`, canvasWidth - padding, currentY);
      currentY += lineHeight;
    }
    if (order.service_fee > 0) {
      ctx.fillText(`Biaya Layanan: ${formatCurrency(order.service_fee)}`, canvasWidth - padding, currentY);
      currentY += lineHeight;
    }
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`TOTAL: ${formatCurrency(order.total)}`, canvasWidth - padding, currentY);
    currentY += lineHeight;

    // Separator
    currentY += lineHeight;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(canvasWidth - padding, currentY);
    ctx.stroke();
    currentY += lineHeight;

    // Payment info
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Pembayaran: ${order.payment_method}`, padding, currentY);
    currentY += lineHeight;

    if (currentPaymentMethod) {
      if (order.payment_method === 'TRANSFER') {
        ctx.fillText(`Bank: ${currentPaymentMethod.bank_name || currentPaymentMethod.name}`, padding, currentY);
        currentY += lineHeight;
        ctx.fillText(`No. Rek: ${currentPaymentMethod.account_number}`, padding, currentY);
        currentY += lineHeight;
        ctx.fillText(`A/N: ${currentPaymentMethod.account_holder}`, padding, currentY);
        currentY += lineHeight;
      } else if (order.payment_method === 'QRIS') {
        ctx.fillText('Scan QR Code untuk pembayaran', padding, currentY);
        currentY += lineHeight;
        
        // Render QRIS image if available
        if (qrisImage) {
          console.log('🎨 Rendering QRIS image at position:', currentY);
          const qrSize = 80; // Size of QR code
          const qrX = (canvasWidth - qrSize) / 2; // Center horizontally
          ctx.drawImage(qrisImage, qrX, currentY, qrSize, qrSize);
          currentY += qrSize + lineHeight;
        } else if (currentPaymentMethod.qr_code) {
          console.log('📝 Rendering QRIS text fallback');
          // Fallback to text if image not available
          ctx.font = '8px monospace';
          ctx.fillText(currentPaymentMethod.qr_code, padding, currentY);
          currentY += lineHeight;
        } else {
          console.log('❌ No QRIS image or text available');
          // Create a placeholder QRIS box
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          const qrSize = 80;
          const qrX = (canvasWidth - qrSize) / 2;
          ctx.strokeRect(qrX, currentY, qrSize, qrSize);
          
          // Add text inside the box
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('QRIS', canvasWidth / 2, currentY + qrSize / 2 - 5);
          ctx.fillText('SCAN HERE', canvasWidth / 2, currentY + qrSize / 2 + 5);
          currentY += qrSize + lineHeight;
        }
      }
    }

    if (order.notes) {
      currentY += lineHeight;
      ctx.font = '10px monospace';
      ctx.fillText(`Catatan: ${order.notes}`, padding, currentY);
      currentY += lineHeight;
    }

    // Separator
    currentY += lineHeight;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(canvasWidth - padding, currentY);
    ctx.stroke();
    currentY += lineHeight;

    // Footer
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Terima kasih atas kunjungan Anda!', canvasWidth / 2, currentY);
    currentY += lineHeight;
    ctx.fillText(new Date().toLocaleString('id-ID'), canvasWidth / 2, currentY);

    // Generate image data URL
    const imageDataUrl = canvas.toDataURL('image/png');
    setImageGenerated(true);
    
    if (onImageGenerated) {
      onImageGenerated(imageDataUrl);
    }
  };

  return (
    <div style={{ display: 'none' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};
