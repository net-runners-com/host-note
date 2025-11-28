export interface VisitRecord {
  id?: number;
  himeId: number;
  visitDate: string; // ISO 8601 date
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VisitRecordWithHime extends VisitRecord {
  hime: {
    id: number;
    name: string;
    photoUrl: string | null;
  };
}

export interface VisitFormData {
  himeId: number;
  visitDate: string;
  memo?: string;
}


