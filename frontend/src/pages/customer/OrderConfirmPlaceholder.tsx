import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { orderApi } from '../../api/order';
import { useToast } from '../../components/common';
import { Button } from '../../components/common';
import OrderSuccessModal from '../../components/customer/OrderSuccessModal';
import styles from './OrderConfirm.module.css';

export default function OrderConfirmPlaceholder() {
  const { items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyMessage}>장바구니가 비어있습니다.</p>
        <Button
          data-testid="order-confirm-back-button"
          onClick={() => navigate('/customer/menu')}
        >
          메뉴로 돌아가기
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await orderApi.create({
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        totalAmount,
      });
      setSuccessOrder(result.order.orderNumber);
      clearCart();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'ORDER_PRICE_MISMATCH') {
        toast.error('메뉴 가격이 변경되었습니다. 장바구니를 확인해주세요.');
      } else {
        toast.error(err.message || '주문에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOrder(null);
    navigate('/customer/menu');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>주문 확인</h1>

      <ul className={styles.itemList} data-testid="order-confirm-item-list">
        {items.map((item) => (
          <li key={item.menuItemId} className={styles.item}>
            <div>
              <div className={styles.itemName}>{item.name}</div>
              <div className={styles.itemDetail}>
                {item.price.toLocaleString()}원 x {item.quantity}
              </div>
            </div>
            <div>{(item.price * item.quantity).toLocaleString()}원</div>
          </li>
        ))}
      </ul>

      <div className={styles.totalBar}>
        <span>총 금액</span>
        <span data-testid="order-confirm-total">{totalAmount.toLocaleString()}원</span>
      </div>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          data-testid="order-confirm-cancel-button"
        >
          뒤로
        </Button>
        <Button
          onClick={handleSubmit}
          loading={isSubmitting}
          data-testid="order-confirm-submit-button"
        >
          주문하기
        </Button>
      </div>

      <OrderSuccessModal
        open={successOrder !== null}
        orderNumber={successOrder ?? 0}
        onClose={handleSuccessClose}
      />
    </div>
  );
}
