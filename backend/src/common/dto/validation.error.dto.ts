export class ValidationErrorDto {
  field: string;
  message: string;
  value?: any;

  constructor(field: string, message: string, value?: any) {
    this.field = field;
    this.message = message;
    this.value = value;
  }
}
