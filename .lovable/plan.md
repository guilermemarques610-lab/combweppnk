I will update the price of the "Kit Body Splash" from R$ 34,90 to R$ 44,90 in all relevant components.

### Implementation Details:
- **src/components/OrderBump.tsx**: Update the `kit` price and label.
- **src/components/CartDrawer.tsx**: Update the `kit` price and label in the `PRODUCTS` object.
- **src/components/ProductPage.tsx**: Update the static price text and the installment label.

### Technical Steps:
1.  **src/components/OrderBump.tsx**:
    - Change `price: 34.90` to `44.90`.
    - Change `priceLabel: "R$ 34,90"` to `"R$ 44,90"`.
2.  **src/components/CartDrawer.tsx**:
    - Change `price: 34.90` to `44.90`.
    - Change `priceLabel: "R$ 34,90"` to `"R$ 44,90"`.
3.  **src/components/ProductPage.tsx**:
    - Update `R$ 34,90` to `R$ 44,90`.
    - Update `ou 1x de 34,90` to `ou 1x de 44,90`.
    - Update the savings calculation label `ECONOMIZE R$ 139,60` if necessary (Original 174.50 - 44.90 = 129.60).
