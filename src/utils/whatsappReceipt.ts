export interface ReceiptItemInfo {
  name?: string;
  menuItem?: any;
  quantity?: number;
  price?: number;
  [key: string]: any;
}

export interface ReceiptOrderInfo {
  invoiceNumber?: string;
  id?: string;
  tableId?: string;
  tableName?: string;
  items?: any[];
  subtotal?: number;
  gst?: number;
  serviceCharge?: number;
  total?: number;
  amount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  date?: string;
  time?: string;
  customerName?: string;
  customerPhone?: string;
  [key: string]: any;
}

/**
 * Reusable helper: generateReceiptMessage(order)
 * Returns formatted WhatsApp text for receipt sharing using Click-to-Chat.
 */
export const generateReceiptMessage = (order: ReceiptOrderInfo | any): string => {
  const invoice = order?.invoiceNumber || (order?.id ? `INV-${order.id}` : `INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const rawTable = order?.tableId || order?.tableName || 'T04';
  const table = rawTable.replace(/^Table\s*/i, 'T');

  const itemsArray = order?.items || [];
  const itemsList = itemsArray.map((item: any) => {
    const name = item?.menuItem?.name || item?.name || 'Item';
    const qty = item?.quantity || 1;
    let price = 0;
    if (item?.menuItem?.price !== undefined) {
      price = item.menuItem.price * qty;
    } else if (item?.price !== undefined) {
      price = item.price;
    }
    return `• ${name} x${qty} - ₹${Math.round(price)}`;
  }).join('\n');

  let subtotal = 0;
  if (order?.subtotal !== undefined) {
    subtotal = order.subtotal;
  } else if (order?.amount !== undefined && (!itemsArray || itemsArray.length === 0)) {
    subtotal = order.amount;
  } else {
    subtotal = itemsArray.reduce((s: number, i: any) => {
      const p = i?.menuItem?.price !== undefined ? i.menuItem.price * (i.quantity || 1) : (i?.price || 0);
      return s + p;
    }, 0);
  }

  const gst = order?.gst !== undefined ? order.gst : Math.round((subtotal * 0.05) * 100) / 100;
  const serviceCharge = order?.serviceCharge !== undefined ? order.serviceCharge : (subtotal > 0 ? 0 : 0);
  const total = order?.total !== undefined ? order.total : (order?.amount !== undefined ? order.amount : Math.round((subtotal + gst + serviceCharge) * 100) / 100);
  const method = order?.paymentMethod || 'Cash';

  return `Hello!
Thank you for visiting *ServeFlow Demo Restaurant* 🍽️

*Payment Successful* ✅
Invoice: ${invoice}
Table: ${table}
Items:
${itemsList || '• Order Dining x1 - ₹' + Math.round(subtotal)}

Subtotal: ₹${Math.round(subtotal)}
GST: ₹${Math.round(gst)}
Service Charge: ₹${Math.round(serviceCharge)}
*Total Paid: ₹${Math.round(total)}*
Payment Method: ${method}

Thank you for dining with us.
We hope to see you again!

Regards,
ServeFlow Restaurant`;
};

/**
 * Utility: openWhatsApp(phone, message)
 * Automatically URL encode the message and open https://wa.me/ in new browser tab without Meta Business API.
 */
export const openWhatsApp = (phone: string, message: string): void => {
  let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone) {
    alert('Please enter a valid WhatsApp mobile number.');
    return;
  }
  // If exactly 10 digits entered without country code, default to +91 (India)
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  window.open(url, '_blank');
};

/**
 * Generate and trigger download/print of a clean restaurant-style PDF receipt.
 */
export const downloadReceiptPDF = (order: ReceiptOrderInfo | any): void => {
  const invoice = order?.invoiceNumber || (order?.id ? `INV-${order.id}` : `INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const rawTable = order?.tableId || order?.tableName || 'T04';
  const table = rawTable.startsWith('Table') ? rawTable : `Table ${rawTable}`;
  const dateStr = order?.time || order?.date || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const itemsArray = order?.items || [];
  let subtotal = 0;
  if (order?.subtotal !== undefined) {
    subtotal = order.subtotal;
  } else if (order?.amount !== undefined && (!itemsArray || itemsArray.length === 0)) {
    subtotal = order.amount;
  } else {
    subtotal = itemsArray.reduce((s: number, i: any) => {
      const p = i?.menuItem?.price !== undefined ? i.menuItem.price * (i.quantity || 1) : (i?.price || 0);
      return s + p;
    }, 0);
  }

  const gst = order?.gst !== undefined ? order.gst : Math.round((subtotal * 0.05) * 100) / 100;
  const serviceCharge = order?.serviceCharge !== undefined ? order.serviceCharge : 0;
  const total = order?.total !== undefined ? order.total : (order?.amount !== undefined ? order.amount : Math.round((subtotal + gst + serviceCharge) * 100) / 100);
  const method = order?.paymentMethod || 'Cash / Online';
  const status = order?.paymentStatus || 'Paid';

  const itemsHtml = itemsArray.length > 0 
    ? itemsArray.map((item: any) => {
        const name = item?.menuItem?.name || item?.name || 'Item';
        const qty = item?.quantity || 1;
        const unitPrice = item?.menuItem?.price !== undefined ? item.menuItem.price : (item?.price !== undefined ? item.price / (qty || 1) : 0);
        const totalPrice = unitPrice * qty;
        return `
          <tr>
            <td style="text-align: left; padding: 10px 8px; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 500;">${name}</td>
            <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #f3f4f6; color: #4b5563;">${qty}</td>
            <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #f3f4f6; color: #4b5563;">₹${unitPrice.toFixed(2)}</td>
            <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 600;">₹${totalPrice.toFixed(2)}</td>
          </tr>
        `;
      }).join('')
    : `
        <tr>
          <td style="text-align: left; padding: 10px 8px; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 500;">Dine-In Settlement / Order Charges</td>
          <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #f3f4f6; color: #4b5563;">1</td>
          <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #f3f4f6; color: #4b5563;">₹${subtotal.toFixed(2)}</td>
          <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 600;">₹${subtotal.toFixed(2)}</td>
        </tr>
      `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to download or print the PDF receipt.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${invoice}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1f2937;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            line-height: 1.5;
          }
          .receipt-container {
            max-width: 650px;
            margin: 0 auto;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 36px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #d1d5db;
            padding-bottom: 24px;
            margin-bottom: 24px;
          }
          .header h1 {
            font-size: 26px;
            margin: 0;
            color: #047857;
            letter-spacing: -0.5px;
            font-weight: 800;
          }
          .header p {
            margin: 6px 0 0;
            color: #6b7280;
            font-size: 13px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #f1f5f9;
            margin-bottom: 28px;
          }
          .meta-item span {
            display: block;
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .meta-item strong {
            color: #0f172a;
            font-size: 15px;
            font-weight: 600;
          }
          .badge-paid {
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            padding: 3px 10px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 13px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 28px;
          }
          th {
            text-align: left;
            padding: 12px 8px;
            border-bottom: 2px solid #e2e8f0;
            color: #475569;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
          }
          .totals-section {
            border-top: 2px solid #e2e8f0;
            padding-top: 20px;
            margin-left: auto;
            width: 300px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 14px;
            color: #475569;
          }
          .total-row.grand-total {
            border-top: 2px dashed #cbd5e1;
            margin-top: 10px;
            padding-top: 14px;
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
          }
          .footer {
            text-align: center;
            margin-top: 36px;
            padding-top: 24px;
            border-top: 1px solid #f1f5f9;
            color: #64748b;
            font-size: 14px;
          }
          .footer-title {
            font-weight: 700;
            color: #047857;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1>ServeFlow Demo Restaurant</h1>
            <p>Modern Cuisine & Fine Spirits • GSTIN: 07AAACS1234A1Z5</p>
            <p>Official Tax Invoice & Dining Receipt</p>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span>Invoice Number</span>
              <strong>${invoice}</strong>
            </div>
            <div class="meta-item">
              <span>Date & Time</span>
              <strong>${dateStr}</strong>
            </div>
            <div class="meta-item">
              <span>Table Number</span>
              <strong>${table}</strong>
            </div>
            <div class="meta-item">
              <span>Payment Status</span>
              <span class="badge-paid">✅ ${status} (${method})</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Ordered Items</th>
                <th style="text-align: center; width: 15%;">Quantity</th>
                <th style="text-align: right; width: 17%;">Price</th>
                <th style="text-align: right; width: 18%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="total-row">
              <span>Subtotal</span>
              <span style="font-weight: 600;">₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>GST (5%)</span>
              <span style="font-weight: 600;">₹${gst.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Service Charge</span>
              <span style="font-weight: 600;">₹${serviceCharge.toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
              <span>Grand Total</span>
              <span style="color: #047857;">₹${total.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <div class="footer-title">Thank you for dining with us!</div>
            <div>We hope to see you again soon at ServeFlow Demo Restaurant.</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 12px;">This is a computer generated invoice and requires no signature.</div>
          </div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
};
