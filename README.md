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


# APPLICATION SETTINGS

NODE_ENV=development
PORT=3000
BACKEND_PORT=3000
BACKEND_DOMAIN=localhost

#### FRONTEND CONFIGURATION

FRONTEND_PORT=5173
FRONTEND_DOMAIN=localhost
FRONTEND_URL=http://${FRONTEND_DOMAIN}:${FRONTEND_PORT}

#### API URLs (for frontend consumption)
API_URL=http://${BACKEND_DOMAIN}:${BACKEND_PORT}

#### VITE FRONTEND VARIABLES
##### Note: Vite requires VITE_ prefix for client-side access
VITE_API_BASE_URL=http://${BACKEND_DOMAIN}:${BACKEND_PORT}
VITE_SOCKET_URL=http://${BACKEND_DOMAIN}:${BACKEND_PORT}

#### DATABASE CONFIGURATION (MongoDB)
##### For Docker Desktop: use host.docker.internal
##### For local MongoDB: use localhost
MONGODB_URI=mongodb://host.docker.internal:27017/webchat

#### Database pool settings
DB_MAX_POOL_SIZE=10
DB_SERVER_SELECTION_TIMEOUT_MS=5000
DB_SOCKET_TIMEOUT_MS=45000

#### JWT AUTHENTICATION
##### Generate secure key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=30d

#### RATE LIMITING
##### Relaxed for development (60000ms = 1 minute)
RATE_LIMIT_TTL=60000
RATE_LIMIT_LIMIT=100

#### FILE UPLOAD
FILE_MAX_SIZE=10485760
UPLOAD_PATH=./uploads

#### EMAIL CONFIGURATION
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

#### CACHE CONFIGURATION
CACHE_TTL=3600000
CACHE_MAX_ITEMS=100

#### API SECURITY
VALID_API_KEYS=dev-api-key-1,dev-api-key-2

#### MONITORING & LOGGING
LOG_LEVEL=debug

#### DEVELOPMENT TOOLS
DEBUG=true
ENABLE_SWAGGER=true

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
