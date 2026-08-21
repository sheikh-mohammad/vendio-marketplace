# Mini Marketplace — Full Stack Development Challenge

## 📌 Task Overview

Aapko ek **Full Stack Mini Marketplace Application** develop karni hai jahan users apna account create kar saken, login kar saken aur apne products marketplace par list kar saken.

Users marketplace par available products browse kar saken, search/filter kar saken aur apne khud ke products ko manage kar saken.

Is task ka purpose aapki **Frontend Development, Backend Development, Authentication, Authorization, Database Design, API Integration aur Problem Solving Skills** ko evaluate karna hai.

* * *

# 🛠 Technology Stack

### Frontend

*   HTML
    
*   CSS
    
*   JavaScript
    
*   Fetch API
    

### Backend

*   Node.js
    
*   Express.js
    
*   MongoDB
    
*   Mongoose
    

### Required Packages / Services

*   JWT
    
*   bcrypt
    
*   Nodemailer
    
*   Cloudinary
    

> **Important:** React, Next.js ya kisi frontend framework ka use allowed nahi hai. Frontend HTML, CSS aur Vanilla JavaScript mein hona chahiye.

* * *

# 1\. Authentication System

Application mein proper authentication system hona chahiye.

User ko following functionality provide karni hai:

### Signup

User following information ke sath account create kar sake:

*   Full Name
    
*   Email
    
*   Password
    
*   Confirm Password
    

Requirements:

*   Email duplicate nahi hona chahiye.
    
*   Password plain text mein database mein save nahi hona chahiye.
    
*   Password ko `bcrypt` ke through hash karke save karein.
    
*   Proper validation aur error messages implement karein.
    

* * *

### Login

Registered user Email aur Password ke through login kar sake.

Successful login ke baad:

*   JWT token generate hona chahiye.
    
*   Protected functionality sirf authenticated users access kar saken.
    
*   Invalid credentials par proper error response hona chahiye.
    

* * *

### Logout

User application se properly logout kar sake.

Logout ke baad protected functionality access nahi honi chahiye.

* * *

# 2\. Forgot Password & OTP Verification

Application mein **Forgot Password** functionality implement karni hai.

Expected flow:

**Step 1:** User apna registered email enter kare.

**Step 2:** System user ke email par OTP send kare using **Nodemailer**.

**Step 3:** User received OTP enter kare.

**Step 4:** Backend OTP verify kare.

**Step 5:** Successful verification ke baad user new password set kar sake.

**Step 6:** New password bcrypt ke through hash hokar database mein update ho.

### Important Requirements

*   Invalid OTP reject hona chahiye.
    
*   OTP ki expiry honi chahiye.
    
*   Invalid/non-existing email properly handle hona chahiye.
    
*   New password plain text mein database mein save nahi hona chahiye.
    

* * *

# 3\. Product Management

Authenticated user marketplace par apna product create kar sake.

Har product mein minimum following information honi chahiye:

*   Product Title
    
*   Description
    
*   Price
    
*   Category
    
*   Condition
    
*   Location
    
*   Product Image
    
*   Seller
    
*   Created Date
    

### Product Condition

Condition following values mein se honi chahiye:

*   New
    
*   Used
    

### Seller

Seller manually frontend se select nahi hoga.

Backend logged-in user ke JWT ke through automatically identify karega ke product kis user ne create kiya hai.

* * *

# 4\. Cloudinary Image Upload

Product create karte waqt **Product Image upload karna mandatory hai**.

Image storage ke liye **Cloudinary** use karna hai.

### Requirements

*   Image permanently local server/project mein store nahi honi chahiye.
    
*   Image Cloudinary par upload honi chahiye.
    
*   Cloudinary se received image URL MongoDB mein save hona chahiye.
    
*   Product listing aur detail page par image properly display honi chahiye.
    

> **Cloudinary implementation is task ka self-learning part hai. Documentation aur available resources use karke integration khud explore karein.**

* * *

# 5\. Product CRUD Operations

Complete Product CRUD functionality implement karni hai.

### Create Product

Authenticated user new product create kar sake.

### Read Products

Users:

*   All products dekh saken.
    
*   Single product ki complete details dekh saken.
    

### Update Product

User sirf **apna khud ka product** update kar sake.

### Delete Product

User sirf **apna khud ka product** delete kar sake.

* * *

# 🔐 6. Authorization — Important Requirement

Authentication aur Authorization different concepts hain.

Sirf logged-in hona enough nahi hai.

Suppose:

**User A** ne Product A create kiya.

**User B** login karta hai.

User B manually Product A ki Update/Delete API hit karta hai.

Backend ko request **reject** karni chahiye.

Example:

```text
User A
   ↓
Creates Product #123

User B
   ↓
DELETE /api/products/123
   ↓
❌ Access Denied
```

Ownership validation **backend par mandatory** hai.

Frontend par Edit/Delete button hide kar dena authorization nahi maana jayega.

* * *

# 7\. Marketplace Product Listing

Home page par marketplace ke tamam products display hone chahiye.

Har Product Card par minimum:

*   Product Image
    
*   Product Title
    
*   Price
    
*   Category
    
*   Condition
    
*   Location
    

Product par click karne se Product Detail Page open hona chahiye.

* * *

# 🔎 8. Search Functionality

Users products ko title ke through search kar saken.

Example:

```text
Search: iPhone
```

Possible backend request:

```text
GET /api/products?search=iphone
```

Search case-insensitive honi chahiye.

* * *

# 9\. Product Filters

Users products ko filter kar saken.

### Category Filter

Example categories:

*   Electronics
    
*   Fashion
    
*   Furniture
    
*   Vehicles
    
*   Books
    
*   Other
    

Example:

```text
GET /api/products?category=electronics
```

### Condition Filter

User select kar sake:

```text
New
Used
```

Example:

```text
GET /api/products?condition=used
```

* * *

# 10\. Product Sorting

Products ko price ke according sort karna hai.

Required options:

**Price: Low → High**

```text
GET /api/products?sort=price_asc
```

**Price: High → Low**

```text
GET /api/products?sort=price_desc
```

* * *

# 11\. Combined Query Support

Search, Filter aur Sorting ko ideally ek sath bhi work karna chahiye.

Example:

```text
GET /api/products?search=iphone&category=electronics&condition=used&sort=price_asc
```

Is request ka matlab:

> Used Electronics mein "iPhone" search karo aur results ko lowest price se highest price tak arrange karo.

* * *

# 12\. My Products

Logged-in user ke liye **My Products** page hona chahiye.

Is page par sirf currently logged-in user ke created products display hon.

User yahan se:

*   Product View
    
*   Product Edit
    
*   Product Delete
    

kar sake.

* * *

# 🖥️ 13. Required Frontend Pages

Minimum following screens/pages honi chahiye:

### Public Pages

1.  Home / Marketplace
    
2.  Product Detail
    
3.  Signup
    
4.  Login
    
5.  Forgot Password
    
6.  OTP Verification
    
7.  Reset Password
    

### Protected Pages

8.  Add Product
    
9.  My Products
    
10.  Edit Product
     

UI responsive aur properly structured honi chahiye.

* * *

# 🔌 14. Frontend + Backend Integration

Frontend ko backend APIs ke sath properly integrate karna hai.

API calls ke liye Vanilla JavaScript ka `fetch()` use karein.

Example:

```javascript
fetch("/api/products")
```

Following states properly handle karein:

*   Loading
    
*   Success
    
*   Error
    
*   Empty Data
    

API failure par application silently fail nahi honi chahiye.

User ko understandable message show hona chahiye.

* * *

# 🗄️ 15. Suggested Database Structure

Exact schema aap apni requirement ke according design kar sakte hain.

Basic structure kuch is tarah ho sakta hai:

### User

```javascript
{
  name,
  email,
  password,
  isVerified,
  createdAt
}
```

### Product

```javascript
{
  title,
  description,
  price,
  category,
  condition,
  location,
  image,
  seller,
  createdAt,
  updatedAt
}
```

`seller` ko User document ke reference/ObjectId ke through manage karna recommended hai.

* * *

# ⚠️ Important Development Rules

*   Password plain text mein store nahi hona chahiye.
    
*   JWT authentication properly implement honi chahiye.
    
*   Protected APIs middleware ke through secure honi chahiye.
    
*   Authorization backend par check honi chahiye.
    
*   Sensitive credentials code mein hard-code nahi honi chahiye.
    
*   `.env` file use karein.
    
*   `.env` GitHub par push nahi honi chahiye.
    
*   Proper HTTP status codes use karein.
    
*   APIs mein proper error handling honi chahiye.
    
*   Duplicate email handle hona chahiye.
    
*   Invalid MongoDB IDs application crash nahi karni chahiye.
    
*   Frontend aur Backend properly connected hone chahiye.
    
*   Code readable aur properly structured hona chahiye.
    

* * *

# 📁 Recommended Project Structure

Aap apni architecture design kar sakte hain, lekin backend ko properly organize karna expected hai.

Example:

```text
backend/
│
├── models/
├── middleware/
├── config/
├── utils/
├── app.js
└── server.js
```

Frontend:

```text
frontend/
│
├── css/
├── js/
├── images/
├── index.html
├── login.html
├── signup.html
├── product.html
└── ...
```

* * *

# 🧪 Testing Scenarios

Submission se pehle minimum following scenarios test karein:

**Authentication**

```text
Signup → Login → JWT → Protected Route
```

**Forgot Password**

```text
Email → OTP → Verify OTP → Reset Password → Login
```

**Product**

```text
Login → Create Product → Cloudinary Upload → View Product
```

**Ownership**

```text
User A → Create Product
User B → Login
User B → Try Update/Delete User A Product
Expected → Request Rejected
```

**Marketplace**

```text
Products → Search → Filter → Sort → Product Details
```

* * *

# 📊 Evaluation Criteria — 100 Marks

| Area | Marks |
| --- | --- |
| Authentication System | 15 |
| JWT & Protected APIs | 10 |
| Product CRUD | 15 |
| Authorization / Ownership Security | 15 |
| Cloudinary Image Upload | 15 |
| Search / Filter / Sorting | 10 |
| Frontend + Backend Integration | 10 |
| UI / UX & Responsiveness | 5 |
| Code Quality & Project Structure | 5 |
| **Total** | **100** |

* * *

# 🏆 Evaluation Notes

### Authentication — 15 Marks

Signup, Login, bcrypt, validation, Forgot Password, OTP aur password reset properly work karna chahiye.

### JWT & Protected APIs — 10 Marks

JWT properly generate/verify ho aur unauthorized users protected APIs access na kar saken.

### Product CRUD — 15 Marks

Create, Read, Update aur Delete operations properly work karne chahiye.

### Authorization — 15 Marks

Ye task ka **important evaluation point** hai.

Ek user doosre user ke products modify/delete nahi kar sakta.

Sirf frontend restriction enough nahi hogi. Backend ownership verification check ki jayegi.

### Cloudinary — 15 Marks

Actual image Cloudinary par upload honi chahiye aur image URL database mein properly store/use hona chahiye.

### Search, Filter & Sorting — 10 Marks

Search, Category, Condition aur Price Sorting properly work karni chahiye.

### Frontend + Backend Integration — 10 Marks

Frontend se APIs properly consume hon aur authentication/product flows end-to-end work karein.

### UI / UX — 5 Marks

Application usable, clean aur responsive honi chahiye.

### Code Quality — 5 Marks

Code readable ho, unnecessary duplication na ho aur backend properly structured ho.

* * *

# ⭐ Bonus Features — Optional

Core requirements complete karne ke baad additional features implement kiye ja sakte hain:

*   Multiple Product Images
    
*   Pagination
    
*   User Profile
    
*   Seller Profile
    
*   Wishlist / Favorites
    
*   Product Status: Available / Sold
    
*   Product Views Counter
    
*   Better Toast Notifications
    
*   Dark Mode
    

> Bonus functionality **core functionality ka replacement nahi hai**. Pehle required features properly complete karein.

* * *

# 📦 Final Submission

Submission mein following provide karein:

1.  GitHub Repository Link
    
2.  Complete Source Code
    
3.  Proper `README.md`
    
4.  `.env.example`
    
5.  Application Screenshots
    
6.  Working application/demo link agar deployed ho
    

### README mein mention karein:

*   Project Overview
    
*   Features
    
*   Technologies Used
    
*   Installation Steps
    
*   Required Environment Variables
    
*   Application Run Karne Ka Tarika
    

* * *

# 🚨 Final Note

Task ka focus sirf application ko visually complete karna nahi hai.

Evaluation ke waqt specially check kiya jayega:

**Authentication → Security → Authorization → Database → APIs → Cloudinary → Frontend Integration → Functionality**

Application aisi honi chahiye jahan frontend ke sath **backend bhi secure aur logically correct ho**.

**Best of luck — Build it like a real-world application. 🚀**