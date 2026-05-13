import { useEffect, useState } from 'react';
import { Modal } from '../../components/common';

interface OrderSuccessModalProps {
  open: boolean;
  orderNumber: number;
  onClose: () => void;
}

export default function OrderSuccessModal({ open, orderNumber, onClose }: OrderSuccessModalProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!open) {
      setCountdown(5);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="주문 완료">
      <div
        style={{ textAlign: 'center', padding: '2rem 1rem' }}
        data-testid="order-success-modal"
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#10003;</div>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>
          주문이 완료되었습니다!
        </h2>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>
          주문번호: {orderNumber}
        </p>
        <p style={{ color: '#888', marginTop: '1rem' }}>
          {countdown}초 후 메뉴 화면으로 이동합니다.
        </p>
      </div>
    </Modal>
  );
}
