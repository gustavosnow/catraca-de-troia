export interface AuditActorSummary {
  id: string;
  name: string;
}

export interface AuditLogRecord {
  id: string;
  actor: AuditActorSummary;
  aggregateType: string;
  aggregateId: string;
  action: string;
  occurredAt: string;
}
