export interface SnsAccount {
  url?: string;
  username?: string;
}

export interface SnsInfo {
  twitter?: SnsAccount;
  instagram?: SnsAccount;
  line?: SnsAccount;
}

export interface Memo {
  id: string;
  content: string;
  createdAt: string;
}

