// src/audit-logs/decorators/audit.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const AUDIT_METADATA = 'audit_metadata';

export interface AuditOptions {
  action?: string;
  collection?: string;
  description?: string;
  skip?: boolean;
}

export const Audit = (options: AuditOptions = {}) => {
  return SetMetadata(AUDIT_METADATA, options);
};