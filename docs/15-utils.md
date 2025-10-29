# Utils (Utilities)

## Mục lục
- [Tổng quan](#tổng-quan)
- [Validation Utils](#validation-utils)
- [Sanitization Utils](#sanitization-utils)
- [Password Utils](#password-utils)
- [String Utils](#string-utils)
- [Pagination Utils](#pagination-utils)
- [Response Utils](#response-utils)
- [File Utils](#file-utils)
- [Circuit Breaker](#circuit-breaker)
- [Environment Validation](#environment-validation)
- [Error Response Formatter](#error-response-formatter)
- [Best Practices](#best-practices)

---

## Tổng quan

Utils (Utilities) là tập hợp các helper functions và classes tiện ích được sử dụng xuyên suốt ứng dụng. Common module cung cấp các utils cho validation, sanitization, password hashing, string manipulation và nhiều mục đích khác.

### Phân loại Utils

1. **Validation**: Kiểm tra tính hợp lệ của dữ liệu
2. **Sanitization**: Làm sạch và an toàn hóa input
3. **Password**: Hash và verify passwords
4. **String**: Xử lý chuỗi ký tự
5. **Pagination**: Tính toán pagination
6. **Response**: Format API responses
7. **File**: Xử lý files
8. **Circuit Breaker**: Error handling pattern
9. **Environment**: Validate env variables
10. **Error Formatting**: Format error responses

---

## Validation Utils

### ValidationUtils Class

Class cung cấp validation methods với Zod và class-validator.

#### 1. isValidObjectId()

Kiểm tra MongoDB ObjectId.

```typescript
import { ValidationUtils } from '@/common';

ValidationUtils.isValidObjectId('507f1f77bcf86cd799439011'); // true
ValidationUtils.isValidObjectId('invalid-id'); // false
```

---

#### 2. isValidEmail()

Kiểm tra email format.

```typescript
ValidationUtils.isValidEmail('user@example.com'); // true
ValidationUtils.isValidEmail('invalid.email'); // false
```

---

#### 3. isValidPhoneNumber()

Kiểm tra phone number (international format).

```typescript
ValidationUtils.isValidPhoneNumber('+84912345678'); // true
ValidationUtils.isValidPhoneNumber('0912345678'); // false
```

---

#### 4. isValidUrl()

Kiểm tra URL format.

```typescript
ValidationUtils.isValidUrl('https://example.com'); // true
ValidationUtils.isValidUrl('not a url'); // false
```

---

#### 5. isValidImageUrl()

Kiểm tra image URL với extension.

```typescript
ValidationUtils.isValidImageUrl('https://example.com/photo.jpg'); // true
ValidationUtils.isValidImageUrl('https://example.com/doc.pdf'); // false
```

---

### Zod Schemas

#### EmailSchema

```typescript
import { EmailSchema } from '@/common/utils/validation.utils';

const result = EmailSchema.safeParse('user@example.com');
if (result.success) {
  console.log('Valid email:', result.data);
} else {
  console.log('Invalid:', result.error);
}
```

---

#### PhoneNumberSchema

```typescript
import { PhoneNumberSchema } from '@/common/utils/validation.utils';

const phone = PhoneNumberSchema.parse('+84912345678');
// Throws ZodError if invalid
```

---

#### PasswordSchema

```typescript
import { PasswordSchema } from '@/common/utils/validation.utils';

const password = PasswordSchema.parse('SecurePass123!');
// Must have: min 8 chars, uppercase, lowercase, number, special char
```

---

#### UsernameSchema

```typescript
import { UsernameSchema } from '@/common/utils/validation.utils';

const username = UsernameSchema.parse('john_doe-123');
// 3-20 chars, alphanumeric, underscore, hyphen only
```

---

### Validation Methods với Zod

#### validateEmail()

```typescript
const result = ValidationUtils.validateEmail('user@example.com');

if (result.success) {
  console.log('Email:', result.data); // Lowercase, trimmed
} else {
  console.log('Errors:', result.error.issues);
}
```

---

#### validatePassword()

```typescript
const result = ValidationUtils.validatePassword('MyPass123!');

if (!result.success) {
  result.error.issues.forEach(issue => {
    console.log(issue.message);
  });
}
```

---

#### validateObjectId()

```typescript
const result = ValidationUtils.validateObjectId('507f1f77bcf86cd799439011');
console.log(result.success); // true
```

---

### Sanitization Methods

#### sanitizeString()

Loại bỏ script tags và XSS vectors.

```typescript
const clean = ValidationUtils.sanitizeString(
  '<script>alert("xss")</script>Hello'
);
// Result: 'Hello'
```

---

#### isSafeString()

Kiểm tra string có an toàn không.

```typescript
ValidationUtils.isSafeString('Hello World'); // true
ValidationUtils.isSafeString('<script>alert("xss")</script>'); // false
```

---

### Multiple Validation

```typescript
const result = ValidationUtils.validateMultiple('user@example.com', [
  { schema: EmailSchema, fieldName: 'email' },
  { schema: z.string().min(5), fieldName: 'minLength' },
]);

console.log(result.isValid); // boolean
console.log(result.errors); // Array of errors
```

---

## Sanitization Utils

### Sanitization Functions

#### sanitizeMongoInput()

Làm sạch input cho MongoDB queries.

```typescript
import { sanitizeMongoInput } from '@/common';

const clean = sanitizeMongoInput('user$input{test}');
// Removes: $, {, }, [, ]
```

---

#### sanitizeObjectId()

Validate và sanitize ObjectId.

```typescript
import { sanitizeObjectId } from '@/common';

try {
  const id = sanitizeObjectId('507f1f77bcf86cd799439011');
  console.log('Valid ID:', id);
} catch (error) {
  console.log('Invalid ObjectId');
}
```

---

#### sanitizeEmail()

Normalize email (lowercase, trim).

```typescript
import { sanitizeEmail } from '@/common';

const email = sanitizeEmail('  User@EXAMPLE.com  ');
// Result: 'user@example.com'
```

---

#### sanitizePhoneNumber()

Normalize phone number.

```typescript
import { sanitizePhoneNumber } from '@/common';

const phone = sanitizePhoneNumber('+84 912-345-678');
// Result: '+84912345678'
```

---

### Safe Versions

Safe versions trả về `null` thay vì throw error.

```typescript
import {
  sanitizeObjectIdSafe,
  sanitizeEmailSafe,
  sanitizePhoneNumberSafe,
} from '@/common';

const id = sanitizeObjectIdSafe('invalid'); // null
const email = sanitizeEmailSafe('invalid'); // null
const phone = sanitizePhoneNumberSafe('invalid'); // null
```

---

### Regex Utilities

#### escapeRegexCharacters()

Escape special regex characters.

```typescript
import { escapeRegexCharacters } from '@/common';

const escaped = escapeRegexCharacters('user.name+test');
// Result: 'user\\.name\\+test'
```

---

#### createSafeRegex()

Tạo safe regex từ user input.

```typescript
import { createSafeRegex } from '@/common';

const regex = createSafeRegex('search term', 'i');
// Safe regex for MongoDB queries
const results = await Model.find({ name: regex });
```

---

### Query Object Sanitization

#### sanitizeQueryObject()

Sanitize MongoDB query object.

```typescript
import { sanitizeQueryObject } from '@/common';

const query = {
  $where: 'malicious code',
  name: 'John',
  $gt: { age: 18 }
};

const safe = sanitizeQueryObject(query);
// Removes $ prefixes from keys
```

---

## Password Utils

### PasswordUtils Class

#### hashPassword()

Hash password với bcrypt.

```typescript
import { PasswordUtils } from '@/common';

const hashed = await PasswordUtils.hashPassword('MyPassword123!');
// Uses bcrypt with 12 rounds
```

---

#### comparePassword()

So sánh password với hash.

```typescript
const isMatch = await PasswordUtils.comparePassword(
  'MyPassword123!',
  hashedPassword
);

if (isMatch) {
  console.log('Password correct');
}
```

---

#### validatePasswordStrength()

Kiểm tra độ mạnh của password.

```typescript
const result = PasswordUtils.validatePasswordStrength('weak');

console.log(result.isValid); // false
console.log(result.score); // 0-7
console.log(result.feedback); // Array of suggestions
```

**Scoring:**
- Length >= 8: +1 point
- Length >= 12: +1 point
- Length >= 16: +1 point
- Lowercase: +1 point
- Uppercase: +1 point
- Numbers: +1 point
- Special chars: +1 point
- Not common: -2 if common

**Valid:** Score >= 3

---

#### generateRandomPassword()

Tạo random password.

```typescript
const password = PasswordUtils.generateRandomPassword(16);
// Random password with 16 characters
// Contains: uppercase, lowercase, numbers, special chars
```

---

#### isCommonPassword()

Kiểm tra password có phổ biến/yếu không.

```typescript
PasswordUtils.isCommonPassword('password123'); // true
PasswordUtils.isCommonPassword('MySecure!Pass99'); // false
```

---

### Usage Example

```typescript
@Post('register')
async register(@Body() dto: RegisterDto) {
  // Validate strength
  const strength = PasswordUtils.validatePasswordStrength(dto.password);
  
  if (!strength.isValid) {
    throw new BadRequestException({
      message: 'Password too weak',
      feedback: strength.feedback,
    });
  }

  // Hash password
  const hashedPassword = await PasswordUtils.hashPassword(dto.password);

  // Create user
  const user = await this.usersService.create({
    ...dto,
    password: hashedPassword,
  });

  return user;
}

@Post('login')
async login(@Body() dto: LoginDto) {
  const user = await this.usersService.findByEmail(dto.email);

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // Compare password
  const isValid = await PasswordUtils.comparePassword(
    dto.password,
    user.password
  );

  if (!isValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  return this.authService.generateTokens(user);
}
```

---

## String Utils

### StringUtils Class

#### generateRandomString()

Tạo random hex string.

```typescript
import { StringUtils } from '@/common';

const random = StringUtils.generateRandomString(16);
// 32 characters hex string
```

---

#### generateUUID()

Tạo UUID v4.

```typescript
const uuid = StringUtils.generateUUID();
// e.g., '550e8400-e29b-41d4-a716-446655440000'
```

---

#### maskEmail()

Che email để bảo mật.

```typescript
const masked = StringUtils.maskEmail('john.doe@example.com');
// Result: 'j******e@example.com'
```

---

#### maskPhoneNumber()

Che phone number.

```typescript
const masked = StringUtils.maskPhoneNumber('+84912345678');
// Result: '+84*******78'
```

---

#### pascalCase()

Convert sang PascalCase.

```typescript
StringUtils.pascalCase('hello world'); // 'HelloWorld'
StringUtils.pascalCase('user-name'); // 'UserName'
```

---

#### slugifyVietnamese()

Tạo slug hỗ trợ tiếng Việt.

```typescript
const slug = StringUtils.slugifyVietnamese('Xin chào Việt Nam');
// Result: 'xin-chao-viet-nam'
```

---

#### truncate()

Cắt chuỗi với suffix.

```typescript
const short = StringUtils.truncate('This is a long text', 10, '...');
// Result: 'This is...'
```

---

#### getInitials()

Lấy initials từ tên.

```typescript
const initials = StringUtils.getInitials('John Doe');
// Result: 'JD'
```

---

#### isEmpty()

Kiểm tra string rỗng (sau khi trim).

```typescript
StringUtils.isEmpty('   '); // true
StringUtils.isEmpty('hello'); // false
```

---

#### reverse()

Đảo ngược string.

```typescript
StringUtils.reverse('hello'); // 'olleh'
```

---

### Usage Example

```typescript
@Post('users')
async createUser(@Body() dto: CreateUserDto) {
  // Generate username from email
  const username = StringUtils.slugifyVietnamese(dto.fullName);

  // Generate verification token
  const verificationToken = StringUtils.generateRandomString(32);

  const user = await this.usersService.create({
    ...dto,
    username,
    verificationToken,
  });

  // Mask email for logging
  this.logger.log(`User created: ${StringUtils.maskEmail(user.email)}`);

  return user;
}
```

---

## Pagination Utils

### PaginationUtils Class

#### calculatePagination()

Tính toán pagination metadata.

```typescript
import { PaginationUtils } from '@/common';

const pagination = PaginationUtils.calculatePagination(
  2,    // page
  20,   // limit
  95    // total
);

console.log(pagination);
// {
//   page: 2,
//   limit: 20,
//   total: 95,
//   totalPages: 5,
//   hasNext: true,
//   hasPrev: true,
//   offset: 20
// }
```

---

#### validatePaginationParams()

Validate và normalize pagination params.

```typescript
const { page, limit } = PaginationUtils.validatePaginationParams(
  0,    // Invalid page
  200   // Exceeds max
);

console.log(page);  // 1 (minimum)
console.log(limit); // 100 (maximum)
```

**Rules:**
- Page min: 1
- Limit min: 1
- Limit max: 100
- Default page: 1
- Default limit: 20

---

### Usage Example

```typescript
@Get()
async findAll(@Query() query: PaginationDto) {
  // Validate params
  const { page, limit } = PaginationUtils.validatePaginationParams(
    query.page,
    query.limit
  );

  // Fetch data
  const [data, total] = await Promise.all([
    this.service.findAll(page, limit),
    this.service.count(),
  ]);

  // Calculate pagination
  const pagination = PaginationUtils.calculatePagination(
    page,
    limit,
    total
  );

  return {
    data,
    pagination,
  };
}
```

---

## Response Utils

### ResponseUtils Class

#### success()

Tạo success response.

```typescript
import { ResponseUtils } from '@/common';

return ResponseUtils.success(
  { id: '123', name: 'John' },
  'User created successfully'
);

// {
//   success: true,
//   data: { id: '123', name: 'John' },
//   message: 'User created successfully',
//   timestamp: '2025-10-29 10:00:00'
// }
```

---

#### error()

Tạo error response.

```typescript
return ResponseUtils.error(
  'User not found',
  'USER_NOT_FOUND'
);

// {
//   success: false,
//   message: 'User not found',
//   error: 'USER_NOT_FOUND',
//   timestamp: '2025-10-29 10:00:00'
// }
```

---

#### paginated()

Tạo paginated response.

```typescript
return ResponseUtils.paginated(
  users,        // data
  2,            // page
  20,           // limit
  95,           // total
  'Users retrieved successfully'
);

// {
//   success: true,
//   data: [...],
//   pagination: {
//     page: 2,
//     limit: 20,
//     total: 95,
//     totalPages: 5,
//     hasNext: true,
//     hasPrev: true,
//     offset: 20
//   },
//   message: 'Users retrieved successfully',
//   timestamp: '2025-10-29 10:00:00'
// }
```

---

## File Utils

### FileUtils Class

#### getFileExtension()

Lấy file extension.

```typescript
import { FileUtils } from '@/common';

FileUtils.getFileExtension('photo.jpg'); // 'jpg'
FileUtils.getFileExtension('document.pdf'); // 'pdf'
```

---

#### isValidImageType()

Kiểm tra image MIME type.

```typescript
FileUtils.isValidImageType('image/jpeg'); // true
FileUtils.isValidImageType('application/pdf'); // false
```

**Supported:**
- image/jpeg
- image/jpg
- image/png
- image/gif
- image/webp
- image/svg+xml

---

#### isValidDocumentType()

Kiểm tra document MIME type.

```typescript
FileUtils.isValidDocumentType('application/pdf'); // true
FileUtils.isValidDocumentType('image/jpeg'); // false
```

**Supported:**
- application/pdf
- application/msword
- application/vnd.openxmlformats-officedocument.wordprocessingml.document
- application/vnd.ms-excel
- application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- text/plain

---

#### formatFileSize()

Format file size thành human-readable.

```typescript
FileUtils.formatFileSize(1024); // '1 KB'
FileUtils.formatFileSize(1048576); // '1 MB'
FileUtils.formatFileSize(1073741824); // '1 GB'
```

---

#### generateFileName()

Tạo unique filename.

```typescript
const filename = FileUtils.generateFileName('photo.jpg');
// Result: '1635789012345_a3f2b8c1.jpg'
```

---

#### sanitizeFileName()

Làm sạch filename.

```typescript
const safe = FileUtils.sanitizeFileName('My Photo (2023).jpg');
// Result: 'My_Photo_2023_.jpg'
```

---

#### isFileSizeValid()

Kiểm tra file size.

```typescript
FileUtils.isFileSizeValid(1024 * 1024, 5); // true (1MB < 5MB)
FileUtils.isFileSizeValid(6 * 1024 * 1024, 5); // false (6MB > 5MB)
```

---

### Zod Schemas cho Files

#### ImageUploadSchema

```typescript
import { ImageUploadSchema } from '@/common';

const result = ImageUploadSchema.safeParse({
  filename: 'photo.jpg',
  mimetype: 'image/jpeg',
  size: 1024 * 1024, // 1MB
});
```

**Validation:**
- Max size: 5MB
- Allowed: jpg, jpeg, png, gif, webp

---

#### DocumentUploadSchema

```typescript
import { DocumentUploadSchema } from '@/common';

const result = DocumentUploadSchema.safeParse({
  filename: 'report.pdf',
  mimetype: 'application/pdf',
  size: 2 * 1024 * 1024, // 2MB
});
```

**Validation:**
- Max size: 10MB
- Allowed: pdf, doc, docx, xls, xlsx, txt

---

### Usage Example

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Validate file type
  if (!FileUtils.isValidImageType(file.mimetype)) {
    throw new BadRequestException('Only images are allowed');
  }

  // Validate file size (5MB)
  if (!FileUtils.isFileSizeValid(file.size, 5)) {
    throw new BadRequestException('File too large');
  }

  // Generate safe filename
  const filename = FileUtils.generateFileName(file.originalname);

  // Save file
  await this.fileService.save(file.buffer, filename);

  return {
    filename,
    size: FileUtils.formatFileSize(file.size),
    mimetype: file.mimetype,
  };
}
```

---

## Circuit Breaker

### CircuitBreaker Class

Circuit breaker pattern cho fault tolerance.

**States:**
- `CLOSED`: Normal operation
- `OPEN`: Failing, reject requests
- `HALF_OPEN`: Testing if service recovered

---

### Configuration

```typescript
import { CircuitBreaker } from '@/common';

const breaker = new CircuitBreaker('email-service', {
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes
  timeout: 60000,           // 60s timeout
  monitoringPeriod: 120000, // 2min monitoring
});
```

---

### Methods

#### execute()

Execute function với circuit breaker.

```typescript
try {
  const result = await breaker.execute(async () => {
    return await externalService.call();
  });
  console.log('Success:', result);
} catch (error) {
  if (error.name === 'CircuitBreakerOpenError') {
    console.log('Service unavailable');
  }
}
```

---

#### executeWithFallback()

Execute với fallback function.

```typescript
const result = await breaker.executeWithFallback(
  async () => {
    return await externalService.call();
  },
  async () => {
    // Fallback value
    return { data: 'cached-value' };
  }
);
```

---

#### getState()

Lấy current state.

```typescript
const state = breaker.getState();
// 'CLOSED' | 'OPEN' | 'HALF_OPEN'
```

---

#### getStats()

Lấy statistics.

```typescript
const stats = breaker.getStats();
console.log(stats);
// {
//   state: 'CLOSED',
//   failureCount: 2,
//   successCount: 10,
//   nextAttempt: null
// }
```

---

#### reset()

Reset circuit breaker về CLOSED.

```typescript
breaker.reset();
```

---

#### forceOpen()

Force mở circuit (manual intervention).

```typescript
breaker.forceOpen();
```

---

### Usage Example

```typescript
@Injectable()
export class EmailService {
  private breaker: CircuitBreaker;

  constructor() {
    this.breaker = new CircuitBreaker('email-service', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000,
      monitoringPeriod: 60000,
    });
  }

  async sendEmail(to: string, subject: string, body: string) {
    return await this.breaker.executeWithFallback(
      async () => {
        // Primary: Send via SMTP
        return await this.smtp.send({ to, subject, body });
      },
      async () => {
        // Fallback: Queue for later
        await this.queue.add({ to, subject, body });
        return { queued: true };
      }
    );
  }
}
```

---

## Environment Validation

### validateEnvironment()

Validate environment variables khi khởi động.

```typescript
import { validateEnvironment } from '@/common';

// In main.ts
async function bootstrap() {
  // Validate environment first
  validateEnvironment();

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
```

**Validates:**
- JWT_SECRET (required, min 32 chars)
- MONGODB_URI (required)
- NODE_ENV (optional, default: 'development')
- PORT (optional, default: 3000)
- And more...

**Behavior:**
- Throws error if required vars missing
- Sets default values for optional vars
- Logs warnings for invalid values

---

### getEnv()

Lấy environment variable với fallback.

```typescript
import { getEnv } from '@/common';

const jwtSecret = getEnv('JWT_SECRET');
// Throws error if not set

const frontendUrl = getEnv('FRONTEND_URL', 'http://localhost:5173');
// Uses default if not set
```

---

### getEnvNumber()

Lấy numeric environment variable.

```typescript
import { getEnvNumber } from '@/common';

const port = getEnvNumber('PORT', 3000);
// Validates and converts to number
```

---

### getEnvBoolean()

Lấy boolean environment variable.

```typescript
import { getEnvBoolean } from '@/common';

const enableCache = getEnvBoolean('ENABLE_CACHE', true);
// Converts 'true'/'false' strings to boolean
```

---

## Error Response Formatter

### ErrorResponseFormatter Class

#### createErrorResponse()

Tạo standardized error response.

```typescript
import { ErrorResponseFormatter } from '@/common';

const errorResponse = ErrorResponseFormatter.createErrorResponse(
  'NOT_FOUND',
  'User not found',
  request,
  { userId: '123' }
);
```

**Result:**
```typescript
{
  success: false,
  error: 'NOT_FOUND',
  message: 'User not found',
  details: { userId: '123' },
  timestamp: '2025-10-29 10:00:00',
  path: '/api/users/123',
  method: 'GET',
  requestId: 'req_123'
}
```

---

#### createValidationErrorResponse()

Tạo validation error response.

```typescript
const errors = [
  { field: 'email', message: 'Invalid email' },
  { field: 'password', message: 'Too short' }
];

const response = ErrorResponseFormatter.createValidationErrorResponse(
  'Validation failed',
  request,
  errors
);
```

---

#### createRateLimitErrorResponse()

Tạo rate limit error response.

```typescript
const response = ErrorResponseFormatter.createRateLimitErrorResponse(
  request,
  60 // Retry after 60 seconds
);
```

---

#### createTimeoutErrorResponse()

Tạo timeout error response.

```typescript
const response = ErrorResponseFormatter.createTimeoutErrorResponse(request);
```

---

#### createDatabaseErrorResponse()

Tạo database error response.

```typescript
const response = ErrorResponseFormatter.createDatabaseErrorResponse(
  'Database connection failed',
  request,
  { host: 'localhost', port: 27017 }
);
```

---

## Best Practices

### 1. Always Validate Input

```typescript
@Post()
async create(@Body() dto: CreateUserDto) {
  // Validate email
  const emailResult = ValidationUtils.validateEmail(dto.email);
  if (!emailResult.success) {
    throw new BadRequestException('Invalid email');
  }

  // Sanitize input
  const safeEmail = sanitizeEmail(dto.email);
  const safePhone = sanitizePhoneNumber(dto.phoneNumber);

  // Create user
  return await this.service.create({
    ...dto,
    email: safeEmail,
    phoneNumber: safePhone,
  });
}
```

---

### 2. Use Password Utils Properly

```typescript
@Post('register')
async register(@Body() dto: RegisterDto) {
  // Validate strength
  const strength = PasswordUtils.validatePasswordStrength(dto.password);
  if (!strength.isValid) {
    throw new BadRequestException({
      message: 'Password too weak',
      suggestions: strength.feedback,
    });
  }

  // Hash password
  const hashedPassword = await PasswordUtils.hashPassword(dto.password);

  return await this.service.create({
    ...dto,
    password: hashedPassword,
  });
}
```

---

### 3. Sanitize MongoDB Queries

```typescript
@Get('search')
async search(@Query('q') query: string) {
  // Create safe regex
  const regex = createSafeRegex(query, 'i');

  // Safe query
  const results = await this.model.find({
    name: regex,
  });

  return results;
}
```

---

### 4. Use Circuit Breaker for External Services

```typescript
@Injectable()
export class PaymentService {
  private breaker = new CircuitBreaker('payment-gateway', {
    failureThreshold: 5,
    timeout: 30000,
  });

  async processPayment(amount: number) {
    return await this.breaker.executeWithFallback(
      async () => {
        return await this.paymentGateway.charge(amount);
      },
      async () => {
        // Queue for later processing
        await this.queue.add({ amount, retry: true });
        return { status: 'queued' };
      }
    );
  }
}
```

---

### 5. Standardize Responses

```typescript
@Get()
async findAll(@Query() paginationDto: PaginationDto) {
  const { page, limit } = PaginationUtils.validatePaginationParams(
    paginationDto.page,
    paginationDto.limit
  );

  const [data, total] = await Promise.all([
    this.service.findAll(page, limit),
    this.service.count(),
  ]);

  return ResponseUtils.paginated(
    data,
    page,
    limit,
    total,
    'Data retrieved successfully'
  );
}
```

---

### 6. Handle Files Safely

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async upload(@UploadedFile() file: Express.Multer.File) {
  // Validate type
  if (!FileUtils.isValidImageType(file.mimetype)) {
    throw new BadRequestException('Invalid file type');
  }

  // Validate size
  if (!FileUtils.isFileSizeValid(file.size, 5)) {
    throw new BadRequestException('File too large (max 5MB)');
  }

  // Generate safe filename
  const filename = FileUtils.generateFileName(
    FileUtils.sanitizeFileName(file.originalname)
  );

  // Process file
  await this.fileService.save(file.buffer, filename);

  return {
    filename,
    size: FileUtils.formatFileSize(file.size),
  };
}
```

---

### 7. Validate Environment on Startup

```typescript
// main.ts
async function bootstrap() {
  // Validate all required env vars
  validateEnvironment();

  const config = {
    port: getEnvNumber('PORT', 3000),
    jwtSecret: getEnv('JWT_SECRET'),
    dbUri: getEnv('MONGODB_URI'),
  };

  const app = await NestFactory.create(AppModule);
  await app.listen(config.port);
}
```

---

## Tham khảo

- [Zod Documentation](https://zod.dev/)
- [class-validator](https://github.com/typestack/class-validator)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

