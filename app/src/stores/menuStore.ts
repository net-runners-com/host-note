import { create } from 'zustand';
import { Menu, MenuFormData } from '../types/menu';
import { api } from '../utils/api';

interface MenuState {
  menuList: Menu[];
  loading: boolean;
  error: string | null;
  
  loadMenuList: () => Promise<void>;
  addMenu: (menu: MenuFormData) => Promise<void>;
  updateMenu: (id: number, menu: Partial<MenuFormData>) => Promise<void>;
  deleteMenu: (id: number) => Promise<void>;
  bulkCreateMenus: (menus: MenuFormData[]) => Promise<void>;
  getMenusByCategory: () => Record<string, Menu[]>;
  getCategories: () => string[];
}

export const useMenuStore = create<MenuState>((set, get) => ({
  menuList: [],
  loading: false,
  error: null,

  loadMenuList: async () => {
    set({ loading: true, error: null });
    try {
      const menuList = await api.menu.list();
      console.log('[MenuStore] Loaded menus:', menuList.length);
      set({ menuList, loading: false });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('[MenuStore] Failed to load menus:', errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },

  addMenu: async (menu) => {
    set({ loading: true, error: null });
    try {
      await api.menu.create(menu);
      await get().loadMenuList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateMenu: async (id, menu) => {
    set({ loading: true, error: null });
    try {
      await api.menu.update(id, menu);
      await get().loadMenuList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteMenu: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.menu.delete(id);
      await get().loadMenuList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  bulkCreateMenus: async (menus) => {
    set({ loading: true, error: null });
    try {
      await api.menu.bulkCreate(menus);
      await get().loadMenuList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  getMenusByCategory: () => {
    const { menuList } = get();
    const menusByCategory: Record<string, Menu[]> = {};
    
    menuList.forEach((menu) => {
      if (!menusByCategory[menu.category]) {
        menusByCategory[menu.category] = [];
      }
      menusByCategory[menu.category].push(menu);
    });
    
    return menusByCategory;
  },

  getCategories: () => {
    const { menuList } = get();
    const categories = new Set<string>();
    menuList.forEach((menu) => {
      categories.add(menu.category);
    });
    return Array.from(categories).sort();
  },
}));

