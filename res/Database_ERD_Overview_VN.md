# Tổng Quan Cấu Trúc Cơ Sở Dữ Liệu (Database ERD Overview)

Tài liệu này mô tả chi tiết các bảng, mối quan hệ và vai trò của từng thực thể trong cơ sở dữ liệu PostgreSQL (thông qua Prisma ORM) của dự án AuctionPlatform.

---

## 1. Sơ đồ Thực thể - Mối quan hệ (ERD)

Bạn có thể tham khảo file sơ đồ chi tiết tại: `res/AuctionPlatform_Database_ERD.puml`.

**Các nhóm thực thể chính:**
- **Người dùng (User Context)**: `User`, `KycRequest`, `Follow`, `UserActivity`.
- **Đấu giá (Auction Context)**: `AuctionMetadata`, `Bid`, `Watchlist`.
- **Giao vận & Tranh chấp (Escrow Context)**: `ShippingLog`, `DisputeLog`.
- **Tương tác (Interaction Context)**: `Conversation`, `Message`, `Notification`.
- **Quản trị (Admin Context)**: `AdminActionLog`, `AuthNonce`.

---

## 2. Chi Tiết Các Thực Thể Trọng Yếu

### A. Người dùng (User)
- **Vai trò**: Thực thể trung tâm, định danh bằng địa chỉ ví Ethereum.
- **Mối quan hệ**:
    - 1-1 với `KycRequest` để quản lý định danh.
    - 1-N với `AuctionMetadata` (cả vai trò Người bán và Người thắng).
    - 1-N với `Bid` (vai trò người tham gia đấu giá).

### B. Siêu dữ liệu Đấu giá (AuctionMetadata)
- **Vai trò**: Lưu trữ thông tin chi tiết về sản phẩm (tiêu đề, mô tả, ảnh) và ánh xạ với `onChainAuctionId` trên Blockchain.
- **Mối quan hệ**:
    - Thuộc về một `User` (Seller).
    - Chứa nhiều `Bid`, `ShippingLog` và `DisputeLog`.

### C. Lệnh thầu (Bid)
- **Vai trò**: Ghi lại lịch sử đấu giá off-chain để truy xuất nhanh mà không cần quét toàn bộ Blockchain.
- **Mối quan hệ**: Kết nối giữa một `User` (Bidder) và một `AuctionMetadata`. Lưu trữ `txHash` để đối chiếu với Blockchain.

### D. Ký quỹ & Tranh chấp (Shipping & Dispute)
- **ShippingLog**: Lưu lại các mốc thời gian giao hàng, người cập nhật và mã vận đơn.
- **DisputeLog**: Lưu vết các khiếu nại, bằng chứng và quyết định cuối cùng của Admin.

---

## 3. Quy tắc Thiết kế Dữ liệu

1. **An toàn Tiền tệ**: Các giá trị tiền tệ (như `startingPriceWei`, `amountWei`) được lưu dưới dạng **String**.
    - *Lý do*: Tránh mất độ chính xác khi xử lý số cực lớn (uint256) của Ethereum trong định dạng JSON hoặc các kiểu số thông thường của cơ sở dữ liệu.
2. **Đồng bộ On-chain**: Các bảng như `AuctionMetadata`, `Bid`, `DisputeLog` đều có các trường lưu `txHash` hoặc `onChainAuctionId`.
    - *Lý do*: Đảm bảo tính toàn vẹn dữ liệu và khả năng đối soát (audit) giữa Database và Blockchain.
3. **Audit Trail**: Sử dụng `AdminActionLog` và `UserActivity` để ghi lại mọi hành động nhạy cảm.
    - *Lý do*: Tăng tính minh bạch và hỗ trợ gỡ lỗi hoặc điều tra khi có sự cố.

---

## 4. Các Chỉ mục (Indexes) Quan trọng
Hệ thống sử dụng các chỉ mục để tối ưu hóa hiệu năng:
- **Trạng thái & Thời gian**: `[status, endTime]` trong `AuctionMetadata` để tìm kiếm các phiên đấu giá đang hoạt động.
- **Lịch sử**: `[auctionId, createdAt(sort: Desc)]` trong `Bid` để lấy giá cao nhất hiện tại nhanh nhất.
- **Ví điện tử**: `walletAddress` luôn là Unique Index để định danh người dùng.
