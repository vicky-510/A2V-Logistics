import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import Toaster from './Toaster';
import { toast } from '../lib/toast';

describe('Toaster', () => {
  test('renders a success toast pushed via the toast helper', async () => {
    render(<Toaster />);
    act(() => toast.success('Shipment dispatched'));
    await waitFor(() => expect(screen.getByText('Shipment dispatched')).toBeInTheDocument());
  });

  test('renders an error toast', async () => {
    render(<Toaster />);
    act(() => toast.error('Something broke'));
    await waitFor(() => expect(screen.getByText('Something broke')).toBeInTheDocument());
  });
});
