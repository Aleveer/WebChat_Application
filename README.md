# WebChat_Application

## Tổng quan
Ứng dụng web chat full‑stack gồm:
- Backend: NestJS + MongoDB (Mongoose)
- Frontend: Vue 3 + Vite
- Docker: Compose cho môi trường dev/prod
- Terraform: Hạ tầng tham chiếu trên AWS

## Cấu trúc thư mục
```
backend/            # NestJS API
frontend/           # Vue 3 + Vite
infra/terraform/    # Terraform (AWS)
scripts/            # PowerShell auto setup/run (Windows)
```

## Yêu cầu hệ thống
- Node.js >= 18
- Docker Desktop (có Docker Compose)
- Windows PowerShell (để dùng script tự động)
- (Tuỳ chọn) Terraform >= 1.6 và AWS CLI (đã cấu hình credential) khi triển khai hạ tầng

---

## Chạy nhanh bằng PowerShell scripts (Khuyến nghị)

Scripts đã tự động hoá: cài dependencies, dựng Docker Compose, chờ container sẵn sàng, in trạng thái. Chỉ cần 1 lệnh.

- Dev (hot-reload frontend):
  ```powershell
  .\scripts\dev-run.ps1
  ```
  - Frontend dev: `http://localhost:5173`
  - Backend API: `http://localhost:3000` (health: `/health`)

- Prod-like (build image frontend + chạy qua Nginx):
  ```powershell
  .\scripts\prod-run.ps1
  ```
  - Frontend (Nginx): `http://localhost:8080`
  - Backend API: `http://localhost:3000`

Lưu ý:
- Lần đầu chạy sẽ tương đối lâu vì phải tải image và cài `npm ci`.
- Scripts sẽ tự `docker compose down` trước khi `up` để làm sạch phiên trước.

---

## Chạy thủ công (tuỳ chọn)

- Dev:
  ```bash
  docker compose up -d --build
  # Frontend: http://localhost:5173
  # Backend:  http://localhost:3000 (health: /health)
  ```

- Prod-like:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --build
  # Frontend (Nginx): http://localhost:8080
  # Backend:          http://localhost:3000
  ```

---

## Biến môi trường (.env)

Không commit file `.env`. Tự tạo theo nhu cầu. Có 2 nhóm chính:

- Backend (`backend/.env`):
  - `PORT` (mặc định 3000) — cổng API
  - `MONGODB_URI` — ví dụ: `mongodb://mongo:27017/webchat` (khi chạy bằng Compose) hoặc `mongodb://127.0.0.1:27017/webchat` (khi chạy Mongo local)
  - `MONGODB_DB` — ví dụ: `webchat`

  Ví dụ `backend/.env`:
  ```env
  PORT=3000
  MONGODB_URI=mongodb://mongo:27017/webchat
  MONGODB_DB=webchat
  ```

- Frontend (`frontend/.env`):
  - `VITE_API_BASE_URL` — URL Backend, ví dụ `http://localhost:3000`

  Ví dụ `frontend/.env`:
  ```env
  VITE_API_BASE_URL=http://localhost:3000
  ```

Ghi chú:
- Trong Docker Compose, các biến backend/frontend đã được đặt sẵn giá trị mặc định để chạy ngay. Bạn có thể chỉnh sửa trực tiếp trong `docker-compose.yml`/`docker-compose.prod.yml` hoặc thay bằng cơ chế build args/secrets tuỳ nhu cầu.
- NestJS `ConfigModule.forRoot({ isGlobal: true })` sẽ đọc biến môi trường khi chạy trực tiếp (npm). Khi chạy bằng Docker, biến được truyền từ Compose.
- Vite chỉ expose biến bắt đầu bằng `VITE_` sang phía client.

---

## Lệnh npm hữu ích (chạy ngoài Docker)

- Backend:
  ```bash
  cd backend
  npm ci
  npm run start:dev
  ```

- Frontend:
  ```bash
  cd frontend
  npm ci
  npm run dev
  ```

---

## Triển khai hạ tầng trên AWS (tham chiếu)

Yêu cầu: Terraform >= 1.6, AWS CLI đã cấu hình credential (profile mặc định hoặc profile riêng).

```bash
cd infra/terraform
terraform init
terraform plan -out tfplan
terraform apply tfplan
```

Biến Terraform (qua env hoặc `-var`):
- `TF_VAR_aws_region` (mặc định `ap-southeast-1`)
- `TF_VAR_project_name` (mặc định `webchat`)
- `TF_VAR_ssh_ingress_cidr` (mặc định `0.0.0.0/0` — nên giới hạn IP của bạn)

Outputs đáng chú ý:
- `ec2_public_ip` — IP public để SSH/truy cập dịch vụ
- `s3_bucket_name` — bucket lưu static build frontend (nếu dùng S3/CloudFront)

Triển khai ứng dụng lên EC2 (cách đơn giản):
```bash
# trên EC2 sau khi cài Docker
docker compose -f docker-compose.prod.yml up -d --build
```

Gợi ý mở rộng sản xuất:
- ECR cho image registry; EC2 chỉ kéo image
- MongoDB Atlas/DocumentDB thay vì container tự quản lý
- ALB + Auto Scaling Group thay cho 1 EC2 đơn lẻ
- S3 + CloudFront cho frontend static
- Route53 cho tên miền
- AWS Secrets Manager/SSM Parameter Store để quản lý secrets

---

## Sức khoẻ hệ thống và bảo mật

- Endpoint kiểm tra sức khoẻ: `GET /health`
- CORS đang mở `*` trong dev; nên giới hạn origin ở môi trường sản xuất nếu cần
- Không commit `.env`, credentials, Terraform state
- Hạn chế `ssh_ingress_cidr` về IP cá nhân khi triển khai
