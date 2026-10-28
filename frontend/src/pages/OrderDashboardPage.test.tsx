// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { OrderDashboardPage } from './OrderDashboardPage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('OrderDashboardPage', () => {
  it('shows API-provided artisan finances and low-stock count', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            artisan_id: 'artisan-1',
            artisan: 'Sunita Devi',
            revenue: 3600,
            expenses: 450,
            net_profit: 3150,
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            product_id: 'product-1',
            product_name: 'Embroidered Dupatta',
            artisan_id: 'artisan-1',
            artisan_name: 'Sunita Devi',
            stock: 2,
            low_stock_threshold: 3,
          },
        ],
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<OrderDashboardPage />);

    expect(await screen.findAllByText('Sunita Devi')).toHaveLength(2);
    expect(screen.getByText('₹3,600')).toBeInTheDocument();
    expect(screen.getByText('₹450')).toBeInTheDocument();
    expect(screen.getByText('3,150')).toBeInTheDocument();
    expect(screen.getByTestId('low-stock-count')).toHaveTextContent('1');
    expect(screen.getByText('Embroidered Dupatta')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/demo-api/artisans/profit');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/demo-api/products/low-stock');
  });

  it('shows an error state when the order API is unreachable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    render(<OrderDashboardPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to fetch');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
