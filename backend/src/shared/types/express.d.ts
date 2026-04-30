// Type extension để Express Request có req.user sau khi authenticate middleware chạy
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        walletAddress: string;
        role: 'USER' | 'ADMIN';
      };
    }
  }
}

export {};
