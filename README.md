# Hoxicoco

> Bản đồ nhà vệ sinh công cộng thông minh – Vì một đô thị văn minh.

Hoxicoco là ứng dụng web giúp người dùng tìm kiếm, đánh giá và báo cáo tình trạng các nhà vệ sinh công cộng. Hệ thống cũng cung cấp trang quản trị để duy trì dữ liệu địa điểm, xử lý báo cáo và quản lý nội dung.

## Tính năng

### Dành cho người dùng

- Xem các địa điểm nhà vệ sinh trên bản đồ
- Tìm kiếm và lọc theo khoảng cách, giới tính, tiện ích, khả năng tiếp cận và mức phí
- Xem thông tin chi tiết, hình ảnh và điểm đánh giá
- Dẫn đường theo vị trí hiện tại
- Đăng nhập bằng Google
- Đề xuất địa điểm nhà vệ sinh mới
- Đánh giá và gửi hình ảnh phản hồi
- Báo cáo các vấn đề như bẩn, hỏng thiết bị, hết giấy hoặc vấn đề an toàn
- Xem các địa điểm bắn pháo hoa và hỗ trợ dẫn đường
- Hỗ trợ nhiều ngôn ngữ

### Dành cho quản trị viên

- Dashboard thống kê hệ thống
- Quản lý địa điểm nhà vệ sinh
- Thêm, sửa, xoá và nhập dữ liệu hàng loạt
- Duyệt hoặc từ chối địa điểm do người dùng đề xuất
- Quản lý báo cáo và cập nhật trạng thái xử lý
- Quản lý người dùng và tài khoản admin
- Quản lý bài viết, nội dung cộng đồng và địa điểm bắn pháo hoa

## Công nghệ sử dụng

- React 19
- TypeScript
- Vite
- React Router
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting
- Firebase Cloud Functions
- React Three Fiber và Three.js
- Recharts
- i18next
- Zustand

## Yêu cầu

- Node.js 18 trở lên
- npm
- Một Firebase project đã được cấu hình
- API key của Goong Maps nếu sử dụng chức năng bản đồ và dẫn đường

## Cài đặt

Clone repository và cài đặt dependencies:

```bash
git clone https://github.com/vulananh957/hoxicoco.git
cd hoxicoco
npm install
```

Tạo file `.env.local` ở thư mục gốc nếu dự án yêu cầu biến môi trường bổ sung:

```env
GOONG_MAPS_API_KEY=your_goong_maps_api_key
```

> Cấu hình Firebase hiện được khởi tạo trong `src/services/firebase.ts`. Khi triển khai production, nên chuyển các giá trị cấu hình sang biến môi trường và không commit thông tin nhạy cảm vào repository.

## Chạy ở môi trường local

```bash
npm run dev
```

Ứng dụng sẽ chạy tại địa chỉ được Vite hiển thị trong terminal, thường là:

```text
http://localhost:5173
```

## Build production

```bash
npm run build
```

Xem thử bản build:

```bash
npm run preview
```

## Triển khai Firebase Hosting

Đăng nhập Firebase nếu cần:

```bash
firebase login
```

Build ứng dụng và triển khai:

```bash
npm run build
firebase deploy
```

Cấu hình hosting nằm trong file `firebase.json`. Thư mục `dist` được sử dụng làm thư mục public và các route của ứng dụng được rewrite về `index.html`.

## Cấu trúc dự án

```text
hoxicoco/
├── functions/                 # Firebase Cloud Functions
├── public/                    # Static assets và tài nguyên giao diện
├── src/
│   ├── apps/
│   │   ├── Admin/             # Ứng dụng quản trị
│   │   └── Client/            # Ứng dụng dành cho người dùng
│   ├── components/             # Component dùng chung
│   ├── locales/                # Bản dịch đa ngôn ngữ
│   ├── services/               # Firebase và dịch vụ bản đồ
│   ├── utils/                  # Hàm tiện ích
│   ├── App.tsx                 # Khai báo routing chính
│   └── main.tsx                # Entry point
├── firestore.rules             # Firestore Security Rules
├── storage.rules               # Firebase Storage Security Rules
├── firebase.json                # Cấu hình Firebase Hosting
├── package.json
└── README.md
```

## Bảo mật

- Không commit API key hoặc secret vào repository.
- Kiểm tra và cập nhật `firestore.rules` तथा `storage.rules` trước khi triển khai production.
- Chỉ cấp quyền quản trị cho các tài khoản được xác thực.
- Không sử dụng cấu hình Firestore hoặc Storage cho phép toàn bộ người dùng đọc và ghi dữ liệu.

## Đóng góp

Nếu muốn đóng góp cho dự án:

1. Tạo một branch mới.
2. Thực hiện thay đổi và kiểm thử local.
3. Tạo pull request với mô tả rõ ràng.

## License

Dự án hiện chưa khai báo giấy phép mã nguồn mở. Hãy bổ sung file `LICENSE` nếu muốn quy định quyền sử dụng và phân phối mã nguồn.
