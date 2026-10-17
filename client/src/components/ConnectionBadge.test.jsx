import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import ConnectionBadge from './ConnectionBadge';

describe('ConnectionBadge', () => {
  test('shows LIVE when connected', () => {
    render(<ConnectionBadge status="live" />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  test('shows RECONNECTING when the stream drops', () => {
    render(<ConnectionBadge status="reconnecting" />);
    expect(screen.getByText('RECONNECTING')).toBeInTheDocument();
  });
});
