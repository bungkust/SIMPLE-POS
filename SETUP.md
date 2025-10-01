# Kopi Pendekar - Setup Instructions

## Database Setup

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the entire contents of `database-schema.sql`
4. Run the SQL script to create tables, set up RLS policies, and seed sample data

## Environment Variables

The following environment variables are already configured in `.env`:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_SITE_NAME` - App name (Kopi Pendekar)
- `VITE_ADMIN_EMAILS` - Comma-separated list of admin emails
- `VITE_PAYMENT_INFO_TEXT` - Payment instructions shown on invoice
- `VITE_QRIS_IMAGE_URL` - URL to QRIS payment QR code image
- `VITE_GOOGLE_SHEET_WEBHOOK_URL` - Google Apps Script webhook URL (optional)

### Google Sheets Integration (Optional)

To enable automatic order logging to Google Sheets:

1. Create a new Google Sheet named "Kopi Pendekar – Orders"
2. Add a sheet named "Orders" with these headers:
   - Timestamp, Order Code, Nama, Phone, PickupDate, Items, Subtotal, Discount, ServiceFee, Total, PaymentMethod, Status, Notes
3. Go to Extensions > Apps Script
4. Paste this code:

```javascript
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  ss.appendRow([
    new Date(),
    body.order_code,
    body.customer_name,
    body.phone,
    body.pickup_date,
    body.items_join,
    body.subtotal,
    body.discount || 0,
    body.service_fee || 0,
    body.total,
    body.payment_method,
    body.status,
    body.notes || ''
  ]);
  return ContentService.createTextOutput(JSON.stringify({ok:true}));
}
```

5. Deploy as Web App (Execute as: Me, Who has access: Anyone)
6. Copy the Web App URL and update `VITE_GOOGLE_SHEET_WEBHOOK_URL` in `.env`

## Admin Access

To access the admin dashboard:

1. Create a user in Supabase Authentication (Dashboard > Authentication > Users)
2. Add the user's email to `VITE_ADMIN_EMAILS` in `.env`
3. Login through the app using the Admin button

## Features

### Customer Features
- Browse menu with category filters and search
- View menu details with photos and descriptions
- Add items to cart with custom notes
- Checkout with customer info and payment method selection
- View invoice with payment instructions and QRIS code
- Download invoice as PDF
- View order history by phone number

### Admin Features
- View all orders with filtering by status
- Update order status (mark as paid/cancelled)
- Export orders to CSV
- Add/edit/delete menu items
- Toggle menu item visibility
- Manage categories

## Running the App

```bash
npm install
npm run dev
```

## Building for Production

```bash
npm run build
```

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (Database + Auth)
- jsPDF (PDF generation)
- Lucide React (Icons)

## Notes

- All prices are stored as integers in Rupiah (no decimals)
- Phone numbers are automatically normalized to +62 format
- Order codes are auto-generated in format: KP-YYMMDD-XXXXXX
- Cart data persists in localStorage
- RLS policies allow public read for menu/orders, authenticated write for admin