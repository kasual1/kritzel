export interface IDocument {
  id: string;
  name: string | null;
  isPublic: boolean;
  type: string;
  userId: string | null;
  updatedAt: string;
}