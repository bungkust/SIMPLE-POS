import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatRupiah, formatDateTime } from '@/lib/utils';

// Create styles for small thermal printer receipt (58mm width)
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 4,
    fontSize: 7,
    fontFamily: 'Helvetica',
    width: 226, // 58mm thermal printer width
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
    borderBottom: '1 solid #000000',
    paddingBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 4,
    textAlign: 'center',
  },
  receiptInfo: {
    fontSize: 6,
    color: '#999999',
    textAlign: 'center',
  },
  section: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingVertical: 1,
  },
  rowLabel: {
    fontSize: 6,
    color: '#666666',
  },
  rowValue: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#000000',
  },
  orderCode: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    backgroundColor: '#F0F0F0',
    padding: 4,
    textAlign: 'center',
    marginBottom: 6,
  },
  itemsTable: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 2,
    borderBottom: '1 solid #000000',
  },
  tableHeaderText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#000000',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 2,
    borderBottom: '1 solid #E0E0E0',
  },
  itemName: {
    flex: 3,
    fontSize: 6,
    color: '#000000',
  },
  itemQty: {
    flex: 1,
    fontSize: 6,
    color: '#666666',
    textAlign: 'center',
  },
  itemPrice: {
    flex: 2,
    fontSize: 6,
    color: '#000000',
    textAlign: 'right',
  },
  itemTotal: {
    flex: 2,
    fontSize: 6,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 8,
    paddingTop: 6,
    borderTop: '1 solid #000000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingVertical: 1,
  },
  totalLabel: {
    fontSize: 7,
    color: '#666666',
  },
  totalValue: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#000000',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTop: '2 solid #000000',
  },
  grandTotalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  paymentSection: {
    marginTop: 8,
    padding: 4,
    backgroundColor: '#F9F9F9',
    border: '1 solid #000000',
  },
  paymentTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
    textAlign: 'center',
  },
  paymentInfo: {
    fontSize: 6,
    color: '#666666',
    marginBottom: 2,
    textAlign: 'center',
  },
  bankInfo: {
    backgroundColor: '#FFFFFF',
    padding: 3,
    border: '1 solid #E0E0E0',
    marginTop: 4,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  bankLabel: {
    fontSize: 6,
    color: '#666666',
  },
  bankValue: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#000000',
  },
  footer: {
    marginTop: 12,
    paddingTop: 6,
    borderTop: '1 solid #000000',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 6,
    color: '#999999',
    marginBottom: 2,
  },
  qrCode: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#F0F0F0',
    color: '#000000',
    padding: 2,
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  statusPaid: {
    backgroundColor: '#E8F5E8',
    color: '#2D5A2D',
  },
  statusCancelled: {
    backgroundColor: '#FFE8E8',
    color: '#8B0000',
  },
  divider: {
    borderTop: '1 solid #000000',
    marginVertical: 4,
  },
  centerText: {
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
});

interface ReceiptPDFProps {
  order: any;
  items: any[];
  tenantInfo: any;
  paymentMethod?: any;
  qrisImageUrl?: string;
}

export function ReceiptPDF({ order, items, tenantInfo, paymentMethod, qrisImageUrl }: ReceiptPDFProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return [styles.statusBadge, styles.statusPaid];
      case 'CANCELLED':
        return [styles.statusBadge, styles.statusCancelled];
      default:
        return styles.statusBadge;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{tenantInfo?.tenant_name || 'Kopi Pendekar'}</Text>
          <Text style={styles.subtitle}>STRUK PEMBAYARAN</Text>
          <Text style={styles.receiptInfo}>
            {formatDateTime(order.created_at)}
          </Text>
        </View>

        {/* Order Code & Status */}
        <View style={styles.section}>
          <Text style={styles.orderCode}>{order.order_code}</Text>
          <Text style={getStatusStyle(order.status)}>{order.status}</Text>
        </View>

        <View style={styles.divider} />

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMASI PELANGGAN</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Nama:</Text>
            <Text style={styles.rowValue}>{order.customer_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>HP:</Text>
            <Text style={styles.rowValue}>{order.phone}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Ambil:</Text>
            <Text style={styles.rowValue}>{order.pickup_date}</Text>
          </View>
          {order.notes && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Catatan:</Text>
              <Text style={styles.rowValue}>{order.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ITEM PESANAN</Text>
          <View style={styles.itemsTable}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>Item</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Harga</Text>
              <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Total</Text>
            </View>
            
            {/* Table Rows */}
            {items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.itemName}>{item.name_snapshot}</Text>
                <Text style={styles.itemQty}>{item.qty}</Text>
                <Text style={styles.itemPrice}>{formatRupiah(item.price_snapshot)}</Text>
                <Text style={styles.itemTotal}>{formatRupiah(item.line_total)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatRupiah(order.subtotal)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Diskon:</Text>
              <Text style={[styles.totalValue, { color: '#2D5A2D' }]}>-{formatRupiah(order.discount)}</Text>
            </View>
          )}
          {order.service_fee > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Biaya Layanan:</Text>
              <Text style={styles.totalValue}>{formatRupiah(order.service_fee)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>{formatRupiah(order.total)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>PEMBAYARAN: {order.payment_method}</Text>
          
          {order.payment_method === 'QRIS' && qrisImageUrl && (
            <View>
              <Text style={styles.paymentInfo}>Scan QRIS untuk pembayaran:</Text>
              <Image style={styles.qrCode} src={qrisImageUrl} />
              <Text style={[styles.paymentInfo, styles.boldText]}>
                Total: {formatRupiah(order.total)}
              </Text>
            </View>
          )}

          {order.payment_method === 'TRANSFER' && paymentMethod && (
            <View style={styles.bankInfo}>
              <Text style={styles.paymentInfo}>Transfer ke:</Text>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Bank:</Text>
                <Text style={styles.bankValue}>{paymentMethod.bank_name}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>No. Rek:</Text>
                <Text style={styles.bankValue}>{paymentMethod.account_number}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>A/N:</Text>
                <Text style={styles.bankValue}>{paymentMethod.account_holder}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Total:</Text>
                <Text style={[styles.bankValue, styles.boldText]}>{formatRupiah(order.total)}</Text>
              </View>
            </View>
          )}

          {order.payment_method === 'COD' && (
            <Text style={styles.paymentInfo}>Bayar tunai saat mengambil pesanan</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Terima kasih atas pesanan Anda!</Text>
          <Text style={styles.footerText}>Pesanan akan segera diproses</Text>
          <Text style={styles.footerText}>
            {formatDateTime(order.created_at)}
          </Text>
          <Text style={styles.footerText}>
            {order.order_code}
          </Text>
        </View>
      </Page>
    </Document>
  );
}