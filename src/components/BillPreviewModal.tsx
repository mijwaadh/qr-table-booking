import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import type { Order, MenuItem } from '../types';

interface BillPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  tableId?: string;
  tableName?: string;
  items?: { menuItem: MenuItem; quantity: number }[];
  amount?: number;
  time?: string;
  customerName?: string;
  orderType?: string;
}

export const BillPreviewModal: React.FC<BillPreviewModalProps> = ({
  isOpen,
  onClose,
  order,
  tableId,
  tableName,
  items: propItems,
  amount: propAmount,
  time: propTime,
  customerName = 'tata',
  orderType = 'PickUp'
}) => {
  if (!isOpen) return null;

  // Resolve items and totals from either Order object or props
  const resolvedItems = order ? order.items : propItems || [];
  const resolvedAmount = order ? order.amount : propAmount || 0;
  const resolvedTime = order ? order.time : propTime || '30 April 2024 12:19 PM';
  const resolvedTableId = order ? order.tableId : tableId || '';
  const resolvedTableName = tableName || (resolvedTableId ? `Table ${resolvedTableId}` : '');
  
  const totalQty = resolvedItems.reduce((sum, i) => sum + i.quantity, 0);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the receipt.');
      return;
    }

    const itemsHtml = resolvedItems.map((item, idx) => `
      <tr>
        <td style="text-align: left; padding: 4px 0;">${idx + 1}.${item.menuItem.name}</td>
        <td style="text-align: center; padding: 4px 0;">${item.quantity}</td>
        <td style="text-align: right; padding: 4px 0;">${item.menuItem.price}</td>
        <td style="text-align: right; padding: 4px 0;">${item.menuItem.price * item.quantity}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Order ${order ? `#${order.id}` : resolvedTableId}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 5mm;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 70mm;
              margin: 0 auto;
              padding: 10px 0;
              color: #000;
              background: #fff;
              font-size: 13px;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .dashed-line {
              border-top: 1px dashed #000;
              margin: 8px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              font-weight: bold;
              padding: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="text-center font-bold" style="font-size: 15px;">Sagar Ratna India</div>
          <div class="text-center" style="font-size: 11px; margin-top: 4px;">
            C-52, Janpath Rd, Atul Grove Road, Janpath, Connaught Place, New Delhi, Delhi 110001
          </div>
          <div class="text-center" style="font-size: 12px; margin-top: 6px;">
            ${resolvedTime}
          </div>
          <div class="text-center font-bold" style="font-size: 14px; margin-top: 4px;">
            ${resolvedTableId ? `Dine-In • ${resolvedTableName}` : orderType}
          </div>
          
          <div class="dashed-line"></div>
          <div style="font-size: 13px; font-weight: 500;">
            ${resolvedTableName || customerName}
          </div>
          <div class="dashed-line"></div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="dashed-line"></div>
          
          <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span>Total Qty : ${totalQty}</span>
            <span class="font-bold">Total Amount : Rs ${resolvedAmount.toFixed(2)}</span>
          </div>

          <div class="text-center font-bold" style="font-size: 16px; margin-top: 12px; margin-bottom: 4px;">
            Grand Total : Rs ${resolvedAmount.toFixed(2)}
          </div>

          <div class="dashed-line"></div>
          <div class="text-center" style="font-size: 11px; margin-top: 10px; opacity: 0.8;">
            Thank you for dining with us!
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadPDF = () => {
    handlePrint();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
      <div 
        className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Title Bar */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-800">Preview Receipt</h3>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body matching classic layout */}
        <div className="p-5 overflow-y-auto max-h-[75vh] font-mono text-xs text-gray-900 bg-white select-text">
          
          {/* Restaurant Header */}
          <div className="text-center space-y-1">
            <h4 className="font-semibold text-sm text-black font-sans">Sagar Ratna India</h4>
            <p className="text-[11px] text-gray-600 leading-snug font-sans">
              C-52, Janpath Rd, Atul Grove Road, Janpath, Connaught Place, New Delhi, Delhi 110001
            </p>
            <p className="text-[11px] font-normal text-gray-700 pt-0.5">
              {resolvedTime}
            </p>
            <p className="font-medium text-xs text-gray-800 pt-0.5 font-sans">
              {resolvedTableId ? `Dine-In • ${resolvedTableName}` : orderType}
            </p>
          </div>

          {/* Dashed Separator */}
          <div className="border-t border-dashed border-gray-300 my-3"></div>

          {/* Customer / Note Reference */}
          <div className="font-medium text-xs text-gray-800">
            {resolvedTableName || customerName}
          </div>

          {/* Dashed Separator */}
          <div className="border-t border-dashed border-gray-300 my-3"></div>

          {/* Items Table */}
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-700 font-medium">
                <th className="py-1 w-[48%]">Item</th>
                <th className="py-1 text-center w-[16%]">Qty</th>
                <th className="py-1 text-right w-[18%]">Rate</th>
                <th className="py-1 text-right w-[18%]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-normal">
              {resolvedItems.map((item, idx) => (
                <tr key={idx} className="leading-relaxed text-gray-800">
                  <td className="py-1.5 pr-1 break-words">
                    {idx + 1}.{item.menuItem.name}
                  </td>
                  <td className="py-1.5 text-center">{item.quantity}</td>
                  <td className="py-1.5 text-right">{item.menuItem.price}</td>
                  <td className="py-1.5 text-right font-medium">
                    {item.menuItem.price * item.quantity}
                  </td>
                </tr>
              ))}
              {resolvedItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-400 italic">No items listed</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Dashed Separator */}
          <div className="border-t border-dashed border-gray-300 my-3"></div>

          {/* Totals Summary Row */}
          <div className="flex justify-between items-center text-xs font-medium text-gray-800">
            <span>Total Qty : {totalQty}</span>
            <span>Total Amount : Rs {resolvedAmount.toFixed(2)}</span>
          </div>

          {/* Grand Total Row */}
          <div className="text-center font-semibold text-sm text-gray-900 mt-3 mb-1">
            Grand Total : Rs {resolvedAmount.toFixed(2)}
          </div>

          {/* Dashed Separator */}
          <div className="border-t border-dashed border-gray-300 my-3"></div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleDownloadPDF}
            title="Download / Print"
            className="p-2 rounded-lg border border-gray-300 hover:bg-white text-gray-700 transition-colors flex items-center justify-center font-medium text-xs shadow-2xs"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 text-white px-3.5 py-2 rounded-lg font-medium text-xs hover:bg-slate-700 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default BillPreviewModal;
