# Security Specification - Vektorion Treasury

## Data Invariants
1. A transaction MUST have a valid amount (positive).
2. A transaction linked to a NIM must match an existing member (integrity).
3. Users cannot modify transaction status once it's set to 'verified' unless they are admins.
4. Member data is read-only for general users.

## The Dirty Dozen Payloads (Attack Vectors)
1. **Identity Spoofing**: Attempt to create a transaction with `status: 'verified'` via client SDK.
2. **Resource Poisoning**: Large strings in `name` or `tag`.
3. **Ghost Fields**: Adding `isVerified: true` to a member document.
4. **Negative Amount**: Creating a transaction with `amount: -1000000`.
5. **Unauthorized Update**: A non-admin user trying to change a `suspicious` status to `verified`.
6. **ID Injection**: Using a long, junk string as a transaction ID to bloat the database.
7. **Future/Past Spoofing**: Sending a `createdAt` timestamp from the future.
8. **PII Scraping**: Attempting to list all members if not authenticated (if we decide to restrict).
9. **Orphaned Writes**: Creating a transaction for a NIM that doesn't exist.
10. **Admin Escalation**: User trying to write their own record into the `/admins/` collection.
11. **Bulk Delete**: Attempting to wipe the `transactions` collection.
12. **Status skipping**: Changing a `pending` transaction directly to `out` (if logic forbids).

## Test Runner
A `firestore.rules.test.ts` will be created to verify these denials.
