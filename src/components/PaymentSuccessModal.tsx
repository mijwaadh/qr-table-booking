import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Download, 
  Home, 
  X, 
  Receipt, 
  MessageCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { generateReceiptMessage, openWhatsApp, downloadReceiptPDF, type ReceiptOrderInfo } from '../utils/whatsappReceipt';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderInfo: ReceiptOrderInfo | null;
  onBackToHome?: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  orderInfo,
  onBackToHome
}) => {
  const [showPhoneInputModal, setShowPhoneInputModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  if (!isOpen || !orderInfo) return null;

  // Extract clean digits from customerPhone
  const rawPhone = orderInfo.customerPhone || '';
  const cleanPhoneDigits = rawPhone.replace(/[^0-9]/g, '');
  const isPhoneAvailable = cleanPhoneDigits.length >= 10 && !rawPhone.toLowerCase().includes('joined');

  const handleShareWhatsAppClick = () => {
    if (isPhoneAvailable) {
      // Automatically use the customer's mobile number
      const message = generateReceiptMessage(orderInfo);
      openWhatsApp(cleanPhoneDigits, message);
    } else {
      // Open modal asking: Enter WhatsApp Number +91 ___________
      setPhoneInput(cleanPhoneDigits || '');
      setShowPhoneInputModal(true);
    }
  };

  const handleSendToEnteredPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim() || phoneInput.replace(/[^0-9]/g, '').length < 10) {
      alert('Please enter a valid 10-digit WhatsApp mobile number.');
      return;
    }
    const message = generateReceiptMessage(orderInfo);
    openWhatsApp(phoneInput.trim(), message);
    setShowPhoneInputModal(false);
  };

  const handleDownloadPDF = () => {
    downloadReceiptPDF(orderInfo);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      
      {/* Main Payment Success Card */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 relative transform transition-all duration-300 scale-100 flex flex-col items-center p-6 sm:p-8 text-center">
        
        {/* Subtle Decorative Gradient background at top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent pointer-events-none"></div>
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors z-10"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Green Success Icon */}
        <div className="relative mb-5 mt-2">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner animate-pulse">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 stroke-[2.2] animate-bounce" />
          </div>
          <div className="absolute -top-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-emerald-200 text-emerald-600">
            <Sparkles className="w-4 h-4 fill-emerald-500 animate-spin-slow" />
          </div>
        </div>

        {/* Large Payment Successful Header */}
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight leading-tight">
          Payment Successful
        </h2>
        <p className="text-sm text-gray-600 font-medium mt-1 mb-6">
          Thank you for dining with us.
        </p>

        {/* Order Info Summary Pill Card */}
        <div className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl p-4 mb-6 text-left space-y-2.5 shadow-2xs">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-200/60">
            <span className="flex items-center gap-1.5 text-gray-700">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>{orderInfo.invoiceNumber || (orderInfo.id ? `INV-${orderInfo.id}` : 'INV-1024')}</span>
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md text-[11px]">
              Paid • {orderInfo.paymentMethod || 'Online'}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm font-bold text-gray-800">
            <span>Table Number:</span>
            <span className="text-primary font-extrabold">{orderInfo.tableId || orderInfo.tableName || 'T04'}</span>
          </div>

          <div className="flex justify-between items-center text-sm font-bold text-gray-800">
            <span>Grand Total:</span>
            <span className="text-emerald-700 font-black text-lg">
              ₹{(orderInfo.total !== undefined ? orderInfo.total : orderInfo.amount || 0).toFixed(2)}
            </span>
          </div>
          
          {orderInfo.time && (
            <div className="flex justify-between items-center text-xs text-gray-500 pt-1 border-t border-gray-200/40 font-medium">
              <span>Date & Time:</span>
              <span>{orderInfo.time}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          
          {/* Button 1: Download Receipt (PDF) */}
          <button
            onClick={handleDownloadPDF}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Receipt (PDF)</span>
          </button>

          {/* Button 2: Share Receipt on WhatsApp */}
          <div className="relative">
            <button
              onClick={handleShareWhatsAppClick}
              className="w-full bg-gradient-to-r from-[#25D366] to-[#1ebc59] hover:from-[#22c35e] hover:to-[#1aa84f] text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-lg shadow-[#25D366]/25 hover:shadow-[#25D366]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
            >
              <MessageCircle className="w-5 h-5 fill-white stroke-none" />
              <span>Share Receipt on WhatsApp</span>
            </button>
            
            {/* Small helper link if user wants to change number */}
            {isPhoneAvailable && (
              <button
                onClick={() => {
                  setPhoneInput(cleanPhoneDigits);
                  setShowPhoneInputModal(true);
                }}
                className="text-[11px] text-gray-400 hover:text-emerald-600 font-semibold underline mt-1.5 transition-colors inline-block"
              >
                Send to a different WhatsApp number?
              </button>
            )}
          </div>

          {/* Button 3: Back to Home */}
          <button
            onClick={() => {
              if (onBackToHome) {
                onBackToHome();
              } else {
                onClose();
              }
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
          >
            <Home className="w-4 h-4 text-gray-500" />
            <span>Back to Home</span>
          </button>
        </div>

      </div>

      {/* Secondary Modal: Enter WhatsApp Number (+91 ___________) */}
      {showPhoneInputModal && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[260] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-5 border border-gray-200 text-left relative overflow-hidden animate-slide-up">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#25D366]/15 rounded-xl flex items-center justify-center text-[#25D366]">
                  <MessageCircle className="w-5 h-5 fill-[#25D366] stroke-none" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Enter WhatsApp Number</h3>
                  <p className="text-[11px] text-gray-500">Fast, free Click-to-Chat receipt sharing</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPhoneInputModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendToEnteredPhone} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1.5">
                  Mobile Number (10 Digits)
                </label>
                
                <div className="flex items-center border-2 border-gray-300 rounded-2xl overflow-hidden focus-within:border-[#25D366] focus-within:ring-4 focus-within:ring-[#25D366]/15 transition-all bg-gray-50">
                  <div className="bg-gray-200/80 px-3.5 py-3 font-extrabold text-gray-800 text-sm flex items-center gap-1 shrink-0 border-r border-gray-300/80 select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={15}
                    placeholder="___________"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-3 text-base font-bold text-gray-900 bg-transparent outline-none tracking-wider"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 font-medium">
                  We'll pre-fill your formatted receipt text and open WhatsApp in a new tab. Simply tap <strong className="text-gray-800">Send</strong>!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPhoneInputModal(false)}
                  className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-md shadow-[#25D366]/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <span>Open Chat</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentSuccessModal;
