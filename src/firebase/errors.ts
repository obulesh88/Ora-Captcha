
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  constructor(public context: SecurityRuleContext) {
    const { path, operation } = context;
    const message = `Firestore - Insufficient permissions. The following ${operation} operation was denied on ${path}.`;
    super(message);
    this.name = 'FirestorePermissionError';
  }
}
