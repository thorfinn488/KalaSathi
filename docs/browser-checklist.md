# KalaSaathi Browser Checklist

Run this checklist manually against the existing frontend and backend. Keep both order-dashboard and order-API VITE flags unset.

1. Register an artisan account with a new phone number and valid password.
   - Expected: registration succeeds and the app opens the artisan dashboard.
   - Watch for: duplicate-phone errors, validation errors on valid input, or a server error.

2. Log out, then log in with the new artisan credentials.
   - Expected: login succeeds and the correct artisan name and role appear.
   - Watch for: login rejection for valid credentials, a blank dashboard, or stale account details.

3. Log out from the authenticated navigation.
   - Expected: the login screen appears and authenticated navigation is no longer available.
   - Watch for: the session remaining active or protected pages remaining accessible.

4. Submit the login form with the correct phone and an incorrect password.
   - Expected: a clear invalid-credentials message appears without a server error.
   - Watch for: HTTP 500, a blank page, or an error message that does not explain the login failure.

5. Log in again and inspect the artisan dashboard and navigation.
   - Expected: the existing artisan dashboard loads; the Order Dashboard entry is absent when VITE_SHOW_ORDER_DASHBOARD is unset.
   - Watch for: the order dashboard appearing by default, missing artisan dashboard data, or cross-artisan data.
   - Network tab shows no requests to /demo-api.

6. Choose Add Product, select a valid photo, optionally record a voice note, and start cataloguing.
   - Expected: a draft is created, files upload, processing begins, and progress is shown.
   - Watch for: upload validation errors on supported files, stuck processing, or a failed pipeline with no explanation.

7. Wait for processing to complete and open the product detail.
   - Expected: status is READY and generated catalogue, price, and buyer opportunities are displayed.
   - Watch for: polling that never completes, missing catalogue/pricing, or detail access returning an error for the owning artisan.

8. Edit the generated catalogue name or description and save.
   - Expected: the edit succeeds and remains visible after reloading the detail page.
   - Watch for: a success indicator without persisted changes, validation failures, or an unhandled server error.

9. Open the price customization controls, change material cost, labor days, or complexity, and recalculate.
   - Expected: the API returns and displays an updated suggested price and range.
   - Watch for: values changing only in the browser, no API response, or invalid-input failures for values within the displayed bounds.

10. Log in as a buyer or admin and open Opportunities.
    - Expected: open buyer opportunities load with buyer, company, requirement, and match score.
    - Watch for: this tab being offered to artisans who receive 403, empty results when seeded opportunities exist, or a failed request without feedback.

11. Log back in as an artisan and check the admin navigation; then, if available, log in as an admin and open Admin Panel.
    - Expected: artisans do not see Admin Panel; admins can load artisan, product, and opportunity lists.
    - Watch for: an admin entry visible to artisans or an admin page that silently fails to load its data.
