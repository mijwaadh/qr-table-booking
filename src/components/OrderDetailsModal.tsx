import React from 'react';
import type { Order } from '../types';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getTimingStatus } from '../utils/time';
import { 
  X, 
  Clock, 
  Table2, 
  AlertTriangle, 
  Printer, 
  CheckCircle, 
  XCircle, 
  ChefHat,
  Receipt,
  Check
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose }) => {
  const { updateOrderStatus, toggleItemCompleteInOrder } = useRestaurant();

  if (!order) return null;

  const timingInfo = getTimingStatus(order.elapsedMinutes, order.status);
  const isCompletedOrCancelled = order.status === 'COMPLETED' || order.status === 'CANCELLED';

  const handleStatusUpdate = (status: Order['status']) => {
    updateOrderStatus(order.id, status);
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow pop-ups for this site.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt #${order.id}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; max-width: 300px; margin: 0 auto; }
            h2 { text-align: center; margin-bottom: 5px; color: #006c49; }
            .meta { font-size: 12px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; font-size: 13px; margin: 6px 0; }
            .total { border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px; font-weight: bold; display: flex; justify-content: space-between; font-size: 16px; }
            .footer { text-align: center; font-size: 11px; margin-top: 20px; color: #666; }
          </style>
        </head>
        <body>
          <h2>ServeFlow Demo</h2>
          <div class="meta">
            <div><strong>Order:</strong> #${order.id}</div>
            <div><strong>Table:</strong> ${order.tableId}</div>
            <div><strong>Time Booked:</strong> ${order.time} (${order.elapsedMinutes}m)</div>
          </div>
          ${order.items.map(i => `
            <div class="item">
              <span>${i.quantity}x ${i.menuItem.name}</span>
              <span>₹${(i.menuItem.price * i.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="total">
            <span>Total Amount:</span>
            <span>₹${order.amount.toFixed(2)}</span>
          </div>
          <div class="footer">Thank you for dining with us!</div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-md animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-outline-variant/40 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-xl bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-start">
          <div className="flex items-center gap-md">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shadow-sm border border-primary/20">
              <Table2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-sm flex-wrap">
                <h3 className="font-display text-2xl font-black text-on-surface">Order #{order.id}</h3>
                <span className={`px-3 py-1 rounded-full font-label-md text-xs font-bold ${
                  order.status === 'PREPARING' ? 'status-preparing' :
                  order.status === 'PENDING' ? 'status-pending' :
                  order.status === 'READY' ? 'bg-primary/20 text-primary border border-primary/30' :
                  order.status === 'COMPLETED' ? 'status-completed' : 'bg-error/20 text-error font-semibold'
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="font-label-md text-sm text-on-surface-variant font-semibold mt-1 flex items-center gap-sm">
                <span>Table: <strong className="text-on-surface">{order.tableId}</strong></span>
                <span>•</span>
                <span>Booked: <strong className="text-on-surface">{order.time}</strong></span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Dynamic Timing Status Banner */}
        <div className={`px-xl py-3 border-b flex items-center justify-between text-sm ${timingInfo.colorClass}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{timingInfo.icon}</span>
            <span className="font-extrabold tracking-wide uppercase">
              {timingInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono font-bold text-sm bg-black/10 px-3 py-1 rounded-lg">
            <Clock className="w-4 h-4 animate-spin-slow" />
            <span>{order.elapsedMinutes}m</span>
          </div>
        </div>

        {order.elapsedMinutes >= 20 && !isCompletedOrCancelled && (
          <div className="bg-error/15 px-xl py-2.5 border-b border-error/30 flex items-center gap-sm text-error font-label-md text-xs font-bold animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>OPERATIONS WARNING: Maximum wait time (20 minutes) has been exceeded! Prioritize kitchen delivery immediately.</span>
          </div>
        )}

        {/* Modal Body: Items & Notes */}
        <div className="p-xl overflow-y-auto flex-1 space-y-lg custom-scrollbar">
          
          {order.allergyAlert && (
            <div className="bg-error/10 border border-error/30 rounded-2xl p-md flex items-center gap-md text-error">
              <div className="p-2 bg-error text-white rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-label-md font-extrabold text-xs uppercase tracking-wider">Kitchen Allergy Alert</p>
                <p className="font-body-md text-sm font-semibold">{order.allergyAlert}</p>
              </div>
            </div>
          )}

          <div>
            <h4 className="font-label-md text-xs font-bold uppercase tracking-wider text-outline mb-md flex items-center gap-xs">
              <ChefHat className="w-4 h-4 text-primary" />
              <span>Ordered Dishes ({order.items.length} items)</span>
            </h4>
            
            <div className="divide-y divide-outline-variant/20 border border-outline-variant/30 rounded-2xl overflow-hidden bg-surface-container-lowest">
              {order.items.map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-md flex items-center justify-between transition-colors ${
                    item.completed ? 'bg-surface-container-low/60' : 'hover:bg-surface-container-low/40'
                  }`}
                >
                  <div className="flex items-start gap-md flex-1">
                    <button 
                      type="button"
                      onClick={() => toggleItemCompleteInOrder(order.id, idx)}
                      title="Toggle Item Prepared Status"
                      className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                        item.completed ? 'bg-primary border-primary text-white' : 'border-outline-variant hover:border-primary bg-white'
                      }`}
                    >
                      {item.completed && <Check className="w-4 h-4 stroke-[3px]" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-sm">
                        <span className="font-headline-sm text-base font-bold text-primary">
                          {item.quantity}x
                        </span>
                        <span className={`font-headline-sm text-base font-bold text-on-surface ${
                          item.completed ? 'line-through decoration-2 opacity-60' : ''
                        }`}>
                          {item.menuItem.name}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="font-label-sm text-xs text-tertiary font-bold uppercase mt-1 bg-tertiary/10 px-2 py-0.5 rounded inline-block">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-md shrink-0">
                    <p className="font-label-md text-xs text-outline">₹{item.menuItem.price.toFixed(2)} each</p>
                    <p className="font-headline-sm text-base font-extrabold text-on-surface">
                      ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Summary Block */}
          <div className="bg-surface-container-low rounded-2xl p-lg border border-outline-variant/30 flex justify-between items-center">
            <div className="flex items-center gap-sm">
              <Receipt className="w-6 h-6 text-primary" />
              <div>
                <p className="font-label-md text-xs uppercase text-on-surface-variant font-bold">Total Bill Amount</p>
                <p className="text-[11px] text-outline">Includes taxes & charges</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-display text-3xl font-black text-primary">
                ₹{order.amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-lg bg-surface-container-low border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-md">
          <div className="flex items-center gap-sm">
            <button 
              onClick={handlePrintReceipt}
              className="flex items-center gap-xs px-4 py-2.5 rounded-xl border border-outline-variant bg-white hover:bg-surface-container-high font-label-md font-semibold text-sm transition-colors text-on-surface shadow-sm"
            >
              <Printer className="w-4 h-4 text-outline" />
              <span>Print Receipt</span>
            </button>
          </div>

          <div className="flex items-center gap-sm ml-auto">
            {!isCompletedOrCancelled && (
              <>
                {order.status !== 'PREPARING' && order.status !== 'READY' && (
                  <button 
                    onClick={() => handleStatusUpdate('PREPARING')}
                    className="px-5 py-2.5 rounded-xl bg-secondary text-white font-label-md font-bold text-sm shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-xs"
                  >
                    <span>Start Preparing</span>
                  </button>
                )}
                {order.status !== 'READY' && (
                  <button 
                    onClick={() => handleStatusUpdate('READY')}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white font-label-md font-bold text-sm shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-xs"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Ready</span>
                  </button>
                )}
                <button 
                  onClick={() => handleStatusUpdate('COMPLETED')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-label-md font-bold text-sm shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-xs"
                >
                  <span>Serve & Complete</span>
                </button>
                <button 
                  onClick={() => handleStatusUpdate('CANCELLED')}
                  className="px-4 py-2.5 rounded-xl border border-error/30 text-error hover:bg-error/10 font-label-md font-semibold text-sm transition-colors flex items-center gap-xs"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-label-md font-bold text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
