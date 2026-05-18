# Tổng Quan Nghiệp Vụ Backend - Dự Án Biddee

Tài liệu này giải thích cách Backend xử lý các quy trình nghiệp vụ, phối hợp giữa dữ liệu off-chain và on-chain để cung cấp trải nghiệm đấu giá mượt mà.

---

## 1. Mô Hình "Hybrid" (Kết hợp On-chain & Off-chain)

Hệ thống sử dụng mô hình lai để tối ưu hóa chi phí và hiệu năng:
- **On-chain (Blockchain)**: Giữ các giá trị cốt lõi về niềm tin: Tiền ký quỹ, kết quả đấu giá, bằng chứng vận chuyển, giải quyết tranh chấp.
- **Off-chain (Backend)**: Lưu trữ dữ liệu phong phú: Hình ảnh sản phẩm, mô tả chi tiết, danh mục, bình luận, chat, thông báo.

---

## 2. Các Quy trình Nghiệp vụ Chính

### A. Định danh & Xác thực (Identity & Auth)
- **SIWE Flow**: Backend không lưu mật khẩu. Quy trình đăng nhập dựa trên chữ ký số của ví (MetaMask, v.v.). Điều này đảm bảo địa chỉ ví trên hệ thống luôn khớp với ví thực tế của người dùng.
- **Quản lý Hồ sơ**: Backend lưu các thông tin bổ sung như tên hiển thị, ảnh đại diện, địa chỉ nhận hàng để hỗ trợ quá trình vận chuyển.

### B. Đồng bộ hóa Blockchain (Blockchain Indexing)
Đây là nhiệm vụ quan trọng nhất của Backend:
1. **Lắng nghe sự kiện**: Khi người dùng tương tác với Smart Contract, một sự kiện (Event) được phát ra.
2. **Cập nhật Database**: Backend bắt các sự kiện này (như `BidPlaced`) để cập nhật giá cao nhất hiện tại vào Database ngay lập tức.
3. **Xử lý Jobs**: Các dịch vụ ngầm (cron jobs) quét các phiên đấu giá đã hết hạn để cập nhật trạng thái `ENDED` trong Database nếu Blockchain chưa kịp phát sự kiện hoặc để kích hoạt các logic phụ (như gửi email báo thắng thầu).

### C. Quản lý Quy trình Ký quỹ (Escrow Mirroring)
Backend theo dõi sát sao trạng thái ký quỹ để hiển thị Dashboard cho người dùng:
- **Task cho Người bán**: Hiển thị danh sách món hàng "Cần giao" sau khi đấu giá kết thúc.
- **Task cho Người mua**: Hiển thị nút "Xác nhận đã nhận" hoặc "Khiếu nại" khi hàng đang trên đường giao.
- **Lịch sử Vận chuyển**: Lưu trữ các mốc thời gian giao hàng, mã vận đơn (tracking number) để cả hai bên cùng theo dõi.

### D. Hệ thống Tương tác (Interaction System)
- **Chat nội bộ**: Cho phép người mua và người bán trao đổi về tình trạng món hàng một cách riêng tư.
- **Thông báo (Notifications)**: Gửi thông báo thời gian thực khi:
    - Bạn bị trả giá cao hơn (Outbid).
    - Phiên đấu giá bạn theo dõi sắp kết thúc.
    - Người bán đã gửi hàng.
    - Admin đã xử lý tranh chấp.

### E. Quản trị & KYC (Admin & KYC)
- **Duyệt KYC**: Backend quản lý quy trình tải lên giấy tờ định danh và cho phép Admin phê duyệt/từ chối người dùng.
- **Phân xử Tranh chấp**: Cung cấp giao diện cho Admin xem bằng chứng (hình ảnh, lịch sử chat) để đưa ra quyết định resolve trên Blockchain.

---

## 3. Quản lý Dữ liệu Hình ảnh
Backend sử dụng **Multer** để nhận ảnh và **Sharp** để nén/cắt ảnh sản phẩm. Điều này giúp trang web tải nhanh hơn thay vì tải ảnh gốc dung lượng lớn từ người dùng.

---

## 4. Sơ đồ Luồng Nghiệp vụ tiêu biểu (Tạo Đấu giá)

1. **User** điền form (Tiêu đề, ảnh, mô tả) trên Frontend.
2. **Backend** nhận dữ liệu, lưu vào DB với trạng thái `PENDING`, tải ảnh lên storage.
3. **User** thực hiện giao dịch `createAuction` trên Blockchain.
4. **Blockchain** phát sự kiện `AuctionCreated`.
5. **Backend Listener** bắt được sự kiện, lấy `onChainAuctionId` và cập nhật bản ghi trong DB thành `ACTIVE`.
6. Phiên đấu giá chính thức hiển thị cho toàn bộ cộng đồng.
