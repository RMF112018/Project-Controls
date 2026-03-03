import { AuditAction, EntityType } from './enums';

export interface IAuditEntry {
  id: number;
  Timestamp: string;
  User: string;
  UserId?: number;
  Action: AuditAction;
  EntityType: EntityType;
  EntityId: string;
  ProjectCode?: string;
  FieldChanged?: string;
  PreviousValue?: string;
  NewValue?: string;
  Details: string;
}
