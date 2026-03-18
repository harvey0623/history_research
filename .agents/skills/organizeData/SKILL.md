---
name: 整理歷史資料
description: 整理歷史資料。當用戶說「歷史資料總結」時使用。
---

# 整理歷史資料

依照 `.agent/skills/createPageUi/assets/` 裡的圖片建立頁面 UI。
全程使用**中文**作回答。
只需製作紅色框框裡的內容就好。header不要做

---

## 執行流程

### Step 1：讀取參考圖片

使用 `view_file` 工具讀取 `.agent/skills/createPageUi/assets/` 資料夾內的所有圖片，仔細分析：

- 各元素的排版、間距、顏色
- 桌機版與手機版差異

### Step 2：分析專案設計系統

在撰寫任何程式碼前，先確認以下設計規範（已掌握可跳過）：

**Tailwind 自訂色值**（定義於 `assets/scss/tailwind.scss` `:root`）：
| 色彩分類 | 常用 class | 說明 |
|---------|-----------|------|
| `primary` | `text-primary`, `bg-primary`, `border-primary` | 主色 #0057a6，另有 600/400/300/200/100 深淺 |
| `danger` | `text-danger`, `bg-danger` | 危險/錯誤色 #ff5607，另有 200 |
| `success` | `text-success`, `bg-success` | 成功色 #4bbe16，另有 200 |
| `alert` | `text-alert`, `bg-alert` | 警告色 #ffb800，另有 200 |
| `neutral` | `text-neutral-800`, `bg-neutral-100` | 中性色灰階，有 800/600/400/200/100/50 |
| `ghost-*` | `bg-ghost-80`..`bg-ghost-10` | 白色透明分層 |
| `shadow-*` | `bg-shadow-80`..`bg-shadow-5` | 黑色透明分層 |

**Typography**（定義於 `tailwind.scss @layer base`）：

- `h1`：30px / bold / mb-5
- `h2`：28px / medium
- `h3`：24px / medium
- `h4`：18px / medium
- body：14px~16px / Noto Sans TC

**Box Shadow**：`shadow-base`（`0px 0px 12px 0px #0000001F`）

**自訂 Components class**（定義於 `assets/scss/modules/button.scss`）：

- `custom-btn-primary`、`custom-btn-secondary` 等按鈕樣式

**版型 utilities**：

- `webview-page-padding`：有標題列頁面的上下 padding
- `webview-page-padding-sm`：小標題列
- `webview-page-padding-hasTabs`：有標題列 + tabs
- `container`：置中容器（padding 1rem，2xl max-width 1280px）

### Step 3：確認可重用的既有元件

撰寫前先確認 `components/` 是否有可直接引用的元件，避免重複開發：

- `BaseButton/index.vue` — 按鈕（props: `type`, `icon`）
- `BaseTag/index.vue` — 標籤
- `PageTitle/index.vue` — 頁面標題
- `PillTabs/index.vue` — 分頁標籤
- `EmptyState/index.vue` — 空狀態顯示
- `ChevronLink/index.vue` — 帶箭頭連結
- `Loading/index.vue` — 載入中狀態
- `VantPopup/index.vue` — Popup 彈窗

### Step 4：建立 Vue 頁面檔案

**檔案位置**：`pages/` 底下的適當資料夾，或直接放在 `pages/`。
**檔案命名**：使用 prompt 中指定的名稱；若未指定，產生隨機 4 位數字當檔名（例如 `5732.vue`）。

**Vue 檔案基本架構**：

```vue
<template>
  <div class="container">
    <!-- 頁面內容 -->
  </div>
</template>

<script setup lang="ts">
// 僅放必要的靜態資料定義（ref、computed），不寫 API 呼叫或業務邏輯
</script>

<style scoped lang="scss"></style>
```

---

## 開發規範

### ✅ 必做事項

1. **RWD 響應式設計**
   - **640px 為分界點**：`sm:` prefix 以上為桌機版，640px 以下為手機版
   - 使用 Tailwind 響應式 prefix：`sm:`, `md:`, `lg:`, `xl:`, `2xl:`
   - 範例：`class="flex-col sm:flex-row"`、`class="w-full sm:w-1/2"`

2. **優先使用既有設計系統**
   - 色彩：只使用上方表格中定義的自訂色值 class（`text-primary`、`bg-neutral-100` 等）
   - 字級：使用 h1~h4 標籤利用全域 typography 或 Tailwind 的 `text-sm/base/lg/xl/2xl` 等
   - 陰影：使用 `shadow-base`
   - 按鈕：使用 `<BaseButton>` 元件或 `custom-btn-*` class

3. **語意化 HTML**：使用 `<header>`、`<main>`、`<section>`、`<article>`、`<aside>`、`<footer>` 等正確標籤

4. **Scoped 樣式**：若有特殊樣式無法用 Tailwind class 表達，寫在 `<style scoped lang="scss">` 內

### ❌ 禁止事項

1. **不寫任何 JavaScript 業務邏輯**：不寫 API 呼叫、資料處理、事件 handler
2. **不使用任意顏色**：不寫 `#xxx`、`rgb()`、不使用未在設計系統中定義的顏色
3. **不重複開發已有的元件**：先確認 `components/` 目錄
4. **不使用 inline style**（`style="..."` 屬性）：改用 Tailwind class 或 scoped style

---

## 互動式假資料

由於不寫 JS 邏輯，靜態假資料用 `ref` 定義在 `<script setup>` 中：

```ts
// 列表假資料
const list = ref([
  { id: 1, title: "項目一", status: "active" },
  { id: 2, title: "項目二", status: "inactive" },
]);
```

---

## 輸出確認清單

完成後請確認：

- [ ] 手機版（< 640px）與桌機版（≥ 640px）版型均正確
- [ ] 所有色彩均來自設計系統（`primary`、`neutral`、`danger` 等）
- [ ] 有使用既有的 `components/` 元件（不重複開發）
- [ ] 無任何 JavaScript 業務邏輯
- [ ] 有使用語意化 HTML 標籤
- [ ] `<script setup lang="ts">` 內只有靜態假資料定義
- [ ] 已告知用戶檔案建立位置
