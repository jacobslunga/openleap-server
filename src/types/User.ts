export type User = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  password: string;
  email: string;
  isPremium: boolean;
  imageUrl?: string;
  authProvider: string;
  createdAt: Date;
  updatedAt: Date;
};
