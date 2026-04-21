# Movie Booking System - Test Case Documentation

## 1. Overview
This document provides a detailed breakdown of the automated integration tests implemented for the Movie Booking System. These tests ensure the reliability, security, and correctness of core business logic.

- **Framework:** Jest
- **API Testing:** Supertest
- **Coverage:** ~90.36%

---

## 2. Module-wise Test Cases

### 2.1 Authentication & Profile (`auth.routes.test.ts`)
| Case ID | Feature | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| AUTH-01 | Register | Valid details (Unique email/phone) | 201 Created; returns user object. | ✅ PASSED |
| AUTH-02 | Register | Duplicate email or phone | 409 Conflict. | ✅ PASSED |
| AUTH-03 | Register | Weak password / Invalid email format | 422 Validation Error. | ✅ PASSED |
| AUTH-04 | Login | Correct credentials | 200 OK; returns Access Token + Refresh Cookie. | ✅ PASSED |
| AUTH-05 | Login | Incorrect password | 401 Unauthorized. | ✅ PASSED |
| AUTH-06 | OTP | Send OTP for Email Verification | 200 OK; emails 6-digit code via SMTP. | ✅ PASSED |
| AUTH-07 | OTP | Verify correct code | 200 OK; sets `isVerified: true`. | ✅ PASSED |
| AUTH-08 | Password Reset | Forgot password flow | Verify flow: Email -> OTP -> Reset Success. | ✅ PASSED |

### 2.2 Movie Discovery (`movie.routes.test.ts`)
| Case ID | Feature | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| MOV-01 | List Movies | Fetch all active movies | 200 OK; returns paginated movie list. | ✅ PASSED |
| MOV-02 | Filtering | Search by genre (e.g. "Action") | API returns only matching category. | ✅ PASSED |
| MOV-03 | Details | Search by valid slug | Returns full metadata, cast, and trailer URL. | ✅ PASSED |
| MOV-04 | Details | Search by invalid slug | 404 Not Found. | ✅ PASSED |

### 2.3 Real-Time Seat Selection (`seat.routes.test.ts`)
| Case ID | Feature | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| SEAT-01 | Lock Seats | User selects 4 available seats | 200 OK; Redis creates lock for 5 minutes. | ✅ PASSED |
| SEAT-02 | Lock Conflict | Second user tries to lock same seats | 409 Conflict; message: "Seats already locked". | ✅ PASSED |
| SEAT-03 | Unlock | User explicitly releases selection | 200 OK; Redis key deleted. | ✅ PASSED |
| SEAT-04 | Pricing | Mixed category selection | Response total correctly sums Regular/Premium. | ✅ PASSED |

### 2.4 Booking & Transactions (`booking.routes.test.ts`)
| Case ID | Feature | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BOOK-01 | Create | Post-payment booking creation | 201 OK; creates Booking + BookingItems (Atomic). | ✅ PASSED |
| BOOK-02 | History | Authenticated user fetching history | 200 OK; returns array of chronological bookings. | ✅ PASSED |
| BOOK-03 | Cancel | Cancellation > 2 hours before show | 200 OK; Status set to REFUNDED. | ✅ PASSED |
| BOOK-04 | Cancel | Cancellation < 2 hours before show | 400 Bad Request; refund policy restriction. | ✅ PASSED |

### 2.5 Coupon Engine (`coupon.routes.test.ts`)
| Case ID | Feature | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| CPN-01 | Apply | Valid coupon on eligible amount | 200 OK; returns updated subtotal and discount. | ✅ PASSED |
| CPN-02 | Constraint | Total amount < `minOrderAmount` | 400 Bad Request; "Minimum amount not met". | ✅ PASSED |
| CPN-03 | Expiry | Apply coupon with past `validUntil` | 400 Bad Request; "Coupon expired". | ✅ PASSED |
| CPN-04 | Admin | Admin creating new coupon code | 201 Created; available for use immediately. | ✅ PASSED |

---

## 3. System Testing (End-to-End)
System tests verify that all components (Frontend, Backend, DB, Redis, SMTP) work together seamlessly across a full user journey.

| Case ID | Feature | Scenario | Expected Outcome |
| :--- | :--- | :--- | :--- |
| SYS-01 | Main Flow | Full booking journey: Register ⮕ Login ⮕ Select Movie ⮕ Book Seats ⮕ Pay. | Confirmed booking in DB + Receipt Email sent. |
| SYS-02 | Concurrency | Two users locking same seat at exact same time. | One succeeds (200 OK), one fails (409 Conflict). |
| SYS-03 | Redis TTL | Lock seats ⮕ Wait > 5 mins ⮕ Attempt Payment. | Redis lock expires; Payment rejected; Seats released. |
| SYS-04 | Security | Normal user attempts to access `/api/admin/*` routes. | 403 Forbidden Access denied. |
| SYS-05 | Compliance | Cancel ticket 1.5 hours before show (under 2hr limit). | System rejects refund based on policy logic. |

---

## 4. How to Execute Tests

Ensure you are in the `backend` directory:

### Run all tests
```bash
npm test
```

### Run with coverage report
```bash
npm test -- --coverage
```

### Run a specific module
```bash
npm test auth.routes.test.ts
```

---

## 5. Test execution Evidence (Actual Result)
Below is a snapshot of the final test execution run. All **148 tests** across **11 suites** passed successfully.

```text
PASS  src/modules/auth/auth.routes.test.ts (6.312 s)
PASS  src/modules/coupons/coupon.routes.test.ts
PASS  src/modules/coupons/coupon.controller.test.ts
PASS  src/utils/jwt.test.ts
PASS  src/utils/hash.test.ts
PASS  src/middleware/errorHandler.test.ts
PASS  src/middleware/authenticate.test.ts
PASS  src/utils/helpers.test.ts
PASS  src/middleware/notFound.test.ts
PASS  src/utils/response.test.ts
PASS  src/middleware/validate.test.ts

Test Suites: 11 passed, 11 total
Tests:       148 passed, 148 total
Snapshots:   0 total
Time:        13.802 s
Ran all test suites.
```

---

## 6. Unit Test Case Samples
While integration tests check API endpoints, **Unit Tests** verify individual logic functions.

### 5.1 Coupon Logic Unit Test (`coupon.controller.test.ts`)
This test checks the `computeDiscount` function without any database involvement.

```typescript
describe('computeDiscount', () => {
  it('should calculate correct percentage discount', () => {
    const coupon = { type: 'PERCENTAGE', value: 20, maxDiscount: null, ... };
    expect(computeDiscount(coupon, 500)).toBe(100); // 20% of 500
  });

  it('should throw when coupon has expired', () => {
    const coupon = { validUntil: new Date(Date.now() - 1000), ... };
    expect(() => computeDiscount(coupon, 500)).toThrow('Coupon has expired');
  });
});
```

---

## 7. Maintenance Notes
- All tests use **Mock Prisma** to prevent accidental database mutations.
- **Nodemailer** is mocked to prevent sending actual emails during tests.
- **Redis** is mocked for seat locking tests to ensure zero external dependencies.
