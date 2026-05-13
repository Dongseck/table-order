import { useCart } from '../../contexts/CartContext';
import { Button } from '../../components/common';
import type { CartItem as CartItemType } from '../../contexts/CartContext';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        borderBottom: '1px solid #f0f0f0',
      }}
      data-testid={`cart-item-${item.menuItemId}`}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>{item.name}</div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {item.price.toLocaleString()}원
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
          data-testid={`cart-item-${item.menuItemId}-decrease`}
        >
          -
        </Button>
        <span
          style={{ minWidth: '2rem', textAlign: 'center' }}
          data-testid={`cart-item-${item.menuItemId}-quantity`}
        >
          {item.quantity}
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
          disabled={item.quantity >= 99}
          data-testid={`cart-item-${item.menuItemId}-increase`}
        >
          +
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => removeItem(item.menuItemId)}
          data-testid={`cart-item-${item.menuItemId}-remove`}
        >
          X
        </Button>
      </div>
    </div>
  );
}
