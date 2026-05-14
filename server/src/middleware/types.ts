export interface AuthContext {
  userId: string;
  role: 'USER' | 'ADMIN';
  sessionId?: string;
  deviceId?: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      requestId?: string;
    }
  }
}
