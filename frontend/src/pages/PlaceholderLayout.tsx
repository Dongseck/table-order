import type { ReactNode } from 'react';

interface Props {
  unit: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

const wrap: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: 32,
};
const badge: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: 999,
  background: '#eef2ff',
  color: '#3730a3',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.5,
};
const h1: React.CSSProperties = { fontSize: 28, fontWeight: 800, margin: '12px 0 8px' };
const desc: React.CSSProperties = { color: '#6b7280', marginBottom: 24 };
const todo: React.CSSProperties = {
  border: '1px dashed #d1d5db',
  borderRadius: 8,
  padding: 16,
  background: '#fafafa',
  color: '#4b5563',
};

export function PlaceholderLayout({ unit, title, description, children }: Props) {
  return (
    <div style={wrap} data-testid={`placeholder-${unit.toLowerCase().replace(/\s+/g, '-')}`}>
      <span style={badge}>{unit}</span>
      <h1 style={h1}>{title}</h1>
      {description ? <p style={desc}>{description}</p> : null}
      <div style={todo}>
        <strong>TODO:</strong> {unit} 담당자가 이 페이지를 실제 구현으로 교체합니다.
      </div>
      {children}
    </div>
  );
}
