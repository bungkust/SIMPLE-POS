import React from 'react';
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
  type: string;
  account_number?: string;
  account_holder?: string;
  qr_code?: string;
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

interface ThermalReceiptProps {
  order: Order;
  tenant: Tenant;
  onClose?: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ order, tenant, onClose }) => {
  const currentPaymentMethod = order.payment_methods.find(pm => pm.type === order.payment_method);
  
  const handlePrint = () => {
    window.print();
    if (onClose) {
      setTimeout(() => onClose(), 1000);
    }
  };

  React.useEffect(() => {
    // Auto print when component mounts
    const timer = setTimeout(() => {
      handlePrint();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="thermal-receipt">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .thermal-receipt, .thermal-receipt * {
            visibility: visible;
          }
          .thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
        
        .thermal-receipt {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.2;
          max-width: 300px;
          margin: 0 auto;
          padding: 10px;
          background: white;
          color: black;
        }
        
        .receipt-header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        
        .receipt-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .receipt-subtitle {
          font-size: 10px;
          margin-bottom: 5px;
        }
        
        .receipt-info {
          margin-bottom: 10px;
        }
        
        .receipt-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        
        .receipt-items {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 10px 0;
          margin: 10px 0;
        }
        
        .item-row {
          margin-bottom: 5px;
        }
        
        .item-name {
          font-weight: bold;
        }
        
        .item-details {
          font-size: 10px;
          margin-left: 10px;
        }
        
        .receipt-totals {
          margin: 10px 0;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        
        .final-total {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 5px 0;
          font-weight: bold;
          font-size: 14px;
        }
        
        .payment-info {
          border-top: 1px dashed #000;
          padding-top: 10px;
          margin-top: 10px;
        }
        
        .payment-method {
          text-align: center;
          margin: 10px 0;
        }
        
        .qr-code {
          text-align: center;
          margin: 10px 0;
        }
        
        .receipt-footer {
          text-align: center;
          border-top: 1px dashed #000;
          padding-top: 10px;
          margin-top: 10px;
          font-size: 10px;
        }
        
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .print-button:hover {
          background: #0056b3;
        }
        
        @media print {
          .print-button {
            display: none;
          }
        }
      `}</style>
      
      <button className="print-button" onClick={handlePrint}>
        🖨️ Print Struk
      </button>
      
      <div className="receipt-header">
        <div className="receipt-title">{tenant.name}</div>
        {tenant.address && (
          <div className="receipt-subtitle">{tenant.address}</div>
        )}
        {tenant.phone && (
          <div className="receipt-subtitle">Telp: {tenant.phone}</div>
        )}
        {tenant.whatsapp && (
          <div className="receipt-subtitle">WA: {tenant.whatsapp}</div>
        )}
      </div>
      
      <div className="receipt-info">
        <div className="receipt-row">
          <span>No. Order:</span>
          <span>{order.order_code}</span>
        </div>
        <div className="receipt-row">
          <span>Tanggal:</span>
          <span>{new Date(order.created_at).toLocaleDateString('id-ID')}</span>
        </div>
        <div className="receipt-row">
          <span>Waktu:</span>
          <span>{new Date(order.created_at).toLocaleTimeString('id-ID')}</span>
        </div>
        <div className="receipt-row">
          <span>Customer:</span>
          <span>{order.customer_name}</span>
        </div>
        {order.phone && order.phone !== 'Tidak ada' && (
          <div className="receipt-row">
            <span>Telp:</span>
            <span>{order.phone}</span>
          </div>
        )}
        {/* Status tidak ditampilkan di struk */}
      </div>
      
      <div className="receipt-items">
        {order.order_items.map((item, index) => (
          <div key={index} className="item-row">
            <div className="item-name">{item.name_snapshot}</div>
            <div className="item-details">
              {item.qty} x {formatCurrency(item.price_snapshot)} = {formatCurrency(item.line_total)}
            </div>
            {item.notes && (
              <div className="item-details">Note: {item.notes}</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="receipt-totals">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="total-row">
            <span>Diskon:</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}
        {order.service_fee > 0 && (
          <div className="total-row">
            <span>Biaya Layanan:</span>
            <span>{formatCurrency(order.service_fee)}</span>
          </div>
        )}
        <div className="total-row final-total">
          <span>TOTAL:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>
      
      <div className="payment-info">
        <div className="receipt-row">
          <span>Pembayaran:</span>
          <span>{order.payment_method}</span>
        </div>
        
        {currentPaymentMethod && (
          <div className="payment-method">
            {order.payment_method === 'QRIS' && currentPaymentMethod.qr_code && (
              <div className="qr-code">
                <div>Scan QR Code untuk pembayaran</div>
                <div style={{ fontSize: '8px', marginTop: '5px' }}>
                  {currentPaymentMethod.qr_code}
                </div>
              </div>
            )}
            
            {order.payment_method === 'TRANSFER' && (
              <div>
                <div className="receipt-row">
                  <span>Bank:</span>
                  <span>{currentPaymentMethod.name}</span>
                </div>
                <div className="receipt-row">
                  <span>No. Rek:</span>
                  <span>{currentPaymentMethod.account_number}</span>
                </div>
                <div className="receipt-row">
                  <span>A/N:</span>
                  <span>{currentPaymentMethod.account_holder}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {order.notes && (
        <div className="receipt-info">
          <div className="receipt-row">
            <span>Catatan:</span>
          </div>
          <div style={{ fontSize: '10px', marginTop: '2px' }}>
            {order.notes}
          </div>
        </div>
      )}
      
      <div className="receipt-footer">
        <div>Terima kasih atas kunjungan Anda!</div>
        <div style={{ marginTop: '5px' }}>
          {new Date().toLocaleString('id-ID')}
        </div>
      </div>
    </div>
  );
};
