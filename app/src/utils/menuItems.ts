export interface MenuItem {
  name: string;
  price: number;
  category: string;
}

export const MENU_ITEMS: MenuItem[] = [
  // ボトル系（5000円）
  { name: '鏡月', price: 5000, category: 'ボトル系' },
  { name: 'Japan', price: 5000, category: 'ボトル系' },
  { name: '吉四六', price: 5000, category: 'ボトル系' },
  { name: 'Jinro', price: 5000, category: 'ボトル系' },
  
  // 缶もの（二缶一セット 20000円）
  { name: '氷結 レモン', price: 20000, category: '缶もの' },
  { name: '氷結 グレープフルーツ', price: 20000, category: '缶もの' },
  { name: '淡麗 グリーン', price: 20000, category: '缶もの' },
  { name: '淡麗 ブルー', price: 20000, category: '缶もの' },
  { name: 'ほろよい グレープ', price: 20000, category: '缶もの' },
  { name: 'ほろよい カルピス', price: 20000, category: '缶もの' },
  { name: 'リアルゴールド', price: 20000, category: '缶もの' },
  
  // 割物（1000円）
  { name: '水', price: 0, category: '割物' },
  { name: 'ウーロン茶', price: 1000, category: '割物' },
  { name: '緑茶', price: 1000, category: '割物' },
  { name: '午後の紅茶 ミルクティー', price: 1000, category: '割物' },
  { name: '午後の紅茶 レモンティー', price: 1000, category: '割物' },
  { name: 'ジャスミン茶', price: 1000, category: '割物' },
  
  // フード系 1000円
  { name: '乾き物', price: 1000, category: 'フード系' },
  { name: 'だし巻き卵', price: 1000, category: 'フード系' },
  { name: '味噌汁2杯', price: 1000, category: 'フード系' },
  { name: '若鶏レバー250g', price: 1000, category: 'フード系' },
  { name: '白レバー250g', price: 1000, category: 'フード系' },
  { name: '手羽もと5本', price: 1000, category: 'フード系' },
  { name: '馬刺し赤身50g', price: 1000, category: 'フード系' },
  { name: '焼きそば135g', price: 1000, category: 'フード系' },
  { name: '焼きうどん200g', price: 1000, category: 'フード系' },
  { name: '枝豆200g', price: 1000, category: 'フード系' },
  { name: 'ポップコーン', price: 1000, category: 'フード系' },
  { name: 'モツ煮310g', price: 1000, category: 'フード系' },
  { name: '鳥のたたき(親)100g', price: 1000, category: 'フード系' },
  { name: '鳥のたたき150g', price: 1000, category: 'フード系' },
  { name: '砂ずり(バジル)150g', price: 1000, category: 'フード系' },
  { name: '米×2', price: 1000, category: 'フード系' },
  { name: 'うどん×4', price: 1000, category: 'フード系' },
  
  // フード系 2000円
  { name: 'ペンネ100g', price: 2000, category: 'フード系' },
  { name: '米 200g', price: 2000, category: 'フード系' },
  { name: 'うどん各種200g', price: 2000, category: 'フード系' },
  { name: 'パスタ100g', price: 2000, category: 'フード系' },
  { name: 'フライドポテト300g', price: 2000, category: 'フード系' },
  { name: '鰹のタタキ約200g', price: 2000, category: 'フード系' },
  { name: '手羽元10本', price: 2000, category: 'フード系' },
  
  // フード系 3000円
  { name: 'オムライス', price: 3000, category: 'フード系' },
  { name: '鰹のタタキ約280g', price: 3000, category: 'フード系' },
  
  // フード系 200円（焼き鳥各種）
  { name: '焼き鳥 とりもも', price: 200, category: 'フード系' },
  { name: '焼き鳥 ねぎま', price: 200, category: 'フード系' },
  { name: '焼き鳥 鶏皮', price: 200, category: 'フード系' },
  
  // その他
  { name: '場内', price: 1000, category: 'その他' },
  { name: '飲み放題プラン 男女ペア(2名様) 1時間', price: 10000, category: 'その他' },
  { name: '飲み放題プラン 男女ペア(2名様) 延長', price: 5000, category: 'その他' },
  { name: '飲み放題プラン 男性おひとり様', price: 8000, category: 'その他' },
  { name: '初回料金', price: 0, category: 'その他' },
  { name: '再訪プラン（初回料金+再訪料金）', price: 5000, category: 'その他' },
];

export const CATEGORIES = ['ボトル系', '缶もの', '割物', 'フード系', 'その他'];

