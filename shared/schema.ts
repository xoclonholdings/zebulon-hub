export interface User {
  id: number;
  username: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertUser {
  username: string;
  passwordHash: string;
  role?: string;
}
