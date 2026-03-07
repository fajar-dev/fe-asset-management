import 'reflect-metadata';
import { Transform, plainToClass } from 'class-transformer';
import { IsDate, IsString, validateSync } from 'class-validator';

class DTO {
  @IsDate()
  @Transform(({ value }) => new Date(value))
  assignedAt: Date;

  @IsString()
  @Transform(({ value }) => String(value))
  employeeId: string;
}

const body = Object.create(null);
body.assignedAt = "2026-03-10";
body.employeeId = "0201011";

const dto = plainToClass(DTO, body);
console.log("Transformed:", dto);
console.log("Validation:", validateSync(dto));
