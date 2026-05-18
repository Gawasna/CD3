# Tổng Quan Nghiệp Vụ Frontend - Dự Án Biddee

Tài liệu này mô tả các trải nghiệm người dùng, luồng nghiệp vụ phía giao diện và cách Frontend kết nối giữa người dùng cuối với các lớp Backend và Blockchain.

---

## 1. Trải nghiệm Người dùng Cốt lõi (Core UX)

Frontend của Biddee được thiết kế để đơn giản hóa các thao tác phức tạp của Blockchain, giúp người dùng phổ thông cũng có thể tham gia đấu giá dễ dàng.

### A. Kết nối & Định danh
- **Ví là tài khoản**: Không có đăng ký email/mật khẩu. Người dùng chỉ cần kết nối ví (MetaMask, v.v.).
- **SIWE (Sign-In with Ethereum)**: Để truy cập các tính năng off-chain (như xem địa chỉ giao hàng), người dùng thực hiện một thao tác ký tin nhắn an toàn để xác thực phiên làm việc.

### B. Khám phá & Tìm kiếm
- **Trang Explore**: Cho phép người dùng lọc các phiên đấu giá theo danh mục (Điện tử, Thời trang, v.v.), trạng thái (Đang hoạt động, Sắp diễn ra) và sắp xếp theo giá hoặc thời gian.
- **Dữ liệu thời gian thực**: Sử dụng cơ chế polling hoặc lắng nghe sự kiện để cập nhật giá thầu mới nhất mà người dùng không cần tải lại trang.

---

## 2. Các Quy trình Nghiệp vụ Người dùng

### A. Tạo Đấu giá (Seller Flow)
1. **Nhập thông tin**: Người bán tải ảnh, nhập tiêu đề, mô tả và chọn danh mục.
2. **Cấu hình kinh tế**: Thiết lập giá khởi điểm, tiền cọc, và tùy chọn "Mua ngay".
3. **Thanh toán cọc**: Frontend gọi Smart Contract để người bán gửi ETH tiền cọc. Quá trình này được hướng dẫn từng bước qua các trạng thái loading minh bạch.

### B. Tham gia Đấu giá (Buyer Flow)
- **Đặt thầu (Bidding)**: Người dùng nhập giá thầu (phải cao hơn giá hiện tại + bước giá tối thiểu). Frontend sẽ tính toán và hiển thị thông báo nếu số dư ví không đủ.
- **Theo dõi (Watchlist)**: Người dùng có thể lưu các phiên đấu giá quan tâm để nhận thông báo khi có biến động.

### C. Quản lý Sau đấu giá (Escrow Flow)
Frontend cung cấp các bảng điều khiển (Dashboards) riêng biệt:
- **Người bán**: Theo dõi danh sách hàng cần giao, nhập thông tin vận chuyển và yêu cầu giải ngân tiền.
- **Người mua**: Theo dõi hàng đang về, nút xác nhận đã nhận hàng hoặc nút mở tranh chấp nếu có vấn đề.

---

## 3. Quy trình KYC & Hồ sơ
Để tăng tính minh bạch, một số phiên đấu giá cao cấp có thể yêu cầu người dùng phải qua bước KYC. Frontend xử lý:
- Tải lên ảnh giấy tờ định danh (CCCD/Hộ chiếu).
- Hiển thị trạng thái duyệt của Admin (Đang chờ, Đã duyệt, Bị từ chối).

---

## 4. Hệ thống Tương tác & Thông báo
- **Trung tâm Thông báo**: Hiển thị các sự kiện quan trọng (Bạn đã thắng cuộc, Bạn bị trả giá cao hơn, Hàng đã được gửi).
- **Hệ thống Chat**: Giao diện nhắn tin thời gian thực giữa Người mua và Người bán để trao đổi về sản phẩm và vận chuyển.

---

## 5. Xử lý Tranh chấp (Dispute UI)
Khi có vấn đề, giao diện tranh chấp sẽ hiển thị:
- Form nhập lý do và bằng chứng hình ảnh.
- Khoản phí ký quỹ tranh chấp cần nạp.
- Trạng thái xử lý của Admin.

---

## 6. Bản Đồ Trang Web (Sitemap)

- `/`: Trang chủ giới thiệu nền tảng.
- `/explore`: Khám phá tất cả đấu giá.
- `/auctions/[id]`: Chi tiết một phiên đấu giá.
- `/create-auction`: Quy trình tạo đấu giá mới.
- `/dashboard`: Tổng quan cá nhân (Sản phẩm của tôi, Đơn hàng của tôi).
- `/profile`: Cài đặt tài khoản và thông tin giao hàng.
- `/admin`: Giao diện dành cho quản trị viên (Duyệt KYC, Phân xử tranh chấp).
