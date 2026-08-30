# Zubyte Website Backend (Express.js + MongoDB)

This is the production-ready REST API backend for the **Zubyte Website**, built with **Node.js**, **Express.js**, and **MongoDB (Mongoose ODM)**.

---

## 📁 Architecture Overview

```text
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & lifecycle handlers
│   ├── models/
│   │   ├── Inquiry.js            # Contact inquiries, RFPs & attachment schema
│   │   ├── Service.js            # 5 disciplines & 21 services
│   │   ├── Product.js            # 4 enterprise product suites & products
│   │   ├── CaseStudy.js          # Portfolio STAR case studies
│   │   ├── DemoRequest.js        # Product demo bookings
│   │   ├── Subscriber.js         # Newsletter subscribers
│   │   └── Company.js            # Company stats, leadership, offices & FAQs
│   ├── controllers/
│   │   ├── contactController.js  # Form submissions & admin management
│   │   ├── serviceController.js  # Services CRUD & discipline queries
│   │   ├── productController.js  # Product suites CRUD
│   │   ├── portfolioController.js# Case studies with multi-criteria filtering
│   │   ├── demoController.js     # Demo bookings & newsletter subscriptions
│   │   └── companyController.js  # Company identity & FAQs
│   ├── routes/
│   │   ├── contactRoutes.js      # /api/contact
│   │   ├── serviceRoutes.js      # /api/services
│   │   ├── productRoutes.js      # /api/products
│   │   ├── portfolioRoutes.js    # /api/portfolio
│   │   ├── demoRoutes.js         # /api/demo & /api/newsletter
│   │   └── companyRoutes.js      # /api/company & /api/faqs
│   ├── middlewares/
│   │   ├── errorHandler.js       # Centralized error handler
│   │   ├── upload.js             # Multer upload handler (PDF, DOCX, ZIP, images)
│   │   ├── rateLimiter.js        # Rate limiting for public form endpoints
│   │   └── validate.js           # Request body & email validator
│   ├── seeds/
│   │   └── seedData.js           # Database seeder with all initial Zubyte data
│   ├── utils/
│   │   └── apiResponse.js        # Consistent JSON response formatter
│   ├── app.js                   # Express application setup
│   └── server.js                # Server entrypoint with graceful shutdown
├── uploads/                     # Upload directory for contact form attachments
├── .env.example                 # Example environment variables
├── .gitignore                   # Backend git ignore rules
├── package.json                 # Dependencies & scripts
└── README.md                    # Complete API documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### 2. Installation
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Default `.env` configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/zubyte_db
CLIENT_URL=http://localhost:3000
MAX_FILE_SIZE_MB=15
```

### 4. Seed the Database
Pre-populate MongoDB with all 21 services, 4 product suites, 21 STAR case studies, company metadata, and FAQs:
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
The API server will run at: `http://localhost:5000`

---

## 📡 REST API Reference

### Health Check
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns server health status & timestamp |

---

### 1. Contact & Inquiries (`/api/contact`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/contact` | Public | Submit contact form with optional file attachment (`multipart/form-data`) |
| `GET` | `/api/contact` | Admin | List all inquiries (supports `?status=new`, `?page=1`, `?search=term`) |
| `GET` | `/api/contact/:id` | Admin | Get single inquiry details |
| `PATCH` | `/api/contact/:id` | Admin | Update status (`new`, `in_review`, `contacted`, `archived`) or `internalNotes` |

#### Example Contact Submission (JSON):
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Sarah",
    "lastName": "Jenkins",
    "email": "sarah@acme.com",
    "company": "Acme Corp",
    "serviceInterest": "Web Development",
    "message": "We would like to build a modern client portal with Next.js."
  }'
```

---

### 2. Services (`/api/services`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/services` | Get all 5 discipline groups & 21 services |
| `GET` | `/api/services/:slug` | Get specific discipline (`build`, `design`, `grow`, `deploy`, `engineering`) |
| `POST` | `/api/services` | Add new discipline / service group |
| `PUT` | `/api/services/:id` | Update discipline group |
| `DELETE` | `/api/services/:id` | Delete discipline group |

---

### 3. Products (`/api/products`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Get all product suites (*Zubyte Edu*, *Zubyte Business*, *Zubyte Work*, *Zubyte Staff*) |
| `GET` | `/api/products/:id` | Get specific product suite details |
| `POST` | `/api/products` | Create a product suite |
| `PUT` | `/api/products/:id` | Update product suite |
| `DELETE` | `/api/products/:id` | Delete product suite |

---

### 4. Portfolio & STAR Case Studies (`/api/portfolio`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/portfolio` | List case studies. Supports filters: `?service=SEO`, `?group=Build`, `?search=kubernetes` |
| `GET` | `/api/portfolio/:id` | Get single case study details |
| `POST` | `/api/portfolio` | Add new case study with STAR breakdown |
| `PUT` | `/api/portfolio/:id` | Update case study |
| `DELETE` | `/api/portfolio/:id` | Delete case study |

---

### 5. Demos & Newsletter (`/api/demo`, `/api/newsletter`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/demo` | Book a product demo (`name`, `email`, `company`, `productSuite`, `teamSize`) |
| `GET` | `/api/demo` | List all booked demo requests |
| `POST` | `/api/newsletter` | Subscribe email to tech updates & insights |

---

### 6. Company & FAQs (`/api/company`, `/api/faqs`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/company` | Company stats, CEO quote, legal information & office locations |
| `GET` | `/api/faqs` | List frequently asked questions |

---

## 🔒 Security Features
- **Helmet**: Secures HTTP response headers.
- **CORS**: Restricted to frontend origins (`http://localhost:3000`).
- **Rate Limiting**: Throttles brute force and spam on `/api/contact` and `/api/demo`.
- **Sanitized Uploads**: Restricts file types to `.pdf`, `.docx`, `.png`, `.jpg`, `.zip` with a 15MB limit.
- **Centralized Error Handling**: Ensures stack traces are never exposed in production responses.

