import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../../../contexts/CartContext';
import { ToastProvider } from '../../../components/common';
import OrderConfirmPlaceholder from '../OrderConfirmPlaceholder';

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <CartProvider>
          <OrderConfirmPlaceholder />
        </CartProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('OrderConfirmPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows empty message when cart is empty', () => {
    renderPage();
    expect(screen.getByText('장바구니가 비어있습니다.')).toBeInTheDocument();
  });

  it('shows items when cart has items', () => {
    localStorage.setItem(
      'cart',
      JSON.stringify([{ menuItemId: 1, name: '김치찌개', price: 9000, quantity: 2 }]),
    );
    renderPage();
    expect(screen.getByText('김치찌개')).toBeInTheDocument();
    expect(screen.getByTestId('order-confirm-total')).toHaveTextContent('18,000원');
  });

  it('has a submit button', () => {
    localStorage.setItem(
      'cart',
      JSON.stringify([{ menuItemId: 1, name: '김치찌개', price: 9000, quantity: 1 }]),
    );
    renderPage();
    expect(screen.getByTestId('order-confirm-submit-button')).toBeInTheDocument();
  });
});
