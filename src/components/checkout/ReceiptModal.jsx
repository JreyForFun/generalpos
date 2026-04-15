import { Printer, X } from 'lucide-react';
import Modal from '../shared/Modal';
import { useSettingsStore } from '../../store/settingsStore';
import { cn } from '../../lib/cn';
import { formatCurrencyRaw } from '../../lib/formatCurrency';

/**
 * ReceiptModal — receipt preview and print.
 * Shows store info, items, totals, payment info, and customizable footer.
 */
export default function ReceiptModal({ isOpen, onClose, orderData, cashReceived, change, cashierName }) {
  if (!orderData) return null;

  const settings = useSettingsStore((s) => s.settings);
  const storeName = settings?.store_name || 'FLEXPOS';
  const receiptFooter = settings?.receipt_footer || 'Thank you! Please come again.';

  const handlePrint = async () => {
    const printContent = document.getElementById('receipt-content');
    if (!printContent) return;

    const html = `
      <html>
        <head>
          <title>Receipt #${orderData.orderNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 280px; margin: 0 auto; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .total-row { font-size: 14px; font-weight: bold; }
            h1 { font-size: 16px; margin: 0; }
            h2 { font-size: 14px; margin: 4px 0; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    // Use Electron's native print (works in packaged app)
    if (window.electronAPI?.printReceipt) {
      await window.electronAPI.printReceipt(html);
    } else {
      // Fallback for dev/browser mode
      const printWindow = window.open('', '_blank', 'width=300,height=600');
      printWindow.document.write(html + '<script>window.onload = () => { window.print(); window.close(); }<\/script>');
      printWindow.document.close();
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt" size="sm">
      <div className="flex flex-col gap-4">
        {/* Receipt Preview */}
        <div
          id="receipt-content"
          className="bg-white text-gray-900 p-6 rounded-lg font-mono text-[12px] leading-relaxed"
        >
          {/* Store Header */}
          <div className="text-center mb-3">
            <h1 className="text-[16px] font-bold tracking-wide">{storeName}</h1>
            <p className="text-[10px] text-gray-500 mt-1">Official Receipt</p>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Order Info */}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>Order:</span>
              <span className="font-bold">{orderData.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{dateStr} {timeStr}</span>
            </div>
            {cashierName && (
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{cashierName}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Items */}
          <div className="space-y-1">
            {orderData.items?.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="tabular-nums ml-2">
                    {formatCurrencyRaw((item.price * item.quantity) - (item.discount || 0))}
                  </span>
                </div>
                {(item.quantity > 1 || item.discount > 0) && (
                  <div className="text-[10px] text-gray-500 pl-2">
                    {item.quantity} × {formatCurrencyRaw(item.price)}
                    {item.discount > 0 && ` (-${formatCurrencyRaw(item.discount)})`}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Totals */}
          <div className="space-y-0.5">
            {orderData.discountAmount > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">{formatCurrencyRaw(orderData.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="tabular-nums">-{formatCurrencyRaw(orderData.discountAmount)}</span>
                </div>
              </>
            )}
            {orderData.tipAmount > 0 && (
              <div className="flex justify-between">
                <span>Tip:</span>
                <span className="tabular-nums">{formatCurrencyRaw(orderData.tipAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[14px] font-bold pt-1">
              <span>TOTAL:</span>
              <span className="tabular-nums">{formatCurrencyRaw(orderData.total)}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Payment Info */}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>Cash:</span>
              <span className="tabular-nums">{formatCurrencyRaw(cashReceived)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Change:</span>
              <span className="tabular-nums">{formatCurrencyRaw(change)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-dashed border-gray-300 my-2" />
          <div className="text-center text-[10px] text-gray-400">
            <p>{receiptFooter}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 h-12 rounded-xl bg-accent-primary text-text-inverse font-heading text-h3 font-semibold flex items-center justify-center gap-2 hover:bg-accent-primary-hover transition-colors"
          >
            <Printer size={18} />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="h-12 px-6 rounded-xl bg-bg-hover text-text-secondary font-medium hover:bg-bg-active hover:text-text-primary transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
