import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe('CartContext', () => {
  it('starts with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalAmount).toBe(0);
    expect(result.current.totalCount).toBe(0);
  });

  it('adds an item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ id: 1, name: '김치찌개', price: 9000 });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.totalAmount).toBe(9000);
  });

  it('increments quantity when adding same item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ id: 1, name: '김치찌개', price: 9000 });
      result.current.addItem({ id: 1, name: '김치찌개', price: 9000 });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalAmount).toBe(18000);
  });

  it('removes an item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ id: 1, name: '김치찌개', price: 9000 });
      result.current.removeItem(1);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it('updates quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ id: 1, name: '김치찌개', price: 9000 });
      result.current.updateQuantity(1, 5);
    });
    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalAmount).toBe(45000);
  });

  it('removes item when quantity set to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ id: 1, name: '김치찌개', price: 9000 });
      result.current.updateQuantity(1, 0);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it('clears the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ id: 1, name: '김치찌개', price: 9000 });
      result.current.addItem({ id: 2, name: '된장찌개', price: 9000 });
      result.current.clearCart();
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it('does not exceed 50 item types', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      for (let i = 1; i <= 51; i++) {
        result.current.addItem({ id: i, name: `메뉴${i}`, price: 1000 });
      }
    });
    expect(result.current.items).toHaveLength(50);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ id: 1, name: '김치찌개', price: 9000 });
    });
    const stored = JSON.parse(localStorage.getItem('cart') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].menuItemId).toBe(1);
  });
});
