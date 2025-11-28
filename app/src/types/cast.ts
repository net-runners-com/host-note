import { SnsInfo, Memo } from "./common";

export interface Cast {
  id?: number;
  name: string;
  userId?: number | null;
  photoUrl: string | null; // アイコン写真
  photos: string[]; // 写真の配列（Base64 or Blob URL）
  snsInfo: SnsInfo | null;
  birthday: string | null;
  age: number | null; // 年齢
  champagneCallSong: string | null; // シャンパンコールの歌
  drinkPreference: string | null; // お酒の濃さ: 超薄め、薄め、普通、濃いめ、超濃いめ
  favoriteDrinkId: number | null; // 好きなお酒（商品メニューID）
  ice: string | null; // 氷: 1個、2~3個、満タン
  carbonation: string | null; // 炭酸: OK、NG
  favoriteMixerId: number | null; // 好きな割物（商品メニューID）
  smokes: boolean | null; // タバコを吸うか
  tobaccoType: string | null; // タバコの種類: 紙タバコ、アイコス、両方
  memos: Memo[]; // メモの配列
  createdAt: string;
  updatedAt: string;
}

export interface CastFormData {
  name: string;
  photo?: File | null; // アイコン写真
  photos?: File[]; // 写真の配列
  snsInfo?: SnsInfo;
  birthday?: string;
  age?: number;
  champagneCallSong?: string; // シャンパンコールの歌
  drinkPreference?: string;
  favoriteDrinkId?: number;
  ice?: string;
  carbonation?: string;
  favoriteMixerId?: number;
  smokes?: boolean;
  tobaccoType?: string;
  memo?: string;
}
