import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { useHimeStore } from "../../stores/himeStore";
import { useCastStore } from "../../stores/castStore";
import { useMenuStore } from "../../stores/menuStore";
import { useOptionStore } from "../../stores/optionStore";
import { OrderItem, SalesInfo } from "../../types/table";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { logError } from "../../utils/errorHandler";

export default function ReceiptPage() {
  const navigate = useNavigate();
  const { loadHimeList } = useHimeStore();
  const { loadCastList } = useCastStore();
  const { menuList, loadMenuList, getMenusByCategory, getCategories } =
    useMenuStore();
  const { visitTypeOptions, loadOptions } = useOptionStore();
  const categories = getCategories();
  const menusByCategory = getMenusByCategory();

  const [visitType, setVisitType] = useState<"normal" | "first" | "shimei">(
    "normal"
  );
  const [stayHours, setStayHours] = useState(2);
  const [taxRate, setTaxRate] = useState(10);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    loadHimeList();
    loadCastList();
    if (menuList.length === 0) {
      loadMenuList();
    }
    loadOptions();
  }, [loadHimeList, loadCastList, menuList.length, loadMenuList, loadOptions]);

  const calculateTotal = (): SalesInfo => {
    const tableCharge = stayHours * 1000;
    const itemsTotal = orderItems.reduce((sum, item) => sum + item.amount, 0);
    const subtotal = tableCharge + itemsTotal;
    const shimeiFee = visitType === "shimei" ? 2000 : 0;
    const totalBeforeTax = subtotal + shimeiFee;
    const tax = Math.round(totalBeforeTax * (taxRate / 100));
    const total = totalBeforeTax + tax;

    return {
      tableCharge,
      orderItems,
      visitType,
      stayHours,
      shimeiFee,
      subtotal,
      taxRate,
      tax,
      total,
    };
  };

  const salesInfo = calculateTotal();

  const addOrderItem = () => {
    const firstItem = menuList[0];
    if (!firstItem) return;
    setOrderItems([
      ...orderItems,
      {
        name: firstItem.name,
        quantity: 1,
        unitPrice: firstItem.price,
        amount: firstItem.price,
      },
    ]);
  };

  const updateOrderItem = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const updated = [...orderItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    if (field === "quantity" || field === "unitPrice") {
      updated[index].amount =
        updated[index].quantity * updated[index].unitPrice;
    }
    setOrderItems(updated);
  };

  const changeQuantity = (index: number, delta: number) => {
    const newQty = Math.max(0, orderItems[index].quantity + delta);
    updateOrderItem(index, "quantity", newQty);
  };

  const downloadPDF = async () => {
    // 伝票スタイルのHTMLを生成
    const receiptHTML = `
      <div style="background: white; color: black; padding: 20px; font-family: 'MS Gothic', 'Courier New', monospace; font-size: 12px; line-height: 1.6; max-width: 80mm; margin: 0 auto;">
        <!-- ヘッダー -->
        <div style="text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid black;">
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px;">お会計票</div>
          <div style="font-size: 12px;">
            ${format(new Date(), "yyyy年MM月dd日 HH:mm", { locale: ja })}
          </div>
        </div>

        <!-- 来店情報 -->
        <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #999;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>来店区分:</span>
            <span style="font-weight: bold;">
              ${visitTypeOptions.find((opt) => opt.value === visitType)?.label || visitType}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>滞在時間:</span>
            <span style="font-weight: bold;">${stayHours}時間</span>
          </div>
        </div>

        <!-- 注文内容 -->
        <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #999;">
          <div style="text-align: center; font-weight: bold; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #ccc;">
            注文内容
          </div>
          ${orderItems.length === 0
            ? '<div style="text-align: center; color: #666; padding: 16px 0;">注文がありません</div>'
            : orderItems
                .map(
                  (item) => `
            <div style="display: flex; justify-content: space-between; align-items: start; font-size: 11px; margin-bottom: 4px;">
              <div style="flex: 1;">
                <div style="font-weight: bold;">${item.name}</div>
                <div style="color: #666;">
                  ${item.quantity} × ${item.unitPrice.toLocaleString()}円
                </div>
              </div>
              <div style="text-align: right; font-weight: bold; margin-left: 16px;">
                ${item.amount.toLocaleString()}円
              </div>
            </div>
          `
                )
                .join("")}
        </div>

        <!-- 小計 -->
        <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #999;">
          <div style="text-align: center; font-weight: bold; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #ccc;">
            小計
          </div>
          <div style="font-size: 11px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>テーブルチャージ:</span>
              <span style="font-weight: bold;">
                ${salesInfo.tableCharge.toLocaleString()}円
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>注文内容合計:</span>
              <span style="font-weight: bold;">
                ${orderItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}円
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; border-top: 1px solid #ccc; padding-top: 4px; margin-top: 4px;">
              <span>小計:</span>
              <span>${salesInfo.subtotal.toLocaleString()}円</span>
            </div>
          </div>
        </div>

        <!-- 総売上 -->
        <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid black;">
          <div style="text-align: center; font-weight: bold; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #ccc;">
            総売上
          </div>
          <div style="font-size: 11px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>小計:</span>
              <span style="font-weight: bold;">
                ${salesInfo.subtotal.toLocaleString()}円
              </span>
            </div>
            ${salesInfo.shimeiFee > 0
              ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>指名料:</span>
              <span style="font-weight: bold;">
                ${salesInfo.shimeiFee.toLocaleString()}円
              </span>
            </div>
            `
              : ""}
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>TAX(${taxRate}%):</span>
              <span style="font-weight: bold;">
                ${salesInfo.tax.toLocaleString()}円
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 2px solid black; padding-top: 8px; margin-top: 8px;">
              <span>合計:</span>
              <span style="font-size: 20px;">${salesInfo.total.toLocaleString()}円</span>
            </div>
          </div>
        </div>

        <!-- フッター -->
        <div style="text-align: center; font-size: 11px; color: #666; margin-top: 16px; padding-top: 12px; border-top: 1px solid #ccc;">
          <div>ありがとうございました</div>
          <div style="margin-top: 4px;">
            ${format(new Date(), "yyyy/MM/dd HH:mm", { locale: ja })}
          </div>
        </div>
      </div>
    `;

    // 一時的なコンテナに追加（画面外に配置）
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "fixed";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.width = "80mm";
    tempContainer.style.maxWidth = "80mm";
    tempContainer.style.backgroundColor = "#ffffff";
    tempContainer.innerHTML = receiptHTML;
    document.body.appendChild(tempContainer);

    const clone = tempContainer.firstElementChild as HTMLElement;

    // 一時的なコンテナに追加（画面外に配置）
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "fixed";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.width = "80mm"; // 伝票サイズ（80mm幅）
    tempContainer.style.maxWidth = "80mm";
    tempContainer.style.backgroundColor = "#ffffff";
    tempContainer.style.color = "#000000";
    tempContainer.style.fontFamily = "'MS Gothic', 'Courier New', monospace";
    tempContainer.style.fontSize = "12px";
    tempContainer.style.lineHeight = "1.6";
    tempContainer.style.padding = "20px";
    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);

    try {
      // 少し待ってからキャプチャ（レンダリング完了を待つ）
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(clone, {
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        scale: 2, // 解像度を上げる
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      } as any);

      // 一時コンテナを削除
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL("image/png", 1.0);
      // 伝票サイズ（80mm幅）でPDFを作成
      const receiptWidth = 80; // mm

      // A4縦向きで作成（必要に応じて複数ページに分割）
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // 中央に配置
      const xOffset = (pageWidth - receiptWidth) / 2;
      const imgHeight = (canvas.height * receiptWidth) / canvas.width;

      // ページに収まるように調整
      if (imgHeight > pageHeight - 20) {
        // 複数ページに分割
        let yOffset = 10;
        let remainingHeight = imgHeight;
        let sourceY = 0;
        const pageHeightAvailable = pageHeight - 20;

        while (remainingHeight > 0) {
          const heightToAdd = Math.min(remainingHeight, pageHeightAvailable);
          const sourceHeight = (heightToAdd * canvas.height) / imgHeight;

          // キャンバスから部分的な画像を取得
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCtx.drawImage(
              canvas,
              0,
              (sourceY * canvas.height) / imgHeight,
              canvas.width,
              sourceHeight,
              0,
              0,
              canvas.width,
              sourceHeight
            );
            const pageImgData = tempCanvas.toDataURL("image/png", 1.0);
            pdf.addImage(
              pageImgData,
              "PNG",
              xOffset,
              yOffset,
              receiptWidth,
              heightToAdd
            );
          }

          remainingHeight -= heightToAdd;
          sourceY += heightToAdd;

          if (remainingHeight > 0) {
            pdf.addPage();
            yOffset = 10;
          }
        }
      } else {
        pdf.addImage(imgData, "PNG", xOffset, 10, receiptWidth, imgHeight);
      }

      pdf.save(`receipt-${format(new Date(), "yyyyMMdd-HHmmss")}.pdf`);
    } catch (error) {
      // エラー時も一時コンテナを削除
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      logError(error, { component: "ReceiptPage", action: "generatePDF" });
      alert("PDFの生成に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => navigate("/tools")}>
          ← 戻る
        </Button>
        <h1 className="text-2xl font-bold">お会計票</h1>
        <div></div>
      </div>

      <Card className="flex-1 overflow-auto">
        <div id="receiptArea" className="space-y-6">
          <h3 className="text-lg font-semibold">売上情報</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">来店区分</label>
              <select
                value={visitType}
                onChange={(e) =>
                  setVisitType(e.target.value as typeof visitType)
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
                value={stayHours}
                onChange={(e) => setStayHours(parseInt(e.target.value) || 0)}
                min="1"
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium mb-2">注文内容</label>
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 md:gap-4 text-sm font-semibold border-b border-[var(--color-border)] pb-2">
                <div>品名</div>
                <div className="text-center">数量</div>
                <div className="text-right">単価</div>
                <div className="text-right">金額</div>
              </div>
              {orderItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-2 md:gap-4 items-center"
                >
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
                    className="px-2 md:px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-text)] text-sm"
                  >
                    {categories.map((category) => {
                      const categoryItems = menusByCategory[category] || [];
                      if (categoryItems.length === 0) return null;
                      return (
                        <optgroup key={category} label={category}>
                          {categoryItems.map((menuItem) => (
                            <option key={menuItem.id} value={menuItem.name}>
                              {menuItem.name} ({menuItem.price.toLocaleString()}
                              円)
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeQuantity(index, -1)}
                      className="w-8 h-8 md:w-10 md:h-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm hover:bg-[var(--color-border)] touch-manipulation"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(index, 1)}
                      className="w-8 h-8 md:w-10 md:h-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm hover:bg-[var(--color-border)] touch-manipulation"
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
                    className="px-2 md:px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-text)] text-sm text-right"
                  />
                  <div className="text-sm text-right font-medium">
                    {item.amount.toLocaleString()}円
                  </div>
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

          <div className="border-t border-[var(--color-border)] pt-6 space-y-6">
            {/* 小計セクション */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-[var(--color-text-secondary)]">
                小計
              </h4>
              <div className="flex justify-between text-base">
                <span>テーブルチャージ:</span>
                <span className="font-medium">
                  {salesInfo.tableCharge.toLocaleString()}円
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span>注文内容合計:</span>
                <span className="font-medium">
                  {orderItems
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString()}
                  円
                </span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t border-[var(--color-border)] pt-3">
                <span>小計:</span>
                <span>{salesInfo.subtotal.toLocaleString()}円</span>
              </div>
            </div>

            {/* 総売上セクション */}
            <div className="space-y-3 border-t border-[var(--color-border)] pt-6">
              <h4 className="text-base font-semibold text-[var(--color-text-secondary)]">
                総売上
              </h4>
              <div className="flex justify-between text-base">
                <span>小計:</span>
                <span className="font-medium">
                  {salesInfo.subtotal.toLocaleString()}円
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span>指名料:</span>
                <span className="font-medium">
                  {salesInfo.shimeiFee.toLocaleString()}円
                </span>
              </div>
              <div className="flex justify-between items-center text-base">
                <span>
                  TAX(
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) =>
                      setTaxRate(parseFloat(e.target.value) || 0)
                    }
                    className="w-14 text-center border-b border-[var(--color-border)] outline-none bg-transparent font-medium"
                  />
                  %):
                </span>
                <span className="font-medium">
                  {salesInfo.tax.toLocaleString()}円
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t-2 border-[var(--color-border)] pt-4">
                <span>合計:</span>
                <span className="text-[var(--color-primary)]">
                  {salesInfo.total.toLocaleString()}円
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={downloadPDF} className="w-full">
            📄 PDF出力
          </Button>
        </div>
      </Card>
    </div>
  );
}
