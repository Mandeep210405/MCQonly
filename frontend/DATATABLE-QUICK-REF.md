# DataTable Component - Quick Reference

## 📦 Import

```jsx
import DataTable from "@/components/chatbot/DataTable";
```

## 🚀 Quick Start (30 seconds)

```jsx
<DataTable data={yourArray} />
```

## 📋 Essential Props

| Prop             | Type       | Default     | Notes                           |
| ---------------- | ---------- | ----------- | ------------------------------- |
| `data`           | `array[]`  | `[]`        | **Required** - Array of objects |
| `columns`        | `string[]` | Auto-detect | Column names to show            |
| `title`          | `string`   | null        | Table title                     |
| `showSearch`     | `bool`     | true        | Search input visibility         |
| `showPagination` | `bool`     | true        | Pagination controls             |
| `pageSize`       | `number`   | 10          | Rows per page                   |

## 🎯 Common Examples

### Basic with Title

```jsx
<DataTable data={data} title="My Table" />
```

### No Search, Just Results

```jsx
<DataTable data={results} showSearch={false} />
```

### Large Dataset

```jsx
<DataTable data={thousands} pageSize={50} />
```

### With Click Handler

```jsx
<DataTable data={items} onRowClick={(row) => console.log(row)} />
```

### Chatbot Results (Standard)

```jsx
<DataTable
  data={msg.results}
  columns={msg.columns}
  showSearch={false}
  pageSize={10}
/>
```

## ✨ Features

- ✅ Auto column detection
- ✅ Sorting (click headers)
- ✅ Search/filter
- ✅ Pagination
- ✅ Responsive (mobile-friendly)
- ✅ Type formatting
- ✅ Export to CSV
- ✅ Hover effects
- ✅ Empty state handling
- ✅ Row click callbacks

## 🎨 Styling

```jsx
<DataTable data={data} className="max-w-4xl shadow-lg" />
```

## 📱 Mobile

- Auto-adapts to small screens
- Card layout on mobile
- Horizontal scroll for wide tables
- Touch-friendly buttons

## 🔍 Search Tips

- Search is case-insensitive
- Searches specified columns only
- Real-time filtering
- Shows result count

## 📊 Sorting

- Click column header to sort
- Click again to reverse direction
- Arrow indicator (⬆️ ⬇️) shows active sort

## 🚫 Hidden Columns

These are auto-hidden (show with `columns` prop):

- `id`, `*_id` (foreign keys)
- `created_at`, `updated_at`

## 📥 Export

- Click "Export" button
- Downloads CSV file
- Includes filtered/sorted data

## 🐛 Troubleshooting

| Issue                | Solution                        |
| -------------------- | ------------------------------- |
| Columns missing      | Provide explicit `columns` prop |
| Search not working   | Set `showSearch={true}`         |
| Slow performance     | Add `pageSize` pagination       |
| Mobile layout broken | Check viewport meta tag         |

## 📚 Full Docs

See `DATATABLE.md` for complete documentation

## 🔗 Related Files

- Component: `/components/chatbot/DataTable.jsx`
- Demo: `/app/(protected)/datatable-demo/page.jsx`
- Chatbot: `/components/chatbot/ChatbotWidget.jsx`
- Docs: `/DATATABLE.md`

---

**Last Updated**: March 30, 2026
