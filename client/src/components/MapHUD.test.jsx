import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import MapHUD from './MapHUD';

describe('MapHUD', () => {
  test('renders the network map with all node labels', () => {
    render(<MapHUD activeRoute={[]} />);
    expect(screen.getByText('Godown A')).toBeInTheDocument();
    expect(screen.getByText('Port 3')).toBeInTheDocument();
  });

  test('shows a roadblock marker when blockedEdge is set', () => {
    render(<MapHUD activeRoute={['Godown A', 'Hub 1']} blockedEdge="Godown A--Hub 1" />);
    expect(screen.getByTestId('roadblock-marker')).toBeInTheDocument();
  });

  test('shows a vehicle marker at the given position', () => {
    render(<MapHUD activeRoute={['Godown A', 'Hub 1']} vehiclePosition="Hub 1" />);
    expect(screen.getByTestId('vehicle-marker')).toBeInTheDocument();
  });
});
