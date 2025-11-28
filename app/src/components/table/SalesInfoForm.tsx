import React, { useEffect } from "react";
import { SalesInfo, OrderItem } from "../../types/table";
import { useMenuStore } from "../../stores/menuStore";
import { useOptionStore } from "../../stores/optionStore";

interface SalesInfoFormProps {
  salesInfo: SalesInfo | null;
  onChange: (salesInfo: SalesInfo) => void;
}

export const SalesInfoForm: React.FC<SalesInfoFormProps> = ({
  salesInfo,
  onChange,
}) => {
  const { menuList, loadMenuList, getMenusByCategory, getCategories } =
    useMenuStore();
  const { visitTypeOptions, loadOptions } = useOptionStore();
  const categories = getCategories();
  const menusByCategory = getMenusByCategory();

  useEffect(() => {
    if (menuList.length === 0) {
      loadMenuList();
    }
    loadOptions();
  }, [menuList.length, loadMenuList, loadOptions]);

  const [localSalesInfo, setLocalSalesInfo] = React.useState<SalesInfo>(
    salesInfo || {
      tableCharge: 0,
      orderItems: [],
      visitType: "normal",
      stayHours: 2,
      shimeiFee: 0,
      subtotal: 0,
      taxRate: 10,
      tax: 0,
      total: 0,
    }
  );

  React.useEffect(() => {
    const tableCharge = localSalesInfo.stayHours * 1000;
    const itemsTotal = localSalesInfo.orderItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const subtotal = tableCharge + itemsTotal;
    const shimeiFee = localSalesInfo.visitType === "shimei" ? 2000 : 0;
    const totalBeforeTax = subtotal + shimeiFee;
    const tax = Math.round(totalBeforeTax * (localSalesInfo.taxRate / 100));
    const total = totalBeforeTax + tax;

    const updated = {
      ...localSalesInfo,
      tableCharge,
      subtotal,
      shimeiFee,
      tax,
      total,
    };

    if (
      updated.tableCharge !== localSalesInfo.tableCharge ||
      updated.subtotal !== localSalesInfo.subtotal ||
      updated.shimeiFee !== localSalesInfo.shimeiFee ||
      updated.tax !== localSalesInfo.tax ||
      updated.total !== localSalesInfo.total
    ) {
      setLocalSalesInfo(updated);
      onChange(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    localSalesInfo.stayHours,
    JSON.stringify(localSalesInfo.orderItems),
    localSalesInfo.visitType,
    localSalesInfo.taxRate,
  ]);

  const addOrderItem = () => {
    const firstItem = menuList[0];
    if (!firstItem) return;
    const newItem: OrderItem = {
      name: firstItem.name,
      quantity: 1,
      unitPrice: firstItem.price,
      amount: firstItem.price,
    };
    setLocalSalesInfo({
      ...localSalesInfo,
      orderItems: [...localSalesInfo.orderItems, newItem],
    });
  };

  const removeOrderItem = (index: number) => {
    setLocalSalesInfo({
      ...localSalesInfo,
      orderItems: localSalesInfo.orderItems.filter((_, i) => i !== index),
    });
  };

  const updateOrderItem = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const updated = [...localSalesInfo.orderItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    if (field === "quantity" || field === "unitPrice") {
      updated[index].amount =
        updated[index].quantity * updated[index].unitPrice;
    }
    setLocalSalesInfo({
      ...localSalesInfo,
      orderItems: updated,
    });
  };

  const changeQuantity = (index: number, delta: number) => {
    const newQty = Math.max(
      0,
      localSalesInfo.orderItems[index].quantity + delta
    );
    updateOrderItem(index, "quantity", newQty);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">売上情報</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">来店区分</label>
          <select
            value={localSalesInfo.visitType}
            onChange={(e) =>
              setLocalSalesInfo({
                ...localSalesInfo,
                visitType: e.target.value as "normal" | "first" | "shimei",
              })
            }
            className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            {visitTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            滞在時間（時間）
          </label>
          <input
            type="number"
            value={localSalesInfo.stayHours}
            onChange={(e) =>
              setLocalSalesInfo({
                ...localSalesInfo,
                stayHours: parseInt(e.target.value) || 0,
              })
            }
            min="1"
            className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">注文内容</label>
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 text-sm font-semibold border-b border-[var(--color-border)] pb-2">
            <div>品名</div>
            <div>数量</div>
            <div>単価</div>
            <div>金額</div>
            <div></div>
          </div>
          {localSalesInfo.orderItems.map((item, index) => (
            <div key={index} className="grid grid-cols-5 gap-2 items-center">
              <select
                value={item.name}
                onChange={(e) => {
                  const selected = menuList.find(
                    (i) => i.name === e.target.value
                  );
                  if (selected) {
                    updateOrderItem(index, "name", selected.name);
                    updateOrderItem(index, "unitPrice", selected.price);
                  }
                }}
                className="px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-text)] text-sm"
              >
                {categories.map((category) => {
                  const categoryItems = menusByCategory[category] || [];
                  if (categoryItems.length === 0) return null;
                  return (
                    <optgroup key={category} label={category}>
                      {categoryItems.map((menuItem) => (
                        <option key={menuItem.id} value={menuItem.name}>
                          {menuItem.name} ({menuItem.price.toLocaleString()}円)
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => changeQuantity(index, -1)}
                  className="w-6 h-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm hover:bg-[var(--color-border)]"
                >
                  −
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => changeQuantity(index, 1)}
                  className="w-6 h-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm hover:bg-[var(--color-border)]"
                >
                  ＋
                </button>
              </div>
              <input
                type="number"
                value={item.unitPrice}
                onChange={(e) =>
                  updateOrderItem(
                    index,
                    "unitPrice",
                    parseInt(e.target.value) || 0
                  )
                }
                className="px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-text)] text-sm"
              />
              <div className="text-sm">{item.amount.toLocaleString()}円</div>
              <button
                type="button"
                onClick={() => removeOrderItem(index)}
                className="text-[var(--color-error)] hover:opacity-80"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOrderItem}
            className="w-full px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] text-sm"
          >
            ＋ 行を追加
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] pt-4 space-y-4">
        {/* 小計セクション */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">
            小計
          </h4>
          <div className="flex justify-between">
            <span>テーブルチャージ:</span>
            <span>{localSalesInfo.tableCharge.toLocaleString()}円</span>
          </div>
          <div className="flex justify-between">
            <span>注文内容合計:</span>
            <span>
              {localSalesInfo.orderItems
                .reduce((sum, item) => sum + item.amount, 0)
                .toLocaleString()}
              円
            </span>
          </div>
          <div className="flex justify-between font-semibold border-t border-[var(--color-border)] pt-2">
            <span>小計:</span>
            <span>{localSalesInfo.subtotal.toLocaleString()}円</span>
          </div>
        </div>

        {/* 総売上セクション */}
        <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
          <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">
            総売上
          </h4>
          <div className="flex justify-between">
            <span>小計:</span>
            <span>{localSalesInfo.subtotal.toLocaleString()}円</span>
          </div>
          <div className="flex justify-between">
            <span>指名料:</span>
            <span>{localSalesInfo.shimeiFee.toLocaleString()}円</span>
          </div>
          <div className="flex justify-between items-center">
            <span>
              TAX(
              <input
                type="number"
                value={localSalesInfo.taxRate}
                onChange={(e) =>
                  setLocalSalesInfo({
                    ...localSalesInfo,
                    taxRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-12 text-center border-b border-[var(--color-border)] outline-none bg-transparent"
              />
              %):
            </span>
            <span>{localSalesInfo.tax.toLocaleString()}円</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-[var(--color-border)] pt-2">
            <span>合計:</span>
            <span>{localSalesInfo.total.toLocaleString()}円</span>
          </div>
        </div>
      </div>
    </div>
  );
};
