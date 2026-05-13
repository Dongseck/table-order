import { useCallback, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { Loading, useToast } from '../../components/common';
import type { Category, MenuItem } from '@shared/types/domain';
import styles from './CustomerMenu.module.css';

interface MenuData {
  categories: (Category & { items: MenuItem[] })[];
}

export default function CustomerMenuPage() {
  const toast = useToast();
  const fetchMenus = useCallback(() => api.get<MenuData>('/customer/menus'), []);
  const { data, loading, error } = useApi(fetchMenus);

  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const categories = useMemo(() => data?.categories ?? [], [data]);
  const activeCategory = useMemo(() => {
    if (categories.length === 0) return null;
    if (activeCategoryId === null) return categories[0];
    return categories.find((c) => c.id === activeCategoryId) ?? categories[0];
  }, [categories, activeCategoryId]);

  const items = activeCategory?.items ?? [];

  const handleAddToCart = (item: MenuItem) => {
    const cartRaw = localStorage.getItem('cart');
    const cart: { id: number; name: string; price: number; quantity: number }[] = cartRaw
      ? JSON.parse(cartRaw)
      : [];

    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success(`${item.name} 추가됨`);
  };

  if (loading) return <Loading />;
  if (error) return <div className={styles.empty}>메뉴를 불러올 수 없습니다.</div>;
  if (categories.length === 0) return <div className={styles.empty}>등록된 메뉴가 없습니다.</div>;

  return (
    <div className={styles.page}>
      <nav className={styles.tabs} role="tablist">
        {categories.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeCategory?.id === cat.id}
            className={`${styles.tab} ${activeCategory?.id === cat.id ? styles.tabActive : ''}`}
            onClick={() => setActiveCategoryId(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      {items.length === 0 ? (
        <div className={styles.empty}>이 카테고리에 메뉴가 없습니다.</div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <article key={item.id} className={styles.card}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className={styles.cardImage} />
              ) : (
                <div className={styles.cardImagePlaceholder}>🍽</div>
              )}
              <div className={styles.cardBody}>
                <h3 className={styles.cardName}>{item.name}</h3>
                {item.description && <p className={styles.cardDesc}>{item.description}</p>}
                <div className={styles.cardFooter}>
                  <span className={styles.cardPrice}>{item.price.toLocaleString()}원</span>
                  <button
                    className={styles.addBtn}
                    onClick={() => handleAddToCart(item)}
                    aria-label={`${item.name} 장바구니에 추가`}
                  >
                    +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
