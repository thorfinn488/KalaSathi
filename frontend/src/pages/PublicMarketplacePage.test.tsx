// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PublicMarketplacePage } from './PublicMarketplacePage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('PublicMarketplacePage', () => {
  const mockSuccessResponse = () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data: [] }),
    json: async () => ({ success: true, data: [] }),
  });

  it('renders living heritage hero and curated craft catalog with valid numeric pricing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockSuccessResponse()));

    render(
      <PublicMarketplacePage
        onSelectProduct={vi.fn()}
        onEnterStudio={vi.fn()}
      />
    );

    // Verify Living Heritage hero
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Living Heritage Meets/i);
    expect(screen.getAllByText(/100% GI Tagged/i).length).toBeGreaterThan(0);

    // Verify catalog products render valid INR price string and NOT '[object Object]'
    const priceElements = screen.getAllByText(/₹[\d,]+/);
    expect(priceElements.length).toBeGreaterThan(0);
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
  });

  it('filters catalog items when search input is typed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockSuccessResponse()));

    render(
      <PublicMarketplacePage
        onSelectProduct={vi.fn()}
        onEnterStudio={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by craft, artisan, or state/i);
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Pashmina' } });
    });

    // Should show Kashmiri Pashmina and hide Channapatna
    expect(screen.getByText(/Sozni Pashmina Shawl/i)).toBeInTheDocument();
    expect(screen.queryByText(/Lacquered Stacking Set/i)).not.toBeInTheDocument();
  });

  it('filters catalog items by category tab selection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockSuccessResponse()));

    render(
      <PublicMarketplacePage
        onSelectProduct={vi.fn()}
        onEnterStudio={vi.fn()}
      />
    );

    const categoryButton = screen.getByRole('button', { name: /Jaipur Blue Pottery/i });
    fireEvent.click(categoryButton);

    expect(screen.getByText(/Blue Pottery Floral Vase/i)).toBeInTheDocument();
    expect(screen.queryByText(/Madhubani Peacock Scroll/i)).not.toBeInTheDocument();
  });
});
