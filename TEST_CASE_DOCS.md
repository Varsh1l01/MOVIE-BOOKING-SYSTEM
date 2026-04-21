# Movie Booking System - Test Case Documentation

## 1. Overview
This document provides a detailed breakdown of the automated integration tests implemented for the Movie Booking System. These tests ensure the reliability, security, and correctness of core business logic.

- **Framework:** Jest
- **API Testing:** Supertest
- **Coverage:** ~90.36%

---

## 2. Module-wise Test Cases

### 2.1 Authentication & Profile (`auth.routes.test.ts`)
| Case ID | Feature | Scenario | Expected Result |
| :--- | :--- | :--- | :--- |
| AUTH-01 | Register | Valid details (Unique email/phone) | 201 Created; returns user object. |
| AUTH-02 | Register | Duplicate email or phone | 409 Conflict. |
| AUTH-03 | Register | Weak password / Invalid email format | 422 Validation Error. |
| AUTH-04 | Login | Correct credentials | 200 OK; returns Access Token + Refresh Cookie. |
| AUTH-05 | Login | Incorrect password | 401 Unauthorized. |
| AUTH-06 | OTP | Send OTP for Email Verification | 200 OK; emails 6-digit code via SMTP. |
| AUTH-07 | OTP | Verify correct code | 200 OK; sets `isVerified: true`. |
| AUTH-08 | Password Reset | Forgot password flow | Verify flow: Email -> OTP -> Reset Success. |

### 2.2 Movie Discovery (`movie.routes.test.ts`)
| Case ID | Feature | Scenario | Expected Result |
| :--- | :--- | :--- | :--- |
| MOV-01 | List Movies | Fetch all active movies | 200 OK; returns paginated movie list. |
| MOV-02 | Filtering | Search by genre (e.g. "Action") | API returns only matching category. |
| MOV-03 | Details | Search by valid slug | Returns full metadata, cast, and trailer URL. |
| MOV-04 | Details | Search by invalid slug | 404 Not Found. |

### 2.3 Real-Time Seat Selection (`seat.routes.test.ts`)
| Case ID | Feature | Scenario | Expected Result |
| :--- | :--- | :--- | :--- |
| SEAT-01 | Lock Seats | User selects 4 available seats | 200 OK; Redis creates lock for 5 minutes. |
| SEAT-02 | Lock Conflict | Second user tries to lock same seats | 409 Conflict; message: "Seats already locked". |
| SEAT-03 | Unlock | User explicitly releases selection | 200 OK; Redis key deleted. |
| SEAT-04 | Pricing | Mixed category selection | Response total correctly sums Regular/Premium. |

### 2.4 Booking & Transactions (`booking.routes.test.ts`)
| Case ID | Feature | Scenario | Expected Result |
| :--- | :--- | :--- | :--- |
| BOOK-01 | Create | Post-payment booking creation | 201 OK; creates Booking + BookingItems (Atomic). |
| BOOK-02 | History | Authenticated user fetching history | 200 OK; returns array of chronological bookings. |
| BOOK-03 | Cancel | Cancellation > 2 hours before show | 200 OK; Status set to REFUNDED. |
| BOOK-04 | Cancel | Cancellation < 2 hours before show | 400 Bad Request; refund policy restriction. |

### 2.5 Coupon Engine (`coupon.routes.test.ts`)
| Case ID | Feature | Scenario | Expected Result |
| :--- | :--- | :--- | :--- |
| CPN-01 | Apply | Valid coupon on eligible amount | 200 OK; returns updated subtotal and discount. |
| CPN-02 | Constraint | Total amount < `minOrderAmount` | 400 Bad Request; "Minimum amount not met". |
| CPN-03 | Expiry | Apply coupon with past `validUntil` | 400 Bad Request; "Coupon expired". |
| CPN-04 | Admin | Admin creating new coupon code | 201 Created; available for use immediately. |

---

## 3. How to Execute Tests

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

## 4. Maintenance Notes
- All tests use **Mock Prisma** to prevent accidental database mutations.
- **Nodemailer** is mocked to prevent sending actual emails during tests.
- **Redis** is mocked for seat locking tests to ensure zero external dependencies.
