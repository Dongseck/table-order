import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { Button, ConfirmDialog } from '../../components/common';
import CartItem from './CartItem';
import styles from './CartDrawer.module.css';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleOrder = () => {
    onClose();
    navigate('/customer/order/confirm');
  };

  const handleClear = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
        onClick={onClose}
        data-testid="cart-drawer-overlay"
      />
      <div
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        data-testid="cart-drawer"
      >
        <div className={styles.header}>
          <span className={styles.headerTitle}>장바구니</span>
          <Button size="sm" variant="secondary" onClick={onClose} data-testid="cart-drawer-close">
            닫기
          </Button>
        </div>

        <div className={styles.body}>
          {items.length === 0 ? (
            <p className={styles.emptyMessage}>장바구니가 비어있습니다.</p>
          ) : (
            items.map((item) => <CartItem key={item.menuItemId} item={item} />)
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.totalRow}>
            <span>총 금액</span>
            <span data-testid="cart-drawer-total">{totalAmount.toLocaleString()}원</span>
          </div>
          <div className={styles.footerActions}>
            <Button
              variant="danger"
              size="sm"
              disabled={items.length === 0}
              onClick={() => setShowClearConfirm(true)}
              data-testid="cart-drawer-clear"
            >
              비우기
            </Button>
            <Button
              disabled={items.length === 0}
              onClick={handleOrder}
              data-testid="cart-drawer-order"
            >
              주문하기 ({items.length})
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        title="장바구니 비우기"
        message="장바구니를 비우시겠습니까?"
        danger
        onConfirm={handleClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
}
