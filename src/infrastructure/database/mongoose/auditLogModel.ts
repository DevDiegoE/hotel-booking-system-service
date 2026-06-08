import { Schema, model, Document } from 'mongoose';

export interface AuditLogDocument extends Document {
    actorId: string;
    actorRole?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: Record<string, unknown>;
    createdAt?: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
    {
        actorId: { type: String, required: true },
        actorRole: { type: String },
        action: { type: String, required: true },
        entityType: { type: String, required: true },
        entityId: { type: String },
        details: { type: Schema.Types.Mixed },
    },
    { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLogModel = model<AuditLogDocument>('AuditLog', auditLogSchema);
