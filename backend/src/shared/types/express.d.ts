// Ambient declaration — KHÔNG có export/import để giữ file ở script context.
// Nếu file có export/import, TypeScript treat nó là module và declare global
// sẽ không có tác dụng trừ khi file được import tường minh ở đâu đó.
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      walletAddress: string;
      role: 'USER' | 'ADMIN';
    };
  }
}
