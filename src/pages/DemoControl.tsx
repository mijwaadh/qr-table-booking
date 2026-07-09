import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  TrendingUp, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import TopNavBar from '../components/TopNavBar';

export const DemoControl: React.FC = () => {
  const [loadingAction, setLoadingAction] = useState<'NONE' | 'RESET' | 'RUSH' | 'SALES'>('NONE');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api';

  const triggerToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const handleAction = async (actionType: 'RESET' | 'RUSH' | 'SALES', endpoint: string) => {
    setLoadingAction(actionType);
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        triggerToast(data.message || 'Action executed successfully!');
      } else {
        triggerToast('Action failed. Check API server.');
      }
    } catch (e) {
      console.error(e);
      triggerToast('Network error while connecting to backend.');
    } finally {
      setLoadingAction('NONE');
    }
  };

  const handlePrintAllQRs = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow pop-ups for this site.');
      return;
    }
    
    let cardsHtml = '';
    for (let i = 1; i <= 10; i++) {
      const tableId = `T${i.toString().padStart(2, '0')}`;
      const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/order-now?table=${tableId}`)}`;
      
      cardsHtml += `
        <div class="qr-card">
          <div class="header">SERVEFLOW DEMO RESTAURANT</div>
          <div class="subtitle">SCAN & ORDER</div>
          <div class="qr-container">
            <img src="${qrDataUrl}" alt="QR code" />
          </div>
          <div class="table-number">Table ${i}</div>
          <div class="footer">Scan with your phone camera to order directly from your table.</div>
        </div>
      `;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Table QRs - ServeFlow</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap');
            body {
              margin: 0;
              padding: 0;
              background-color: white;
              font-family: 'Outfit', sans-serif;
              -webkit-print-color-adjust: exact;
            }
            .qr-card {
              width: 105mm; /* A6 Width */
              height: 148mm; /* A6 Height */
              box-sizing: border-box;
              border: 3px solid #006c49;
              border-radius: 16px;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              text-align: center;
              margin: 10px auto;
              page-break-after: always;
              position: relative;
              background: #f9f9ff;
            }
            .qr-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 6px;
              background: #006c49;
            }
            .header {
              font-size: 16px;
              font-weight: 900;
              color: #006c49;
              letter-spacing: 1px;
              margin-top: 10px;
            }
            .subtitle {
              font-size: 10px;
              font-weight: 600;
              color: #5d5e66;
              letter-spacing: 2px;
              margin-bottom: 10px;
            }
            .qr-container {
              background: white;
              padding: 10px;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
              border: 1px solid rgba(0,108,73,0.15);
              width: 150px;
              height: 150px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-container img {
              width: 100%;
              height: 100%;
            }
            .table-number {
              font-size: 24px;
              font-weight: 900;
              color: #1a1c1e;
              margin: 10px 0;
            }
            .footer {
              font-size: 9px;
              color: #5d5e66;
              line-height: 1.4;
              margin-bottom: 10px;
              max-width: 90%;
            }
            @media print {
              .qr-card {
                margin: 0;
                border: none;
                border-radius: 0;
                page-break-after: always;
              }
              body {
                background: white;
              }
            }
          </style>
        </head>
        <body>
          ${cardsHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      <TopNavBar title="Developer Demo Center" />

      <main className="p-xl overflow-y-auto">
        <div className="max-w-[1000px] mx-auto space-y-xl">
          
          {/* Welcome Banner */}
          <section className="bg-gradient-to-r from-primary to-emerald-600 rounded-2xl p-xl text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-xl opacity-10">
              <Sparkles className="w-48 h-48" />
            </div>
            <div className="relative z-10 max-w-xl">
              <h2 className="font-headline-lg text-2xl font-black mb-xs">Presentation Control Hub</h2>
              <p className="font-body-md text-sm text-emerald-100 mb-lg">
                Quick-launch utilities to control database states, generate presentation data, and download printable QR card tables. These settings synchronize instantly across all devices.
              </p>
              <div className="flex items-center gap-xs text-xs font-semibold bg-white/20 backdrop-blur-sm rounded-full py-1.5 px-md w-fit">
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-ping"></span>
                <span>Active Backend: {API_BASE_URL}</span>
              </div>
            </div>
          </section>

          {/* Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            
            {/* Reset Console */}
            <div className="bg-white p-xl rounded-xl border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-md">
                <div className="flex items-center gap-md">
                  <div className="p-md rounded-xl bg-red-50 text-red-600">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-base font-bold text-on-surface">Reset & Seed Environment</h3>
                    <p className="text-[11px] text-on-surface-variant">Clean state for a new demo</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Deletes all live orders, payment history, and configurations. It immediately seeds a clean **ServeFlow Demo Restaurant** with exactly **10 Tables** (T01 - T10) and **20 high-quality Menu Items**.
                </p>
              </div>
              <button 
                onClick={() => handleAction('RESET', '/demo/reset')}
                disabled={loadingAction !== 'NONE'}
                className="w-full mt-lg py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-sm disabled:opacity-50"
              >
                {loadingAction === 'RESET' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>Reset Database</span>
              </button>
            </div>

            {/* Simulated Lunch Rush */}
            <div className="bg-white p-xl rounded-xl border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-md">
                <div className="flex items-center gap-md">
                  <div className="p-md rounded-xl bg-amber-50 text-amber-600">
                    <Play className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-base font-bold text-on-surface">Simulate Lunch Rush</h3>
                    <p className="text-[11px] text-on-surface-variant">Generate random active orders</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Generates 4 active orders across tables (states: PENDING, PREPARING, READY) filled with random menu selections. Perfect to show immediate kitchen updates and cashier floor movements.
                </p>
              </div>
              <button 
                onClick={() => handleAction('RUSH', '/demo/lunch-rush')}
                disabled={loadingAction !== 'NONE'}
                className="w-full mt-lg py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-sm disabled:opacity-50"
              >
                {loadingAction === 'RUSH' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>Generate Rush Orders</span>
              </button>
            </div>

            {/* Simulated Completed Sales */}
            <div className="bg-white p-xl rounded-xl border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-md">
                <div className="flex items-center gap-md">
                  <div className="p-md rounded-xl bg-primary-container/10 text-primary">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-base font-bold text-on-surface">Simulate Sales History</h3>
                    <p className="text-[11px] text-on-surface-variant">Populate analytical reports</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Creates 15-20 completed orders with checkout history, tax details, and payment modes. This instantly populates the **Reports & Analytics** charts for a visually complete sales summary presentation.
                </p>
              </div>
              <button 
                onClick={() => handleAction('SALES', '/demo/simulate-sales')}
                disabled={loadingAction !== 'NONE'}
                className="w-full mt-lg py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-sm disabled:opacity-50"
              >
                {loadingAction === 'SALES' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                <span>Simulate Sales History</span>
              </button>
            </div>

            {/* Print QRs Sheet */}
            <div className="bg-white p-xl rounded-xl border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-md">
                <div className="flex items-center gap-md">
                  <div className="p-md rounded-xl bg-emerald-50 text-emerald-600">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-base font-bold text-on-surface">Download A6 QR Sheets</h3>
                    <p className="text-[11px] text-on-surface-variant">Print table cards for presentation</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Opens a print window formatted with printable table cards for all 10 tables (T01 - T10) containing restaurant headers, QR codes pointing to Vercel domain, and table number badges.
                </p>
              </div>
              <button 
                onClick={handlePrintAllQRs}
                className="w-full mt-lg py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print All QR Cards</span>
              </button>
            </div>

          </div>

          {/* Warning Banner */}
          <div className="p-md bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-md text-amber-800 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Important Notice:</span> Triggering data reset or rush simulation sends direct WebSockets broadcast events to all active client screens, which will refresh their local states instantly without page reload. Make sure you have other devices open to see this live synchronization in action!
            </div>
          </div>

        </div>
      </main>

      {/* Floating Status Toast */}
      {statusMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-slide-up">
          <div className="flex items-center gap-md px-lg py-3 rounded-full shadow-2xl glass-effect border border-primary/20 bg-white text-primary">
            <CheckCircle2 className="w-4 h-4 fill-primary text-white" />
            <span className="font-label-md text-xs font-bold whitespace-nowrap">{statusMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoControl;
