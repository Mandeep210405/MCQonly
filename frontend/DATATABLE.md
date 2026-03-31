# DataTable Component Documentation

A modern, production-ready SaaS-style table component built with React and TailwindCSS. Perfect for displaying dynamic data with a professional, polished UI similar to Notion, Airtable, and other modern platforms.

## Features

✨ **Core Features:**

- **Dynamic Column Generation**: Automatically detects columns from JSON data or accepts custom configuration
- **Sorting**: Click headers to sort ascending/descending with visual indicators
- **Search & Filter**: Built-in search across configurable columns
- **Pagination**: Customizable page sizes with navigation controls
- **Responsive Design**: Mobile-first design with smart breakpoints
- **Type Formatting**: Auto-formats numbers, dates, booleans, and arrays
- **Zebra Striping**: Alternating row colors for improved readability
- **Hover Effects**: Interactive row highlighting with smooth transitions
- **Export to CSV**: Download filtered/sorted data
- **Empty State**: Graceful handling of empty datasets
- **Row Click Handlers**: Handle row interactions with callback functions
- **Clean UI**: Minimal borders, professional spacing, excellent typography

## Installation

The DataTable component is already included in your chatbot project. Import it from:

```jsx
import DataTable from "@/components/chatbot/DataTable";
```

## Basic Usage

### Simple Table

```jsx
import DataTable from "@/components/chatbot/DataTable";

export default function MyComponent() {
  const data = [
    { name: "John Doe", department: "Engineering", cgpa: 8.5 },
    { name: "Jane Smith", department: "Design", cgpa: 9.2 },
  ];

  return <DataTable data={data} />;
}
```

### With Title and Search

```jsx
<DataTable
  data={interns}
  title="Active Interns"
  showSearch={true}
  searchableColumns={["name", "department", "email"]}
/>
```

### With Pagination

```jsx
<DataTable data={largeDataset} showPagination={true} pageSize={25} />
```

### With Row Click Handler

```jsx
<DataTable
  data={interns}
  onRowClick={(row) => {
    console.log("Selected intern:", row);
    // Open details modal, navigate, etc.
  }}
/>
```

## Props Reference

### `data` (required)

- **Type**: `array[]`
- **Default**: `[]`
- **Description**: Array of objects to display in the table
- **Example**: `[{ name: 'John', age: 25 }, ...]`

### `columns`

- **Type**: `string[]`
- **Default**: `[]`
- **Description**: Specific columns to display. If empty, auto-detects from first row's keys, excluding hidden columns (id, user_id, created_at, etc.)
- **Example**: `['name', 'email', 'department', 'cgpa']`

### `title`

- **Type**: `string | null`
- **Default**: `null`
- **Description**: Optional title displayed above the table
- **Example**: `"Employee Directory"`

### `showSearch`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Show/hide the search input field
- **Example**: `showSearch={false}`

### `showPagination`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Show/hide pagination controls. Auto-disabled if data fits in one page
- **Example**: `showPagination={false}`

### `pageSize`

- **Type**: `number`
- **Default**: `10`
- **Description**: Number of rows per page
- **Example**: `pageSize={25}`

### `searchableColumns`

- **Type**: `string[] | null`
- **Default**: `null`
- **Description**: Specific columns to search in. If null, auto-detects string/number columns
- **Example**: `searchableColumns={['name', 'email']}`

### `onRowClick`

- **Type**: `function | null`
- **Default**: `null`
- **Description**: Callback function triggered when a row is clicked
- **Example**: `onRowClick={(row) => handleSelectRow(row)}`

### `emptyMessage`

- **Type**: `string`
- **Default**: `"No data available"`
- **Description**: Message displayed when there's no data or search returns empty
- **Example**: `emptyMessage="No employees found"`

### `className`

- **Type**: `string`
- **Default**: `""`
- **Description**: Additional TailwindCSS classes to apply to the root container
- **Example**: `className="max-w-4xl"`

## Advanced Examples

### Chatbot Integration (Current Implementation)

```jsx
<DataTable
  data={chatbotResults}
  columns={queryColumns}
  showSearch={false}
  showPagination={chatbotResults.length > 10}
  pageSize={10}
  emptyMessage="No query results"
/>
```

### With Custom Empty State

```jsx
<DataTable
  data={interns}
  emptyMessage="No interns found. Try adjusting your filters."
/>
```

### Filtering and Exporting

The component includes built-in export functionality. Click the "Export" button to download filtered/sorted data as CSV.

### Mobile Responsive

The table automatically adapts to mobile screens:

- **Desktop**: Full table with all columns visible
- **Mobile**: Card-like layout with labels before values and horizontal scroll

## Styling & Customization

### Using Custom CSS Classes

```jsx
<DataTable data={data} className="max-w-5xl mx-auto shadow-lg rounded-xl" />
```

### Colors & Theme

The component uses Tailwind's neutral color palette by default. To customize:

1. Edit the component's className values
2. Use TailwindCSS extend config
3. Wrap with a custom CSS context

Example colors used:

- Headers: `bg-gradient-to-b from-neutral-50 to-white`
- Rows (odd): `bg-neutral-50`
- Hover: `bg-blue-50`
- Text: `text-neutral-900`, `text-neutral-600`, `text-blue-600`

## Data Type Handling

The component automatically detects and formats:

| Type               | Format                   | Example              |
| ------------------ | ------------------------ | -------------------- |
| **String**         | Text as-is               | "John Doe"           |
| **Number**         | Right-aligned, monospace | `9.2`                |
| **Boolean**        | "Yes" / "No"             | Yes                  |
| **Array**          | Comma-separated          | "Python, React, SQL" |
| **Date**           | YYYY-MM-DD format        | Centered aligned     |
| **Null/Undefined** | Em dash                  | —                    |
| **Object**         | JSON stringified         | `{...}`              |

## Sorting & Filtering

### Sorting

- Click any column header to sort
- Visual indicators show sort direction (⬆️ ascending, ⬇️ descending)
- Works with strings, numbers, and dates

### Searching

- Type in the search box (top-right)
- Searches across specified columns
- Real-time results
- Case-insensitive
- Returns result count

## Performance Considerations

- **Large Datasets**: Use pagination (recommended for 50+ rows)
- **Search Performance**: Acceptable up to 10,000 rows
- **Rendering**: React memoization prevents unnecessary re-renders
- **Memory**: Efficiently handles large arrays

## Accessibility

- Semantic HTML (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`)
- Keyboard navigable
- ARIA labels on icons
- Proper heading hierarchy
- Good color contrast ratios

## Hidden Columns

By default, these columns are automatically hidden:

- `id`
- `user_id`
- `intern_id`
- `department_id`
- `mentor_id`
- `assigned_by`
- `created_at`
- `updated_at`

Override with the `columns` prop to display them.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Common Use Cases

### Display API Results

```jsx
const [results, setResults] = useState([]);

useEffect(() => {
  fetch("/api/interns")
    .then((r) => r.json())
    .then((data) => setResults(data));
}, []);

return <DataTable data={results} title="Interns" />;
```

### Chatbot Query Results (Current)

```jsx
<DataTable
  data={chatbotResponse.results}
  columns={chatbotResponse.columns}
  showSearch={false}
  pageSize={10}
/>
```

### Admin Dashboard

```jsx
<DataTable
  data={employees}
  title="Team Directory"
  showSearch={true}
  showPagination={true}
  pageSize={20}
  onRowClick={(employee) => openEmployeeModal(employee)}
/>
```

### Reports & Analytics

```jsx
<DataTable
  data={reportData}
  searchableColumns={["date", "department", "status"]}
  pageSize={50}
/>
```

## Troubleshooting

### Columns Not Showing

- Check if column names are in the `HIDDEN_COLUMNS` set
- Provide explicit `columns` prop if needed
- Verify data structure (should be array of objects)

### Search Not Working

- Ensure `showSearch={true}`
- Check `searchableColumns` config
- Only string/number fields are searchable

### Mobile Layout Issues

- Component auto-adapts; check viewport meta tags
- Test with Chrome DevTools mobile emulation
- Clear browser cache if styles don't update

## Best Practices

1. **Use Pagination**: For datasets > 50 rows, enable pagination
2. **Meaningful Columns**: Hide redundant IDs; show user-friendly data
3. **Clear Title**: Always provide a descriptive table title
4. **Error Handling**: Handle empty states gracefully
5. **Performance**: Avoid passing millions of rows; use API pagination
6. **Accessibility**: Test with keyboard navigation and screen readers

## Examples in Project

- **ChatbotWidget**: `/components/chatbot/ChatbotWidget.jsx`
- **Demo**: `/app/(protected)/datatable-demo/page.jsx`
- **Component**: `/components/chatbot/DataTable.jsx`

## Updates & Maintenance

The DataTable component is built with React hooks and maintained independently. Updates won't affect other components. To update:

1. Modify `/components/chatbot/DataTable.jsx`
2. Test in the demo page
3. Verify integration in ChatbotWidget
4. Deploy with your changes

---

**Last Updated**: March 30, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
