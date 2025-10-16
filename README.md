# WebChat Application – Hướng dẫn thiết lập và chạy (Dev/Prod/Docker)

Tài liệu này hướng dẫn cách chuẩn bị biến môi trường, build và chạy dự án ở chế độ development và production bằng Docker Compose. Tất cả lệnh mẫu đều chạy tốt trên Windows PowerShell.

## Yêu cầu

- Docker Desktop (Compose v2)
- Node 20+ (chỉ cần nếu bạn muốn chạy trực tiếp ngoài Docker)

## Cấu trúc dự án

- `backend/` – API (NestJS)
- `frontend/` – Ứng dụng Vue 3 (Vite; dùng Nginx ở runtime production)
- `docker-compose.dev.yml` – cấu hình cho development
- `docker-compose.prod.yml` – cấu hình cho production (có profile `local-mongo` để bật MongoDB nội bộ)
- `.env.development`, `.env.production` – đặt tại thư mục root

## Biến môi trường (mẫu)

### Development – `.env.development`

```bash
# Backend
BACKEND_PORT=3000
# Nếu dùng MongoDB container trong compose (mặc định):
MONGODB_PORT=27017
MONGODB_URI=mongodb://mongodb:27017/webchat

# Frontend (Vite dev server)
FRONTEND_PORT=5173

# URL phục vụ cấu hình app (dev)
FRONTEND_URL=http://localhost:${FRONTEND_PORT}
API_URL=http://localhost:${BACKEND_PORT}

# Vite (frontend)
VITE_API_BASE_URL=${API_URL}
VITE_SOCKET_URL=${API_URL}
```

Ghi chú:

- Compose dev đã bao gồm service `mongodb` và `backend` sẽ chờ MongoDB khỏe (healthcheck) trước khi khởi chạy.
- Nếu muốn dùng MongoDB bên ngoài, cập nhật `MONGODB_URI` tương ứng, có thể bỏ export cổng `MONGODB_PORT`.

### Production – `.env.production`

Kịch bản A (khuyến nghị) – MongoDB bên ngoài (Atlas/managed DB/host khác):

```bash
# Backend
BACKEND_PORT=3000
MONGODB_URI= # điền SRV/URI từ Atlas hoặc host riêng

# Frontend/Domain public
FRONTEND_PORT=80
FRONTEND_DOMAIN=chat.example.com
FRONTEND_URL=http://chat.example.com

# API public (đổi https nếu có TLS ở LB/ingress)
API_URL=http://api.example.com:${BACKEND_PORT}

# Vite (frontend)
VITE_API_BASE_URL=${API_URL}
VITE_SOCKET_URL=${API_URL}
```

Kịch bản B – Chạy MongoDB trong chính docker-compose (bật profile `local-mongo`):

```bash
# Backend
BACKEND_PORT=3000

# MongoDB nội bộ (có auth)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=change_me_strong
MONGO_INITDB_DATABASE=webchat

# Backend kết nối qua hostname 'mongodb' trong mạng compose
MONGODB_URI=mongodb://admin:${MONGO_INITDB_ROOT_PASSWORD}@mongodb:27017/${MONGO_INITDB_DATABASE}?authSource=admin

# Frontend/Domain public
FRONTEND_PORT=80
FRONTEND_DOMAIN=chat.example.com
FRONTEND_URL=http://chat.example.com

# API public
API_URL=http://api.example.com:${BACKEND_PORT}

# Vite (frontend)
VITE_API_BASE_URL=${API_URL}
VITE_SOCKET_URL=${API_URL}
```

Ghi chú prod:

- Service `mongodb` trong `docker-compose.prod.yml` chỉ khởi chạy khi bật profile `local-mongo`.
- Không expose 27017 ra ngoài internet. Dùng private network, VPN, hoặc SSH tunnel khi cần truy cập.
- Nếu dùng HTTPS, đổi `FRONTEND_URL` và `API_URL` sang `https://...`.

## Chạy Development

### Khởi động (foreground)

```powershell
docker compose --env-file .env.development -f docker-compose.dev.yml up --build
```

### Khởi động (background)

```powershell
docker compose --env-file .env.development -f docker-compose.dev.yml up -d --build
```

### Truy cập

- Frontend: `http://localhost:${FRONTEND_PORT}`
- Backend (NestJS): `http://localhost:${BACKEND_PORT}`

### Dừng & dọn

```powershell
docker compose -f docker-compose.dev.yml down -v --remove-orphans
```

## Chạy Production (local/AWS EC2/ECS)

### Kịch bản A – Dùng MongoDB bên ngoài

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

### Kịch bản B – Bật MongoDB nội bộ (profile `local-mongo`)

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml --profile local-mongo up -d --build
```

### Kiểm tra logs

```powershell
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

## Lệnh hữu ích

### Xem trạng thái

```powershell
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.prod.yml ps
```

### Vào shell MongoDB trong container

```powershell
docker exec -it webchat-mongodb-dev mongosh
docker exec -it webchat-mongodb-prod mongosh -u ${MONGO_INITDB_ROOT_USERNAME} -p ${MONGO_INITDB_ROOT_PASSWORD} --authenticationDatabase admin
```

### Dọn dẹp Docker

```powershell
docker compose -f docker-compose.dev.yml down -v --remove-orphans
docker compose -f docker-compose.prod.yml down -v --remove-orphans
docker system prune -a --volumes -f
```

## Troubleshooting nhanh

- **ECONNREFUSED/ETIMEDOUT đến MongoDB**: kiểm tra `ps`, healthcheck `healthy`, đúng `MONGODB_URI`, và network/security group.
- **Cổng bận**: đổi `BACKEND_PORT`/`FRONTEND_PORT` trong file `.env.*` tương ứng.

## Ghi chú bổ sung

- Backend đọc biến `BACKEND_PORT` (mặc định 3000) theo `backend/src/main.ts`.
- Frontend Vite sử dụng biến `VITE_*` lúc build/chạy.
- Ở production, image frontend được build với `VITE_API_BASE_URL`/`VITE_SOCKET_URL` qua build args và chạy bằng Nginx.
