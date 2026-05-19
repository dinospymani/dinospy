# Security Specification - DINOSPY Luxury Watches

## User Roles
- **Guest**: Can view products and reviews.
- **User**: Can manage own profile, cart, wishlist, and orders. Can create reviews.
- **Admin**: Full access to all collections (products, users, orders).

## Data Invariants
1. **User Profile**: A user can only read/write their own profile. Non-admins cannot change their own role.
2. **Products**: Publicly readable. Only Admins can create, update, or delete products.
3. **Orders**: Users can only see their own orders. Orders cannot be deleted once placed. Only admins can update status.
4. **Cart/Wishlist**: Private subcollections under user documents. Only the user can access.
5. **Reviews**: Publicly readable. Users can only edit/delete their own reviews.

## The "Dirty Dozen" Payloads (Deny Cases)
1. **Role Escalation**: User tries to update their profile `role` to 'admin'.
2. **Identity Spoofing**: User tries to create an order with another user's `userId`.
3. **Cross-User Snooping**: User tries to read another user's cart subcollection.
4. **Product Sabotage**: Guest tries to delete a product.
5. **Review Hijacking**: User tries to update a review they didn't write.
6. **Price Tampering**: User tries to update a product price.
7. **Negative Stock**: Admin tries to set stock to -1. (Validation logic)
8. **Orphaned Order**: User tries to create an order referencing a non-existent product.
9. **Fake Timestamp**: User tries to provide a client-side `createdAt` for an order.
10. **Huge Junk ID**: Attacker tries to create a document with a 2MB string ID.
11. **Shadow Field**: User tries to add `isPremium: true` to a review.
12. **Status Skipping**: User tries to move order from 'pending' to 'delivered' directly.

## Rules Draft Strategy
Using ABAC and Master Gate pattern.
Split user profile into private and public if needed, but for now we'll stick to document-level access.
Admin check will be via `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`.
Actually, I'll store admins in a dedicated collection `admins` as per the skill recommendation for reliability.
