# 🚻 HOSICOCO - Smart Public Toilet Map

## 📁 CẤU TRÚC DỰ ÁN (Modular Architecture)

```
HOSICOCO-PROJECT/
│
├── functions/                          # 🔒 BACKEND (Serverless Logic)
│   ├── index.js                        # Entry point - Export tất cả Cloud Functions
│   ├── modules/                        # Logic Backend (Module hóa)
│   │   ├── auth.js                     # Xác thực người dùng & admin
│   │   ├── toilet-api.js               # CRUD dữ liệu nhà vệ sinh
│   │   ├── reporting.js                # Xử lý báo cáo & duyệt bài
│   │   └── ai-vision.js                # AI phân tích ảnh (Vision API)
│   │
│   ├── ai-analysis.js                  # [Legacy] AI analysis (sẽ migrate vào modules/)
│   ├── scoring.js                      # [Legacy] CleanScore calculation
│   └── admin-logic.js                  # [Legacy] Admin logic
│
├── public/                             # 🌐 FRONTEND (Client Side)
│   │
│   ├── assets/                         # 🎨 TÀI NGUYÊN CHUNG (Dùng chung toàn dự án)
│   │   ├── global.css                  # Import variables.css + reset.css + utilities
│   │   ├── variables.css               # ⭐ CSS Variables (Màu sắc, Font, Spacing)
│   │   ├── reset.css                   # CSS Reset chuẩn
│   │   ├── images/                     # Logo, banner
│   │   └── icons/                      # SVG icons
│   │
│   ├── index.html                      # 🏠 LANDING PAGE (Trang giới thiệu)
│   │
│   ├── app/                            # 📱 [MODULE 1] USER WEB APP
│   │   ├── index.html                  # Giao diện bản đồ chính
│   │   ├── css/
│   │   │   ├── map.css                 # Style bản đồ
│   │   │   └── modal.css               # Style modal/popup
│   │   ├── js/
│   │   │   ├── map-engine.js           # Logic hiển thị bản đồ
│   │   │   └── user-report.js          # Logic gửi báo cáo
│   │   └── views/                      # Các view con (Load động vào modal)
│   │       ├── profile.html            # Hồ sơ người dùng
│   │       ├── toilet-detail.html      # Chi tiết nhà vệ sinh
│   │       └── report-form.html        # Form báo cáo
│   │
│   └── admin/                          # 👨‍💼 [MODULE 2] ADMIN PORTAL
│       ├── login.html                  # Đăng nhập Admin
│       ├── index.html                  # Dashboard thống kê
│       ├── css/
│       │   └── admin.css               # Style giao diện Admin
│       └── js/
│           └── admin.js                # Logic quản trị (gọi API quyền cao)
│
├── firestore.rules                     # 🔐 Bảo mật Database
├── storage.rules                       # 🔐 Bảo mật Storage (Ảnh)
├── firebase.json                       # Cấu hình Firebase
└── PROJECT_MANIFEST.md                 # Hiến pháp dự án
```

---

## 🎯 PHÂN TÁCH MODULE RÕ RÀNG

### 1️⃣ **Landing Page** (`public/index.html`)
- Trang giới thiệu dự án
- Call-to-action dẫn đến User App

### 2️⃣ **User Web App** (`public/app/`)
- Dành cho người dân sử dụng
- Tính năng: Xem bản đồ, tìm kiếm WC, báo cáo, đánh giá

### 3️⃣ **Admin Portal** (`public/admin/`)
- Dành cho quản trị viên
- Tính năng: Duyệt báo cáo, quản lý dữ liệu, thống kê

### 4️⃣ **Backend Functions** (`functions/modules/`)
- Xử lý logic nghiệp vụ (KHÔNG lộ ra Client)
- Phân quyền chặt chẽ (User/Admin)

---

## 🎨 CSS ARCHITECTURE

**Nguyên tắc:** Tất cả module đều import `assets/global.css`

```
assets/global.css
  ├─ @import variables.css    ⭐ Màu sắc, Font, Spacing
  ├─ @import reset.css         🧹 CSS Reset
  └─ Global Styles + Utilities
```

**Lợi ích:**
- Đồng bộ thương hiệu (Brand consistency)
- Dễ thay đổi theme toàn dự án
- Tránh duplicate code

---

## 🔒 BẢO MẬT

### Frontend (public/)
✅ CHỈ hiển thị UI  
✅ CHỈ gọi Cloud Functions  
❌ KHÔNG chứa logic tính toán  
❌ KHÔNG hardcode API keys

### Backend (functions/)
✅ Xử lý TẤT CẢ logic nghiệp vụ  
✅ Phân quyền User/Admin  
✅ Validate dữ liệu  
✅ Rate limiting

---

## 🚀 DEPLOYMENT

```bash
# Deploy Frontend (Hosting)
firebase deploy --only hosting

# Deploy Backend (Functions)
firebase deploy --only functions

# Deploy Security Rules
firebase deploy --only firestore:rules,storage:rules
```

---

## 📝 GHI CHÚ

- File `variables.css` là trung tâm của Design System
- Mọi màu sắc PHẢI dùng `var(--...)`
- Backend modules phải export functions rõ ràng
- Admin Portal có style riêng (nghiêm túc hơn User App)

---

© 2025 Hosicoco Team. Made with 💙 for a cleaner city.
# hoxicoco
