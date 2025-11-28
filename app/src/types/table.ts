import { Hime } from './hime';
import { Cast } from './cast';

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface SalesInfo {
  tableCharge: number; // テーブルチャージ
  orderItems: OrderItem[]; // 注文アイテム
  visitType: 'normal' | 'first' | 'shimei'; // 来店区分
  stayHours: number; // 滞在時間
  shimeiFee: number; // 指名料
  subtotal: number; // 小計
  taxRate: number; // 税率（%）
  tax: number; // 消費税
  total: number; // 合計
}

export interface TableRecord {
  id?: number;
  datetime: string;
  tableNumber: string | null;
  memo: string | null;
  salesInfo: SalesInfo | null; // 売上情報
  createdAt: string;
  updatedAt: string;
}

export interface TableRecordWithDetails extends TableRecord {
  himeList: Hime[];
  mainCast: Cast | null;
  helpCasts: Cast[];
}

export interface TableHime {
  id?: number;
  tableId: number;
  himeId: number;
}

export interface TableCast {
  id?: number;
  tableId: number;
  castId: number;
  role: 'main' | 'help';
}

export interface TableFormData {
  datetime: string;
  tableNumber?: string;
  himeIds: number[];
  mainCastId: number;
  helpCastIds: number[];
  memo?: string;
  salesInfo?: SalesInfo;
}

