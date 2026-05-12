# PROJECT MANIFEST: HOXICOCO - SMART PUBLIC TOILET MAP

## 1. VISION & PHILOSOPHY (Tầm nhìn & Triết lý)
* **Tên dự án:** Hoxicoco
* **Slogan:** Bản đồ vệ sinh công cộng thông minh – Vì một đô thị văn minh.
* **Core Vibe:** Sạch sẽ (Hygiene), Tin cậy (Trust), Hiện đại (Modern), Nhân văn (Human-centric).
* **Anti-Patterns (Tuyệt đối tránh):**
    * Không dùng giao diện kiểu "Bootstrap default" hay "Admin dashboard công nghiệp".
    * Không dùng màu đen thuần (#000000) cho text.
    * Không để lộ logic xử lý (business logic) ở Client-side (HTML/JS).

## 2. DESIGN SYSTEM & UI RULES (Quan trọng - Phải tuân thủ tuyệt đối)
AI Agent phải sử dụng biến CSS (CSS Variables) cho toàn bộ dự án. Không hardcode mã màu.

### 2.1. Color Palette (Mã màu chuẩn)
* **Primary Background (Nền sạch):** `var(--bg-primary)` = `#FFFFFF` (Trắng tinh khôi) hoặc `#CAF0F8` (Xanh băng nhạt - dùng cho vùng rộng).
* **Secondary Background (Khối/Card):** `var(--bg-secondary)` = `#90E0EF` (Xanh loãng).
* **Primary Action (Nút bấm/Icon chính):** `var(--color-primary)` = `#00B4D8` (Cyan đậm).
* **Secondary Action (Hover/Focus):** `var(--color-secondary)` = `#48CAE4` (Cyan sáng).
* **Text & Heading (Chữ):**
    * `var(--text-main)` = `#03045E` (Xanh đen đại dương - Dùng cho tiêu đề).
    * `var(--text-body)` = `#023E8A` (Xanh đậm - Dùng cho nội dung).
    * tuyệt đối không dùng màu xám hoặc đen mặc định.
* **Status Colors:**
    * Sạch (Good): `#2ECC71`
    * Tạm ổn (Average): `#F1C40F`
    * Bẩn/Khẩn cấp (Bad): `#E74C3C`

### 2.2. Typography & Styling
* **Font:** Sử dụng `Inter` hoặc `Be Vietnam Pro` (Google Fonts) để tạo cảm giác hiện đại, hỗ trợ tiếng Việt tốt.
* **Border Radius:** Sử dụng `12px` hoặc `16px` cho các thẻ Card để tạo sự mềm mại (Friendly), tránh góc nhọn cứng nhắc.
* **Shadow:** Sử dụng `soft-shadow` nhẹ nhàng, không dùng shadow đen đậm.
    * Ví dụ: `box-shadow: 0 4px 20px rgba(0, 180, 216, 0.15);`

## 3. TECHNICAL ARCHITECTURE (Kiến trúc & Bảo mật)

### 3.1. Tech Stack
* **Frontend:** HTML5, CSS3 (tổ chức theo BEM hoặc Clean CSS), JavaScript (ES6+ Modules).
* **Hosting & Deployment:** Firebase Hosting.
* **Backend/Database:** Firebase Firestore & Firebase Cloud Functions.

### 3.2. Security Principles (Nguyên tắc bảo mật sống còn)
Để tránh việc người dùng "View Source" thấy logic hoặc hack dữ liệu:
1.  **Separation of Logic:**
    * **Frontend (HTML/JS):** Chỉ làm nhiệm vụ HIỂN THỊ (UI) và GỬI YÊU CẦU (Request). Tuyệt đối không chứa logic tính toán điểm số, logic duyệt bài, hay logic phân tích môi trường.
    * **Backend (Cloud Functions):** Mọi logic nghiệp vụ (tính CleanScore, AI phân tích ảnh, xác thực user) phải nằm trong Firebase Cloud Functions. Frontend chỉ gọi hàm và nhận kết quả.
2.  **Environment Variables:** Tuyệt đối không hardcode API Key nhạy cảm trong code JS client. Sử dụng `.env` và Firebase config.
3.  **Firestore Rules:** Thiết lập quy tắc bảo mật chặt chẽ. User chỉ được đọc/ghi đúng quyền hạn của mình. Không bao giờ để chế độ `allow read, write: if true;`.

## 4. FOLDER STRUCTURE (UPDATED - MODULAR ARCHITECTURE)
Yêu cầu AI Agent tổ chức file theo hướng Module hóa để dễ mở rộng và bảo mật:

```
HOXICOCO-PROJECT/
├── functions/              # BACKEND (Serverless Logic - Tuyệt đối bảo mật)
│   ├── index.js            # Entry point
│   ├── modules/            # Chia nhỏ logic backend
│   │   ├── auth.js         # Xác thực người dùng
│   │   ├── toilet-api.js   # CRUD dữ liệu nhà vệ sinh
│   │   ├── reporting.js    # Xử lý báo cáo vi phạm
│   │   └── ai-vision.js    # Xử lý ảnh bằng AI
│
├── public/                 # FRONTEND (Client Side)
│   │
│   ├── assets/             # Tài nguyên chung (Dùng chung cho cả App và Admin)
│   │   ├── global.css      # CSS biến màu (variables.css), reset.css
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── index.html          # LANDING PAGE (Trang giới thiệu dự án)
│   │
│   ├── app/                # [MODULE 1] USER WEB APP (Dành cho người dân)
│   │   ├── index.html      # Giao diện chính (Bản đồ)
│   │   ├── css/            # Style riêng cho App
│   │   │   ├── map.css
│   │   │   └── modal.css
│   │   ├── js/             # Logic riêng cho App
│   │   │   ├── map-engine.js
│   │   │   └── user-report.js
│   │   └── views/          # Các màn hình con (Load động, không reload trang)
│   │       ├── profile.html
│   │       ├── toilet-detail.html
│   │       └── report-form.html
│   │
│   └── admin/              # [MODULE 2] ADMIN PORTAL (Dành cho quản lý)
│       ├── index.html      # Dashboard thống kê
│       ├── login.html      # Trang đăng nhập quản trị
│       ├── css/            # Style riêng (Giao diện Admin nghiêm túc hơn)
│       └── js/             # Logic quản trị (Gọi API quyền cao)
│
├── firestore.rules         # Security Rules (Cực quan trọng)
├── storage.rules
├── firebase.json
└── PROJECT_MANIFEST.md
```

## 5. DEVELOPMENT ROADMAP (Giai đoạn 1 - The Foundation)
Tập trung xây dựng bộ khung vững chắc:
1.  Thiết lập môi trường Firebase (Hosting, Firestore, Auth).
2.  Xây dựng giao diện `index.html` với Design System đã quy định (Màu sắc, Font).
3.  Tích hợp Mapbox/Google Maps API (hiển thị bản đồ trơn, sạch).
4.  Tạo Mock Data (dữ liệu giả) trên Firestore để test hiển thị.
5.  Viết Security Rules cơ bản.

## 6. INSTRUCTION FOR AI AGENT (Mệnh lệnh cho AI)
* Khi viết code CSS, **bắt buộc** dùng biến `var(--...)` đã định nghĩa.
* Khi viết JS, chia nhỏ thành các module (ES Modules) để dễ quản lý.
* Luôn kiểm tra lại tính bảo mật: "Code này có lộ logic nhạy cảm ra Client không?". Nếu có, hãy chuyển nó vào `functions/`.
* Comment code bằng tiếng Việt, giải thích rõ ràng chức năng.