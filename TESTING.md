# Testing Documentation - Bookstore E-Commerce API

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [API Endpoints Testing](#api-endpoints-testing)
4. [Authentication Testing](#authentication-testing)
5. [Business Logic Testing](#business-logic-testing)
6. [Payment Flow Testing](#payment-flow-testing)
7. [Error Handling Testing](#error-handling-testing)
8. [Performance & Load Testing](#performance--load-testing)
9. [Security Testing](#security-testing)
10. [Test Data & Fixtures](#test-data--fixtures)

---

## Overview

This document provides comprehensive testing guidelines for the Bookstore E-Commerce API backend. The API is built with Express.js, MongoDB, and integrates with eSewa payment gateway.

**Base URL (Local):** `http://localhost:5000`
**Client URL:** `http://localhost:3000`

---

## Testing Strategy

### Test Pyramid

```
        ▲
       /|\
      / | \
     /  |  \       End-to-End Tests (Payment flow)
    /   |   \
   /    |    \
  /     |     \    Integration Tests (Multi-service)
 /      |      \
/       |       \  Unit Tests (Individual functions)
```

### Tools Recommended

- **API Testing:** Postman, Thunder Client, Insomnia
- **Unit Testing:** Jest, Mocha
- **Integration Testing:** Supertest
- **Load Testing:** Apache JMeter, k6
- **Security Testing:** OWASP ZAP, Burp Suite Community

---

## API Endpoints Testing

### 1. Authentication Routes (`/api/auth`)

#### 1.1 Register User

```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Expected Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Test Cases:**

- ✅ Valid registration with all required fields
- ❌ Missing name field → 400 error
- ❌ Missing email field → 400 error
- ❌ Missing password field → 400 error
- ❌ Invalid email format → 400 error
- ❌ Password < 6 characters → 400 error
- ❌ Name < 2 characters → 400 error
- ❌ Email already exists → 400 error (AUTH_USER_EXISTS)
- ✅ Verify JWT cookie is set (httpOnly, 15 days expiry)

#### 1.2 Login User

```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Expected Response (200):
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Test Cases:**

- ✅ Valid login credentials
- ❌ Invalid email (user doesn't exist)
- ❌ Invalid password
- ❌ Missing email field
- ❌ Missing password field
- ✅ User's lastLogin timestamp is updated
- ✅ JWT cookie is set with correct expiration

#### 1.3 Logout User

```
POST /api/auth/logout

Expected Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Test Cases:**

- ✅ Logout clears JWT cookie (maxAge: 0)
- ✅ JWT cookie is removed after logout
- ✅ Subsequent protected route requests fail after logout

#### 1.4 Get Current User

```
GET /api/auth/me
Cookie: jwt=<token>

Expected Response (200):
{
  "success": true,
  "user": { ...user object }
}
```

**Test Cases:**

- ✅ With valid JWT token
- ❌ Without JWT token → 401 error
- ❌ With invalid/expired JWT token → 401 error
- ✅ Password hash is NOT included in response

---

### 2. Books Routes (`/api/books`)

#### 2.1 Get All Books

```
GET /api/books

Expected Response (200):
{
  "success": true,
  "count": 10,
  "books": [ ...book objects ]
}
```

**Test Cases:**

- ✅ Returns all books with count
- ✅ Works without authentication
- ✅ Empty database returns empty array

#### 2.2 Get Book by ID

```
GET /api/books/507f1f77bcf86cd799439011

Expected Response (200):
{
  "success": true,
  "book": { ...book object }
}
```

**Test Cases:**

- ✅ Valid book ID returns book details
- ❌ Invalid MongoDB ObjectId format → 400 error
- ❌ Non-existent book ID → 404 error (BOOK_NOT_FOUND)
- ✅ Works without authentication

#### 2.3 Search Books

```
GET /api/books/search?query=Harry&category=Fiction&page=1&limit=10

Expected Response (200):
{
  "success": true,
  "message": "Search completed successfully",
  "data": [ ...books ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 42,
    "itemsPerPage": 10
  }
}
```

**Test Cases:**

- ✅ Search with valid query returns results
- ✅ Search with category filter
- ✅ Pagination works correctly
- ❌ Empty query string → 400 error (SEARCH_INVALID_QUERY)
- ❌ No results found → 404 error (SEARCH_NO_RESULTS)
- ✅ Works without authentication
- ✅ Case-insensitive search

#### 2.4 Add Book (Protected)

```
POST /api/books
Cookie: jwt=<token>
Content-Type: application/json

Request Body:
{
  "title": "The Hobbit",
  "author": "J.R.R. Tolkien",
  "price": 15.99,
  "description": "A fantasy novel",
  "imagePath": "/images/hobbit.jpg"
}

Expected Response (201):
{
  "success": true,
  "message": "Book created successfully",
  "book": { ...book object with _id }
}
```

**Test Cases:**

- ✅ Valid book creation with auth
- ❌ Without JWT token → 401 error
- ❌ Missing required field → 400 error
- ❌ Invalid price (negative) → 400 error
- ✅ Book is saved to database

#### 2.5 Update Book (Protected)

```
PUT /api/books/507f1f77bcf86cd799439011
Cookie: jwt=<token>
Content-Type: application/json

Request Body:
{
  "price": 12.99,
  "stock": 25
}

Expected Response (200):
{
  "success": true,
  "message": "Book updated successfully",
  "book": { ...updated book object }
}
```

**Test Cases:**

- ✅ Valid book update with auth
- ❌ Without JWT token → 401 error
- ❌ Invalid book ID → 404 error
- ✅ Partial updates work
- ✅ Updated data persists in database

#### 2.6 Delete Book (Protected)

```
DELETE /api/books/507f1f77bcf86cd799439011
Cookie: jwt=<token>

Expected Response (200):
{
  "success": true,
  "message": "Book deleted successfully"
}
```

**Test Cases:**

- ✅ Valid book deletion with auth
- ❌ Without JWT token → 401 error
- ❌ Invalid book ID → 404 error
- ✅ Book is removed from database

---

### 3. Cart Routes (`/api/cart`)

#### 3.1 Get Cart

```
GET /api/cart
Cookie: jwt=<token>

Expected Response (200):
{
  "success": true,
  "cart": {
    "_id": "...",
    "userId": "...",
    "items": [ ...with book details populated ],
    "total": 45.99
  }
}
```

**Test Cases:**

- ✅ Returns user's cart (auto-creates empty cart if none exists)
- ❌ Without JWT token → 401 error
- ✅ Items populated with book details
- ✅ Each user has separate cart

#### 3.2 Add to Cart

```
POST /api/cart/items
Cookie: jwt=<token>
Content-Type: application/json

Request Body:
{
  "bookId": "507f1f77bcf86cd799439011",
  "quantity": 2
}

Expected Response (200):
{
  "success": true,
  "message": "Item added to cart",
  "cart": { ...updated cart }
}
```

**Test Cases:**

- ✅ Add new item to cart
- ✅ Increase quantity if item exists
- ✅ Total is recalculated
- ❌ Invalid quantity (< 1) → error
- ❌ Invalid book ID → 404 error
- ❌ Insufficient stock → 400 error with available count
- ✅ Stock validation prevents overselling
- ✅ Price is captured at add time

#### 3.3 Update Cart Item

```
PUT /api/cart/items/507f1f77bcf86cd799439011
Cookie: jwt=<token>
Content-Type: application/json

Request Body:
{
  "quantity": 5
}

Expected Response (200):
{
  "success": true,
  "message": "Cart updated",
  "cart": { ...updated cart }
}
```

**Test Cases:**

- ✅ Update item quantity
- ✅ Total is recalculated
- ❌ Invalid quantity (< 1) → error
- ❌ Insufficient stock → 400 error
- ❌ Item not in cart → 404 error (CART_ITEM_NOT_FOUND)
- ✅ Price reflects any changes in book price

#### 3.4 Remove from Cart

```
DELETE /api/cart/items/507f1f77bcf86cd799439011
Cookie: jwt=<token>

Expected Response (200):
{
  "success": true,
  "message": "Item removed from cart",
  "cart": { ...updated cart }
}
```

**Test Cases:**

- ✅ Remove item from cart
- ✅ Total is recalculated
- ❌ Item not in cart → 404 error
- ✅ Cart remains valid with updated total

#### 3.5 Clear Cart

```
DELETE /api/cart
Cookie: jwt=<token>

Expected Response (200):
{
  "success": true,
  "message": "Cart cleared successfully",
  "cart": {
    "items": [],
    "total": 0
  }
}
```

**Test Cases:**

- ✅ Clear all items from cart
- ✅ Total becomes 0
- ❌ Without JWT token → 401 error

---

### 4. Orders Routes (`/api/orders`)

#### 4.1 Create Order

```
POST /api/orders
Cookie: jwt=<token>

Expected Response (201):
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "_id": "...",
    "userId": "...",
    "items": [ ...order items ],
    "totalAmount": 45.99,
    "status": "pending",
    "createdAt": "2025-11-16T..."
  }
}
```

**Test Cases:**

- ✅ Create order from non-empty cart
- ✅ Order status is "pending"
- ❌ Empty cart → 404 error (CART_NOT_FOUND)
- ❌ Without JWT token → 401 error
- ❌ Insufficient stock for any item → 400 error
- ✅ Order items snapshot current prices
- ✅ Order includes userId reference
- ⚠️ **BUG:** Cart is NOT cleared after order (should be fixed)

#### 4.2 Get Order by ID

```
GET /api/orders/507f1f77bcf86cd799439011
Cookie: jwt=<token>

Expected Response (200):
{
  "success": true,
  "data": { ...order object with populated items }
}
```

**Test Cases:**

- ✅ User can retrieve their own order
- ❌ User cannot retrieve another user's order
- ❌ Invalid order ID → 404 error
- ❌ Without JWT token → 401 error
- ✅ Book details are populated

#### 4.3 Get All User Orders

```
GET /api/orders
Cookie: jwt=<token>

Expected Response (200):
{
  "success": true,
  "data": [ ...order objects ]
}
```

**Test Cases:**

- ✅ Returns all orders for authenticated user
- ✅ Orders sorted by createdAt (newest first)
- ❌ Without JWT token → 401 error
- ✅ Empty order list returns []

---

### 5. Payment Routes (`/api/payment`)

#### 5.1 Initialize eSewa Payment

```
POST /api/payment/esewa/init/507f1f77bcf86cd799439011
Cookie: jwt=<token>

Expected Response (200):
HTML view with embedded form and redirect
```

**Test Cases:**

- ✅ Returns eSewa payment form view
- ✅ Signature is correctly generated
- ✅ All required eSewa parameters included
- ✅ Amount matches order total
- ❌ Without JWT token → 401 error
- ❌ Non-existent order → 404 error
- ❌ Already paid order → 400 error
- ❌ Cancelled order → 400 error
- ✅ Renders redirect.ejs view

#### 5.2 Verify eSewa Payment

```
GET /api/payment/esewa/verify?data=<base64_encoded_data>

Expected Response (200):
HTML success/error view
```

**Test Cases:**

- ✅ Valid payment data → success view rendered
- ✅ Order status updated to "paid"
- ✅ Stock decremented for each item
- ✅ Cart cleared after successful payment
- ✅ Payment reference stored in order
- ❌ Invalid signature → error view (SIGNATURE_MISMATCH)
- ❌ Amount mismatch → error view (AMOUNT_MISMATCH)
- ❌ Non-existent order → error view
- ❌ Missing payment data → error view
- ✅ Payment not COMPLETE status → failed view
- ✅ Renders payment/success.ejs view

#### 5.3 Handle Payment Failure

```
GET /api/payment/esewa/failed

Expected Response (200):
HTML failure view
```

**Test Cases:**

- ✅ Renders failure view
- ✅ Order status remains unchanged
- ✅ Stock is NOT decremented
- ✅ Cart is NOT cleared

#### 5.4 Check Payment Status

```
GET /api/payment/esewa/status/507f1f77bcf86cd799439011
Cookie: jwt=<token>

Expected Response (200):
{
  "success": true,
  "message": "Payment status checked",
  "data": {
    "orderId": "...",
    "orderStatus": "paid",
    "paymentStatus": "COMPLETE",
    "refId": "..."
  }
}
```

**Test Cases:**

- ✅ Checks with eSewa API
- ✅ Updates order if status changed
- ✅ Returns current status
- ❌ Without JWT token → 401 error
- ❌ Non-existent order → 404 error

---

## Authentication Testing

### JWT Token Tests

```javascript
// Test: Token Validation
GET /api/auth/me
Headers:
  Cookie: jwt=valid_token

Expected: 200 - User data returned
```

```javascript
// Test: Expired Token
GET / api / auth / me;
Headers: Cookie: jwt = expired_token;

Expected: 401 - AUTH_INVALID_TOKEN;
```

```javascript
// Test: Malformed Token
GET / api / auth / me;
Headers: Cookie: jwt = invalid.format.token;

Expected: 401 - AUTH_INVALID_TOKEN;
```

### Cookie Security Tests

- ✅ JWT cookie has `httpOnly` flag (not accessible via JavaScript)
- ✅ JWT cookie has `secure` flag in production (HTTPS only)
- ✅ JWT cookie has `sameSite=strict` (CSRF protection)
- ✅ Cookie expiration is 15 days
- ✅ Logout clears cookie with maxAge: 0

---

## Business Logic Testing

### Stock Management

```
Test: Stock Validation on Cart Add
1. Book has 5 items in stock
2. Add 3 items to cart → ✅ Success
3. Try to add 4 more items → ❌ Error (only 2 available)
4. Add 2 items → ✅ Success (total 5 in cart)
5. Create order → ✅ Order created
6. Complete payment → Stock becomes 0
```

### Cart Calculations

```
Test: Total Calculation
1. Add Book A (price 10) qty 2 → total 20
2. Add Book B (price 15) qty 1 → total 35
3. Update Book A qty to 3 → total 45
4. Remove Book A → total 15
5. Clear cart → total 0
```

### Order to Payment Flow

```
Test: Complete Order Flow
1. User registers/logs in → ✅ JWT token received
2. Add items to cart → ✅ Cart updated
3. Create order → ✅ Order created (pending)
4. Initialize payment → ✅ eSewa form generated
5. Simulate eSewa callback → ✅ Order marked paid
6. Verify: Stock updated, cart cleared → ✅ All correct
```

---

## Payment Flow Testing

### eSewa Integration Tests

#### Test Environment

- **Merchant Code:** EPAYTEST (UAT)
- **Secret Key:** 8gBm/:&EnhH.1/q
- **Payment URL:** https://rc-epay.esewa.com.np/api/epay/main/v2/form

#### Signature Verification Test

```javascript
// Test Data
message = 'total_amount=1000,transaction_uuid=ord_123,product_code=EPAYTEST';
secretKey = '8gBm/:&EnhH.1/q';

// Expected Signature (HMAC-SHA256, Base64)
signature = 'expected_base64_string';

// Test: Valid signature passes verification
// Test: Invalid signature rejects transaction
// Test: Tampered amount rejected
```

### Payment Status Scenarios

| Status    | Order Updated? | Stock Decreased? | Cart Cleared? |
| --------- | -------------- | ---------------- | ------------- |
| COMPLETE  | ✅ paid        | ✅ yes           | ✅ yes        |
| PENDING   | ✅ pending     | ❌ no            | ❌ no         |
| AMBIGUOUS | ✅ pending     | ❌ no            | ❌ no         |
| FAILED    | ✅ failed      | ❌ no            | ❌ no         |
| CANCELLED | ✅ failed      | ❌ no            | ❌ no         |

---

## Error Handling Testing

### Error Code Coverage

| Error Code | HTTP Status | Scenario            | Test Case                   |
| ---------- | ----------- | ------------------- | --------------------------- |
| AUTH_001   | 400         | Missing fields      | Register without name       |
| AUTH_002   | 400         | Invalid email       | Email without @             |
| AUTH_003   | 400         | User exists         | Register duplicate email    |
| AUTH_004   | 400         | Invalid credentials | Wrong password              |
| AUTH_005   | 404         | User not found      | Login non-existent user     |
| AUTH_006   | 401         | No token            | Request without JWT         |
| AUTH_007   | 401         | Invalid token       | Expired/malformed token     |
| BOOK_001   | 404         | Book not found      | GET non-existent book       |
| BOOK_002   | 400         | Invalid data        | Create without title        |
| CART_001   | 404         | Cart not found      | Get cart (shouldn't happen) |
| CART_002   | 404         | Item not in cart    | Update/remove non-existent  |
| CART_003   | 400         | Invalid quantity    | Add with qty < 1            |
| SEARCH_001 | 400         | Invalid query       | Search with empty string    |
| SEARCH_002 | 404         | No results          | Search non-existent book    |
| ORDER_001  | 404         | Order not found     | GET non-existent order      |
| ORDER_002  | 400         | Stock error         | Order exceeds stock         |
| SERVER_001 | 500         | Server error        | Unhandled exception         |

### Error Response Format Test

```json
{
	"success": false,
	"error": "Human-readable message",
	"code": "ERROR_CODE",
	"details": [] // Optional, for validation errors
}
```

---

## Performance & Load Testing

### Load Testing Scenarios

#### Scenario 1: Concurrent Registrations

```
1000 concurrent registration requests
Expected: All succeed without data corruption
```

#### Scenario 2: Cart Operations

```
100 users adding/updating/removing items simultaneously
Expected: No race conditions, accurate totals
```

#### Scenario 3: Payment Processing

```
50 concurrent payment verifications
Expected: No double-charging, stock accuracy
```

### Performance Benchmarks (Local)

- ✅ Register: < 500ms
- ✅ Login: < 300ms
- ✅ Get books: < 200ms (with 1000 records)
- ✅ Add to cart: < 300ms
- ✅ Search: < 400ms (complex query)

---

## Security Testing

### SQL/NoSQL Injection

```javascript
// Test: Injection in search
GET /api/books/search?query={$ne: null}
Expected: Safe - treated as string

// Test: Email injection
POST /api/auth/register
Email: "test@test.com\"; db.users.drop(); //"
Expected: Rejected by validation
```

### Authentication Bypass

```javascript
// Test: Modify JWT payload
Expected: Signature verification fails

// Test: Remove JWT cookie
Expected: 401 Unauthorized

// Test: Use another user's JWT
Expected: Can only access own data
```

### Cross-Site Scripting (XSS)

```javascript
// Test: Script in book title
POST /api/books
title: "<script>alert('XSS')</script>"
Expected: Stored and rendered safely

// Test: Script in search query
GET /api/books/search?query=<script>...</script>
Expected: Treated as text, not executed
```

### CSRF Protection

```javascript
// Test: SameSite cookie
POST /api/cart/items from different origin
Expected: Request blocked or handled securely
```

### Rate Limiting (Recommended to implement)

```javascript
// Test: 100 login attempts in 1 minute
Expected: After threshold, requests rejected
```

---

## Test Data & Fixtures

### Why Seed the Database?

**Database seeding before testing is RECOMMENDED** because:

- ✅ **Consistency** - Same test data every test run
- ✅ **Speed** - No manual data creation needed
- ✅ **Reproducibility** - Predictable test results
- ✅ **Automation** - Enables full automated testing
- ✅ **Search/Pagination** - Proper testing of these features
- ✅ **Concurrent Testing** - Multiple tests can run against known data
- ✅ **CI/CD Integration** - Seamless integration with pipelines

### Sample Books Data

```javascript
const testBooks = [
	{
		title: 'The Hobbit',
		author: 'J.R.R. Tolkien',
		price: 12.99,
		description: 'A fantasy adventure about Bilbo Baggins',
		imagePath: '/images/hobbit.jpg',
		stock: 50,
		category: 'Fiction',
	},
	{
		title: 'The Fellowship of the Ring',
		author: 'J.R.R. Tolkien',
		price: 18.99,
		description: 'The first book in the Lord of the Rings trilogy',
		imagePath: '/images/fellowship.jpg',
		stock: 40,
		category: 'Fiction',
	},
	{
		title: 'Sapiens',
		author: 'Yuval Noah Harari',
		price: 18.99,
		description: 'A brief history of humankind',
		imagePath: '/images/sapiens.jpg',
		stock: 30,
		category: 'Non-Fiction',
	},
	{
		title: 'Sapiens: Reborn',
		author: 'Yuval Noah Harari',
		price: 22.99,
		description: 'The sequel to Sapiens',
		imagePath: '/images/sapiens-reborn.jpg',
		stock: 25,
		category: 'Non-Fiction',
	},
	{
		title: 'A Brief History of Time',
		author: 'Stephen Hawking',
		price: 15.99,
		description: 'From the Big Bang to Black Holes',
		imagePath: '/images/brief-history.jpg',
		stock: 45,
		category: 'Science',
	},
	{
		title: 'The Selfish Gene',
		author: 'Richard Dawkins',
		price: 14.99,
		description: 'A revolutionary study of evolution',
		imagePath: '/images/selfish-gene.jpg',
		stock: 35,
		category: 'Science',
	},
	{
		title: 'Educated',
		author: 'Tara Westover',
		price: 19.99,
		description: 'A memoir about education and survival',
		imagePath: '/images/educated.jpg',
		stock: 20,
		category: 'Biography',
	},
	{
		title: 'Steve Jobs',
		author: 'Walter Isaacson',
		price: 21.99,
		description: 'The biography of the Apple founder',
		imagePath: '/images/steve-jobs.jpg',
		stock: 15,
		category: 'Biography',
	},
	{
		title: 'The Art of War',
		author: 'Sun Tzu',
		price: 9.99,
		description: 'Ancient military strategy',
		imagePath: '/images/art-of-war.jpg',
		stock: 60,
		category: 'History',
	},
	{
		title: 'Zero Stock Book',
		author: 'Test Author',
		price: 10.0,
		description: 'Book with zero stock for testing',
		imagePath: '/images/zero-stock.jpg',
		stock: 0,
		category: 'Other',
	},
];
```

### Sample Users Data

```javascript
const testUsers = [
	{
		name: 'Test User',
		email: 'test@example.com',
		password: 'password123', // Will be hashed
		phoneNumber: '+977-9841234567',
		isAdmin: false,
	},
	{
		name: 'Admin User',
		email: 'admin@example.com',
		password: 'adminpass123',
		isAdmin: true,
	},
	{
		name: 'John Doe',
		email: 'john@example.com',
		password: 'john123456',
		phoneNumber: '+977-9800000001',
		isAdmin: false,
	},
	{
		name: 'Jane Smith',
		email: 'jane@example.com',
		password: 'jane123456',
		phoneNumber: '+977-9800000002',
		isAdmin: false,
	},
];
```

### Database Seeding Setup

#### Option 1: Create a Seed Script (Recommended)

Create `scripts/seed.js` in your project:

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Book from '../models/book.js';
import User from '../models/user.js';
import Cart from '../models/cart.js';
import Order from '../models/order.js';

dotenv.config();

const testBooks = [
	// ... books data from above
];

const testUsers = [
	// ... users data from above
];

async function seedDatabase() {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.MONGO_URI);
		console.log('Connected to MongoDB');

		// Clear existing data
		console.log('Clearing existing data...');
		await Book.deleteMany({});
		await User.deleteMany({});
		await Cart.deleteMany({});
		await Order.deleteMany({});
		console.log('✅ Database cleared');

		// Seed books
		console.log('Seeding books...');
		const createdBooks = await Book.insertMany(testBooks);
		console.log(`✅ ${createdBooks.length} books created`);

		// Seed users (hash passwords)
		console.log('Seeding users...');
		const usersWithHashedPasswords = await Promise.all(
			testUsers.map(async (user) => ({
				...user,
				passwordHash: await bcrypt.hash(user.password, 10),
			}))
		);
		const createdUsers = await User.insertMany(
			usersWithHashedPasswords.map(({ password, ...user }) => user)
		);
		console.log(`✅ ${createdUsers.length} users created`);

		// Create empty carts for users
		console.log('Creating carts for users...');
		const carts = await Cart.insertMany(
			createdUsers.map((user) => ({
				userId: user._id,
				items: [],
				total: 0,
			}))
		);
		console.log(`✅ ${carts.length} carts created`);

		console.log('\n✅ Database seeded successfully!\n\nTest Credentials:\n');
		console.log('User 1:');
		console.log('  Email: test@example.com');
		console.log('  Password: password123\n');
		console.log('User 2 (Admin):');
		console.log('  Email: admin@example.com');
		console.log('  Password: adminpass123\n');

		await mongoose.connection.close();
		console.log('Database connection closed');
	} catch (error) {
		console.error('❌ Seeding error:', error.message);
		process.exit(1);
	}
}

// Run seeder
seedDatabase();
```

#### Update package.json

Add this script to your `package.json`:

```json
"scripts": {
	"dev": "nodemon server.js",
	"test": "echo \"Error: no test specified\" && exit 1",
	"seed": "node scripts/seed.js",
	"seed:prod": "NODE_ENV=production node scripts/seed.js"
}
```

#### Option 2: Manual MongoDB Shell Commands

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use booksDatabaseCluster0

# Clear collections
db.books.deleteMany({})
db.users.deleteMany({})
db.carts.deleteMany({})
db.orders.deleteMany({})

# Insert books
db.books.insertMany([
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    price: 12.99,
    description: "A fantasy adventure",
    imagePath: "/images/hobbit.jpg",
    stock: 50,
    category: "Fiction"
  },
  // ... more books
])

# Insert users (with hashed passwords from bcrypt)
db.users.insertMany([
  {
    name: "Test User",
    email: "test@example.com",
    passwordHash: "$2a$10$...", // hashed password
    isAdmin: false
  },
  // ... more users
])
```

#### Option 3: Postman Collection Seeding

Create a Postman collection that:

1. Registers test users
2. Creates books via API
3. Adds items to cart
4. Creates orders

This allows testing the full API flow during seeding.

### Seeding Best Practices

```
Before Each Test Run:
1. ✅ Run seed script: npm run seed
2. ✅ Verify database contents
3. ✅ Run test suite
4. ✅ Optional: Reset between test suites

During Development:
- Run seed once at start of dev session
- Use seeded data for manual testing
- Create specific test variations as needed

For CI/CD:
- Run seed as part of test setup
- Use containerized database
- Automate cleanup after tests
```

### Verifying Seeded Data

```bash
# List all books
db.books.countDocuments()  # Should return 10

# List all users
db.users.countDocuments()  # Should return 4

# Check specific book
db.books.findOne({ title: "The Hobbit" })

# Check user created
db.users.findOne({ email: "test@example.com" })
```

### Using Seeded Data in Tests

```javascript
// Example: Test with seeded data
describe('Books API with Seeded Data', () => {
	it('should find The Hobbit in database', async () => {
		const book = await Book.findOne({ title: 'The Hobbit' });
		expect(book).toBeDefined();
		expect(book.stock).toBe(50);
	});

	it('should find The Hobbit in search', async () => {
		const response = await request(app).get('/api/books/search?query=Hobbit');

		expect(response.status).toBe(200);
		expect(response.body.data.length).toBeGreaterThan(0);
		expect(response.body.data[0].title).toContain('Hobbit');
	});

	it('should test pagination with 10 books', async () => {
		const response = await request(app).get('/api/books?page=1&limit=5');

		expect(response.body.count).toBe(10);
	});
});
```

---

## Running Tests (Implementation Guide)

### Setup Jest for Unit Testing

```bash
npm install --save-dev jest supertest
```

### Example Unit Test

```javascript
// tests/auth.test.js
import request from 'supertest';
import app from '../server.js';
import User from '../models/user.js';

describe('Auth Routes', () => {
	beforeAll(async () => {
		await User.deleteMany({});
	});

	describe('POST /api/auth/register', () => {
		it('should register a new user', async () => {
			const res = await request(app).post('/api/auth/register').send({
				name: 'John Doe',
				email: 'john@example.com',
				password: 'password123',
			});

			expect(res.statusCode).toBe(201);
			expect(res.body.success).toBe(true);
			expect(res.body.user.email).toBe('john@example.com');
		});

		it('should reject duplicate email', async () => {
			const res = await request(app).post('/api/auth/register').send({
				name: 'Jane Doe',
				email: 'john@example.com',
				password: 'password123',
			});

			expect(res.statusCode).toBe(400);
			expect(res.body.code).toBe('AUTH_003');
		});
	});
});
```

### Run Tests

```bash
npm test
npm test -- --coverage
npm test -- --watch
```

---

## Checklist for Testing

### Before Deployment

- [ ] All unit tests passing
- [ ] Integration tests for complete flows passing
- [ ] Manual payment flow tested in eSewa UAT
- [ ] Security scan completed (no SQL injection, XSS)
- [ ] Load testing (min 100 concurrent requests)
- [ ] Error handling for all edge cases
- [ ] CORS properly configured
- [ ] JWT tokens validated securely
- [ ] Stock management accurate
- [ ] Email notifications working (if implemented)
- [ ] Logging sufficient for debugging
- [ ] Rate limiting implemented
- [ ] Request validation comprehensive
- [ ] Database transactions handled
- [ ] Secrets not exposed in logs/responses

### Post-Deployment Monitoring

- [ ] Monitor error rates
- [ ] Check payment success rates
- [ ] Monitor database performance
- [ ] Track API response times
- [ ] Monitor for unusual patterns
- [ ] Check JWT token validity
- [ ] Verify stock consistency

---

## Known Issues & Fixes Needed

1. **BUG:** Cart not cleared after order creation

   - **Fix:** Add cart clearing in `createOrder` controller

2. **BUG:** Variable naming inconsistency in error handling

   - **Files:** `orderController.js`, `bookController.js`
   - **Fix:** Standardize error variable names

3. **Missing:** Rate limiting on auth endpoints

   - **Recommendation:** Use `express-rate-limit`

4. **Missing:** Input sanitization

   - **Recommendation:** Use `express-validator`

5. **Unused Dependency:** Stripe installed but not used
   - **Action:** Remove from package.json if not needed

---

## References

- [Express Testing Best Practices](https://expressjs.com/en/advanced/best-practice-testing.html)
- [MongoDB Testing Documentation](https://docs.mongodb.com/manual/testing/)
- [eSewa API Documentation](https://esewa.com.np/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)

---

**Last Updated:** November 16, 2025
**Document Version:** 1.0
**Status:** Ready for Implementation
