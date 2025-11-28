export interface Menu {
  id: number;
  userId: number;
  name: string;
  price: number;
  category: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuFormData {
  name: string;
  price: number;
  category: string;
  order?: number;
}

