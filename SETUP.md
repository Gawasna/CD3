Yêu cầu môi trường: Docker 
Kéo các images cần thiết: 
1. postgres:latest
2. adminer:latest

Chạy workflow (docker-compose.yml):

```
docker-compose up -d 
```

Setup database:
Chạy prisma 
```
npx prisma db push
```

Chạy seed data:
```
npx prisma db seed
```

Setup blockchain:
1. Cài đặt ganache
2. Tạo workspace với các tham số sau:
- Name: CD3_local
- 
- chain ID: 1337
- Accounts: 100 accounts, mỗi account có 100 ETH
- Gas limit: 12,000,000
- Automine: true
3. Chạy workspace vừa tạo

Setup Meta Mask:
1. Cài đặt Meta Mask extension trên trình duyệt
3. Import ví từ ganache bằng cách sử dụng private key của một trong các accounts đã tạo ở bước trên
4. Kết nối Meta Mask với mạng ganache bằng cách thêm mạng mới với các tham số sau:
- Network Name: CD3_local
- RPC URL: http://localhost:8545
- Chain ID: 1337
- Currency Symbol: ETH
- Block Explorer URL: (để trống)
5. Lưu và kết nối

