import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders label and fires onClick', () => {
    const onClick = vi.fn();
    render(
      <Button data-testid="my-btn" onClick={onClick}>
        Click
      </Button>,
    );
    const btn = screen.getByTestId('my-btn');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(
      <Button data-testid="my-btn" loading>
        Submit
      </Button>,
    );
    expect(screen.getByTestId('my-btn')).toBeDisabled();
  });
});
