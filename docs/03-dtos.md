# DTOs (Data Transfer Objects)

## Mục lục
- [Tổng quan](#tổng-quan)
- [API Response DTOs](#api-response-dtos)
- [Pagination DTOs](#pagination-dtos)
- [Validation DTOs](#validation-dtos)
- [Bulk Action DTOs](#bulk-action-dtos)
- [File Upload DTOs](#file-upload-dtos)
- [Best Practices](#best-practices)

---
## API Response DTOs

### 1. BaseResponseDto

DTO cơ bản cho tất cả response.

**Cấu trúc:**
```typescript
{
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
  timestamp: string;
  requestId?: string;
}
```

**Sử dụng:**

```typescript
import { BaseResponseDto } from '@/common';

// Success response
const successResponse = BaseResponseDto.success(
  { id: '123', name: 'John' },
  'User retrieved successfully',
  'req_123'
);

// Error response
const errorResponse = BaseResponseDto.error(
  'User not found',
  'NOT_FOUND',
  { userId: '123' },
  'req_123'
);
```

**Kết quả:**

```json
// Success
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "123",
    "name": "John"
  },
  "timestamp": "2025-10-29 10:00:00",
  "requestId": "req_123"
}

// Error
{
  "success": false,
  "message": "User not found",
  "error": {
    "code": "NOT_FOUND",
    "details": {
      "userId": "123"
    }
  },
  "timestamp": "2025-10-29 10:00:00",
  "requestId": "req_123"
}
```

---

### 2. ApiResponseDto

DTO nâng cao với hỗ trợ pagination và validation errors.

**Cấu trúc:**
```typescript
{
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationErrorDto[];
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
    pagination?: PaginationMeta;
  };
}
```

**Sử dụng:**

```typescript
import { ApiResponseDto } from '@/common';

// Success response
const response = ApiResponseDto.success(
  { users: [...] },
  'Users retrieved successfully'
);

// Error response with validation errors
const errorResponse = ApiResponseDto.error(
  'Validation failed',
  [
    { field: 'email', message: 'Invalid email format' },
    { field: 'password', message: 'Password too short' }
  ]
);
```

---

### 3. SuccessResponseDto

Wrapper cho success responses.

**Sử dụng:**

```typescript
import { SuccessResponseDto } from '@/common';

@Get(':id')
async findOne(@Param('id') id: string) {
  const user = await this.userService.findById(id);
  return new SuccessResponseDto(user, 'User found successfully');
}
```

---

### 4. ErrorResponseDto

Wrapper cho error responses.

**Sử dụng:**

```typescript
import { ErrorResponseDto } from '@/common';

if (!user) {
  throw new NotFoundException(
    new ErrorResponseDto('User not found', 'USER_NOT_FOUND', { userId })
  );
}
```

---

## Pagination DTOs

### 1. PaginationDto

DTO cho pagination query parameters.

**Cấu trúc:**
```typescript
{
  page?: number;      // Default: 1
  limit?: number;     // Default: 20, Max: 100
  sortBy?: string;    // Field name
  sortOrder?: 'asc' | 'desc';  // Default: 'desc'
  search?: string;    // Search query
}
```

**Decorators:**
- `@IsOptional()`: Tất cả fields đều optional
- `@Type(() => Number)`: Transform string sang number
- `@Min()`, `@Max()`: Validation cho page và limit
- `@IsEnum()`: Validation cho sortOrder

**Sử dụng:**

```typescript
import { PaginationDto } from '@/common';

@Get()
async findAll(@Query() paginationDto: PaginationDto) {
  const { page, limit, sortBy, sortOrder } = paginationDto;
  return await this.service.findAll(page, limit, sortBy, sortOrder);
}
```

**Query string:**
```
GET /api/users?page=2&limit=50&sortBy=created_at&sortOrder=asc
```

---

### 2. PaginatedResponseDto

DTO cho paginated responses.

**Cấu trúc:**
```typescript
{
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}
```

**Sử dụng:**

```typescript
import { PaginatedResponseDto } from '@/common';

@Get()
async findAll(@Query() paginationDto: PaginationDto) {
  const { data, total } = await this.service.findAll(paginationDto);
  
  return new PaginatedResponseDto(
    data,
    {
      page: paginationDto.page,
      limit: paginationDto.limit,
      total,
      totalPages: Math.ceil(total / paginationDto.limit),
      hasNext: paginationDto.page < Math.ceil(total / paginationDto.limit),
      hasPrev: paginationDto.page > 1
    },
    'Users retrieved successfully'
  );
}
```

**Kết quả:**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    { "id": "1", "name": "User 1" },
    { "id": "2", "name": "User 2" }
  ],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true
  },
  "timestamp": "2025-10-29 10:00:00"
}
```

---

### 3. SearchDto

DTO mở rộng từ PaginationDto với search query.

**Cấu trúc:**
```typescript
{
  q?: string;         // Search query (trimmed)
  filter?: string;    // Filter criteria
  // ... inherited from PaginationDto
}
```

**Sử dụng:**

```typescript
import { SearchDto } from '@/common';

@Get('search')
async search(@Query() searchDto: SearchDto) {
  const { q, filter, page, limit } = searchDto;
  return await this.service.search(q, filter, page, limit);
}
```

**Query string:**
```
GET /api/users/search?q=john&filter=active&page=1&limit=20
```

---

## Validation DTOs

### 1. ValidationErrorDto

DTO cho validation errors.

**Cấu trúc:**
```typescript
{
  field: string;
  message: string;
  value?: any;
}
```

**Sử dụng:**

```typescript
import { ValidationErrorDto } from '@/common';

const errors: ValidationErrorDto[] = [
  new ValidationErrorDto('email', 'Email is required'),
  new ValidationErrorDto('password', 'Password must be at least 8 characters', 'abc')
];

return ApiResponseDto.error('Validation failed', errors);
```

**Kết quả:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "value": "abc"
    }
  ],
  "meta": {
    "timestamp": "2025-10-29 10:00:00"
  }
}
```

---

## Bulk Action DTOs

### 1. BulkActionDto

DTO cho bulk operations.

**Cấu trúc:**
```typescript
{
  ids: string[];      // Min: 1, Max: 100
  action: string;     // One of: 'delete', 'update', 'activate', 'deactivate'
}
```

**Validation:**
- `@IsArray()`: Phải là array
- `@IsString({ each: true })`: Mỗi item phải là string
- `@ArrayMinSize(1)`: Ít nhất 1 item
- `@ArrayMaxSize(100)`: Tối đa 100 items
- `@IsIn()`: Action phải nằm trong danh sách cho phép

**Sử dụng:**

```typescript
import { BulkActionDto } from '@/common';

@Post('bulk')
async bulkAction(@Body() bulkActionDto: BulkActionDto) {
  const { ids, action } = bulkActionDto;
  
  switch (action) {
    case 'delete':
      return await this.service.deleteMany(ids);
    case 'activate':
      return await this.service.activateMany(ids);
    case 'deactivate':
      return await this.service.deactivateMany(ids);
    default:
      throw new BadRequestException('Invalid action');
  }
}
```

**Request body:**

```json
{
  "ids": ["123", "456", "789"],
  "action": "delete"
}
```

---

### 2. IdParamDto

DTO đơn giản cho ID parameter.

**Cấu trúc:**
```typescript
{
  id: string;
}
```

**Sử dụng:**

```typescript
import { IdParamDto } from '@/common';

@Get(':id')
async findOne(@Param() params: IdParamDto) {
  return await this.service.findById(params.id);
}
```

---

## File Upload DTOs

### 1. FileUploadDto

DTO cho file metadata.

**Cấu trúc:**
```typescript
{
  filename: string;
  mimetype: string;
  size: number;
  path: string;
}
```

**Validation:**
- `@IsString()`: String fields
- `@IsNumber()`: Size field

**Sử dụng:**

```typescript
import { FileUploadDto } from '@/common';

@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(
  @UploadedFile() file: Express.Multer.File,
  @Body() fileDto: FileUploadDto
) {
  return await this.fileService.upload(file);
}
```

---

### 2. DateRangeDto

DTO cho date range queries.

**Cấu trúc:**
```typescript
{
  startDate?: Date;
  endDate?: Date;
}
```

**Sử dụng:**

```typescript
import { DateRangeDto } from '@/common';

@Get('reports')
async getReports(@Query() dateRange: DateRangeDto) {
  const { startDate, endDate } = dateRange;
  return await this.service.getReports(startDate, endDate);
}
```

**Query string:**
```
GET /api/reports?startDate=2025-01-01&endDate=2025-12-31
```

---

## Best Practices

### 1. Luôn sử dụng DTOs cho Input/Output

**❌ Không tốt:**
```typescript
@Post()
async create(@Body() body: any) {
  return await this.service.create(body);
}
```

**✅ Tốt:**
```typescript
@Post()
async create(@Body() createDto: CreateUserDto) {
  return new SuccessResponseDto(
    await this.service.create(createDto),
    'User created successfully'
  );
}
```

---

### 2. Kế thừa từ Base DTOs

**Tạo DTO mới:**

```typescript
import { PaginationDto } from '@/common';
import { IsEnum, IsOptional } from 'class-validator';

export class UserFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(['active', 'inactive', 'banned'])
  status?: string;

  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;
}
```

---

### 3. Sử dụng Validation Groups

```typescript
export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @Groups(['create', 'update'])
  name: string;

  @IsEmail()
  @Groups(['create'])
  email: string;

  @IsString()
  @MinLength(8)
  @Groups(['create', 'changePassword'])
  password: string;
}
```

---

### 4. Transform Data trong DTOs

```typescript
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;
}
```

---

### 5. Swagger Documentation

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 3,
    maxLength: 100
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;
}
```

---

### 6. Nested DTOs

```typescript
export class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  country: string;
}

export class CreateUserDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
```

---

### 7. Partial DTOs cho Update

```typescript
import { PartialType } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Tất cả fields từ CreateUserDto trở thành optional
}
```

---

### 8. Omit Fields

```typescript
import { OmitType } from '@nestjs/swagger';

export class CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: string;
}

// Omit password khỏi response
export class UserResponseDto extends OmitType(CreateUserDto, ['password']) {}
```

---

### 9. Pick Fields

```typescript
import { PickType } from '@nestjs/swagger';

// Chỉ lấy email và password
export class LoginDto extends PickType(CreateUserDto, ['email', 'password']) {}
```

---

## Ví dụ Hoàn chỉnh

### Controller với DTOs

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  PaginationDto,
  PaginatedResponseDto,
  SuccessResponseDto,
  BulkActionDto,
  IdParamDto,
} from '@/common';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // List with pagination
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { data, total } = await this.usersService.findAll(paginationDto);
    
    return new PaginatedResponseDto(
      data,
      {
        page: paginationDto.page,
        limit: paginationDto.limit,
        total,
        totalPages: Math.ceil(total / paginationDto.limit),
        hasNext: paginationDto.page < Math.ceil(total / paginationDto.limit),
        hasPrev: paginationDto.page > 1,
      },
      'Users retrieved successfully'
    );
  }

  // Get one
  @Get(':id')
  async findOne(@Param() params: IdParamDto) {
    const user = await this.usersService.findById(params.id);
    return new SuccessResponseDto(user, 'User found');
  }

  // Create
  @Post()
  async create(@Body() createDto: CreateUserDto) {
    const user = await this.usersService.create(createDto);
    return new SuccessResponseDto(user, 'User created successfully');
  }

  // Update
  @Put(':id')
  async update(
    @Param() params: IdParamDto,
    @Body() updateDto: UpdateUserDto
  ) {
    const user = await this.usersService.update(params.id, updateDto);
    return new SuccessResponseDto(user, 'User updated successfully');
  }

  // Delete
  @Delete(':id')
  async remove(@Param() params: IdParamDto) {
    await this.usersService.remove(params.id);
    return new SuccessResponseDto(null, 'User deleted successfully');
  }

  // Bulk action
  @Post('bulk')
  async bulkAction(@Body() bulkActionDto: BulkActionDto) {
    const result = await this.usersService.bulkAction(
      bulkActionDto.ids,
      bulkActionDto.action
    );
    return new SuccessResponseDto(result, `Bulk ${bulkActionDto.action} completed`);
  }
}
```

---

## Tham khảo

- [Class Validator Documentation](https://github.com/typestack/class-validator)
- [Class Transformer Documentation](https://github.com/typestack/class-transformer)
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [Swagger/OpenAPI](https://docs.nestjs.com/openapi/types-and-parameters)

