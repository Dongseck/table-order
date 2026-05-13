import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import {
  Button,
  Loading,
  Modal,
  Input,
  TextArea,
  ConfirmDialog,
  useToast,
} from '../../components/common';
import type { Category, MenuItem } from '@shared/types/domain';
import styles from './MenuManage.module.css';

// ── Types ───────────────────────────────────────────────────────

interface CategoryListData {
  categories: Category[];
}

interface MenuItemListData {
  menuItems: MenuItem[];
}

// ── Main Component ──────────────────────────────────────────────

export default function MenuManagePage() {
  const toast = useToast();

  // Categories
  const fetchCategories = useCallback(() => api.get<CategoryListData>('/admin/categories'), []);
  const catApi = useApi(fetchCategories);
  const categories = useMemo(() => catApi.data?.categories ?? [], [catApi.data]);

  const [activeCatId, setActiveCatId] = useState<number | null>(null);
  useEffect(() => {
    if (categories.length > 0 && activeCatId === null) {
      setActiveCatId(categories[0].id);
    }
  }, [categories, activeCatId]);

  // Menu Items
  const fetchMenuItems = useCallback(
    () => api.get<MenuItemListData>('/admin/menus', { query: { categoryId: activeCatId ?? undefined } }),
    [activeCatId],
  );
  const menuApi = useApi(fetchMenuItems, { auto: false });
  useEffect(() => {
    if (activeCatId !== null) void menuApi.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCatId]);

  const menuItems = menuApi.data?.menuItems ?? [];

  // ── Category CRUD ──────────────────────────────────────────

  const [newCatName, setNewCatName] = useState('');
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [deleteCatTarget, setDeleteCatTarget] = useState<Category | null>(null);

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    await api.post('/admin/categories', { body: { name } });
    setNewCatName('');
    toast.success('카테고리 추가됨');
    await catApi.run();
  };

  const handleUpdateCategory = async () => {
    if (editCatId === null) return;
    const name = editCatName.trim();
    if (!name) return;
    await api.patch(`/admin/categories/${editCatId}`, { body: { name } });
    setEditCatId(null);
    toast.success('카테고리 수정됨');
    await catApi.run();
  };

  const handleDeleteCategory = async () => {
    if (!deleteCatTarget) return;
    try {
      await api.delete(`/admin/categories/${deleteCatTarget.id}`);
      toast.success('카테고리 삭제됨');
      if (activeCatId === deleteCatTarget.id) setActiveCatId(null);
      setDeleteCatTarget(null);
      await catApi.run();
    } catch {
      toast.error('메뉴가 있는 카테고리는 삭제할 수 없습니다.');
      setDeleteCatTarget(null);
    }
  };

  const handleMoveCat = async (idx: number, dir: -1 | 1) => {
    const ids = categories.map((c) => c.id);
    const target = idx + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    await api.patch('/admin/categories/reorder', { body: { orderedIds: ids } });
    await catApi.run();
  };

  // ── Menu Item CRUD ─────────────────────────────────────────

  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuEditTarget, setMenuEditTarget] = useState<MenuItem | null>(null);
  const [deleteMenuTarget, setDeleteMenuTarget] = useState<MenuItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const openCreateMenu = () => {
    setMenuEditTarget(null);
    setFormName('');
    setFormPrice('');
    setFormDesc('');
    setFormImage('');
    setMenuModalOpen(true);
  };

  const openEditMenu = (item: MenuItem) => {
    setMenuEditTarget(item);
    setFormName(item.name);
    setFormPrice(String(item.price));
    setFormDesc(item.description ?? '');
    setFormImage(item.imageUrl ?? '');
    setMenuModalOpen(true);
  };

  const handleSaveMenu = async () => {
    const name = formName.trim();
    const price = Number(formPrice);
    if (!name || isNaN(price) || price < 100) {
      toast.error('이름과 올바른 가격(100원 이상)을 입력하세요.');
      return;
    }

    setFormSaving(true);
    try {
      const body: Record<string, unknown> = {
        name,
        price,
        description: formDesc.trim() || null,
        imageUrl: formImage.trim() || null,
      };

      if (menuEditTarget) {
        await api.patch(`/admin/menus/${menuEditTarget.id}`, { body });
        toast.success('메뉴 수정됨');
      } else {
        await api.post('/admin/menus', { body: { ...body, categoryId: activeCatId } });
        toast.success('메뉴 등록됨');
      }
      setMenuModalOpen(false);
      await menuApi.run();
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteMenu = async () => {
    if (!deleteMenuTarget) return;
    await api.delete(`/admin/menus/${deleteMenuTarget.id}`);
    toast.success('메뉴 삭제됨');
    setDeleteMenuTarget(null);
    await menuApi.run();
  };

  const handleMoveMenu = async (idx: number, dir: -1 | 1) => {
    const ids = menuItems.map((m) => m.id);
    const target = idx + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    await api.patch('/admin/menus/reorder', { body: { categoryId: activeCatId, orderedIds: ids } });
    await menuApi.run();
  };

  // ── Render ─────────────────────────────────────────────────

  if (catApi.loading) return <Loading />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>메뉴 관리</h1>
      </div>

      <div className={styles.layout}>
        {/* Sidebar: Categories */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>
            카테고리
          </div>

          <ul className={styles.catList}>
            {categories.map((cat, idx) => (
              <li
                key={cat.id}
                className={`${styles.catItem} ${activeCatId === cat.id ? styles.catItemActive : ''}`}
                onClick={() => setActiveCatId(cat.id)}
              >
                {editCatId === cat.id ? (
                  <input
                    className={styles.addCatInput}
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    onBlur={handleUpdateCategory}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span>{cat.name}</span>
                    <div className={styles.catActions}>
                      <button className={styles.moveBtn} onClick={(e) => { e.stopPropagation(); handleMoveCat(idx, -1); }} disabled={idx === 0}>↑</button>
                      <button className={styles.moveBtn} onClick={(e) => { e.stopPropagation(); handleMoveCat(idx, 1); }} disabled={idx === categories.length - 1}>↓</button>
                      <button className={styles.catActionBtn} onClick={(e) => { e.stopPropagation(); setEditCatId(cat.id); setEditCatName(cat.name); }}>✎</button>
                      <button className={styles.catActionBtn} onClick={(e) => { e.stopPropagation(); setDeleteCatTarget(cat); }}>✕</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

          <div className={styles.addCatForm}>
            <input
              className={styles.addCatInput}
              placeholder="새 카테고리"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button size="sm" onClick={handleAddCategory}>추가</Button>
          </div>
        </aside>

        {/* Main: Menu Items */}
        <section className={styles.main}>
          <div className={styles.mainHeader}>
            <h2 className={styles.mainTitle}>
              {categories.find((c) => c.id === activeCatId)?.name ?? '카테고리를 선택하세요'}
            </h2>
            {activeCatId && <Button size="sm" onClick={openCreateMenu}>메뉴 추가</Button>}
          </div>

          {!activeCatId ? (
            <div className={styles.empty}>왼쪽에서 카테고리를 선택하세요.</div>
          ) : menuApi.loading ? (
            <Loading />
          ) : menuItems.length === 0 ? (
            <div className={styles.empty}>이 카테고리에 메뉴가 없습니다.</div>
          ) : (
            <table className={styles.menuTable}>
              <thead>
                <tr>
                  <th>이미지</th>
                  <th>메뉴명</th>
                  <th>가격</th>
                  <th>순서</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className={styles.menuImage} />
                      ) : (
                        <div className={styles.menuImageNone}>-</div>
                      )}
                    </td>
                    <td>{item.name}</td>
                    <td>{item.price.toLocaleString()}원</td>
                    <td>
                      <button className={styles.moveBtn} onClick={() => handleMoveMenu(idx, -1)} disabled={idx === 0}>↑</button>
                      <button className={styles.moveBtn} onClick={() => handleMoveMenu(idx, 1)} disabled={idx === menuItems.length - 1}>↓</button>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={styles.iconBtn} onClick={() => openEditMenu(item)}>✎</button>
                        <button className={styles.iconBtnDanger} onClick={() => setDeleteMenuTarget(item)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Menu Create/Edit Modal */}
      <Modal
        open={menuModalOpen}
        onClose={() => setMenuModalOpen(false)}
        title={menuEditTarget ? '메뉴 수정' : '메뉴 등록'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMenuModalOpen(false)}>취소</Button>
            <Button onClick={handleSaveMenu} loading={formSaving}>
              {menuEditTarget ? '수정' : '등록'}
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          <Input
            label="메뉴명"
            name="name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
            maxLength={50}
          />
          <div className={styles.formRow}>
            <Input
              label="가격 (원)"
              name="price"
              type="number"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              min={100}
              step={100}
              required
            />
            <Input
              label="이미지 URL"
              name="imageUrl"
              value={formImage}
              onChange={(e) => setFormImage(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <TextArea
            label="설명"
            name="description"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>
      </Modal>

      {/* Delete Category Confirm */}
      <ConfirmDialog
        open={!!deleteCatTarget}
        title="카테고리 삭제"
        message={`"${deleteCatTarget?.name}" 카테고리를 삭제하시겠습니까?`}
        danger
        confirmLabel="삭제"
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteCatTarget(null)}
      />

      {/* Delete Menu Confirm */}
      <ConfirmDialog
        open={!!deleteMenuTarget}
        title="메뉴 삭제"
        message={`"${deleteMenuTarget?.name}" 메뉴를 삭제하시겠습니까?`}
        danger
        confirmLabel="삭제"
        onConfirm={handleDeleteMenu}
        onCancel={() => setDeleteMenuTarget(null)}
      />
    </div>
  );
}
