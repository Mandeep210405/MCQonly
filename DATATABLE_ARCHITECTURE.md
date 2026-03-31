# DataTable Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ChatbotWidget                            │
│  (/components/chatbot/ChatbotWidget.jsx)                         │
│                                                                  │
│  • Handles user input and messaging                             │
│  • Sends questions to backend API                               │
│  • Receives SQL results                                          │
│  • Filters hidden columns                                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ passes data & columns
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DataTable Component                         │
│  (/components/chatbot/DataTable.jsx)                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Input Processing                                         │  │
│  │ • Auto-detect columns from JSON                          │  │
│  │ • Filter hidden columns                                  │  │
│  │ • Validate data structure                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Data Processing Pipeline                                 │  │
│  │                                                           │  │
│  │  Raw Data                                                │  │
│  │     │                                                     │  │
│  │     ▼                                                     │  │
│  │  [Search Filter] ─────────────────────┐                  │  │
│  │     │                                  │                  │  │
│  │     ▼                                  │                  │  │
│  │  [Sort] ──────────────────────────┐   │                  │  │
│  │     │                             │   │                  │  │
│  │     ▼                             │   │                  │  │
│  │  [Paginate] ──────────────────┐  │   │                  │  │
│  │     │                         │  │   │                  │  │
│  │     ▼                         │  │   │                  │  │
│  │  Render Results              │  │   │                  │  │
│  │                              │  │   │                  │  │
│  │  States: filteredData, sortedData, paginatedData        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Rendering Components                                     │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ Header Section (optional)                       │    │  │
│  │  │ • Title                                          │    │  │
│  │  │ • Search Input (with Lucide icon)               │    │  │
│  │  │ • Export Button                                  │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ Table Section                                   │    │  │
│  │  │ ┌───────────────────────────────────────────┐  │    │  │
│  │  │ │ THEAD (Sticky)                            │  │    │  │
│  │  │ │ • Column headers (clickable for sort)     │  │    │  │
│  │  │ │ • Sort indicators (chevrons)              │  │    │  │
│  │  │ │ • Gradient background                     │  │    │  │
│  │  │ └───────────────────────────────────────────┘  │    │  │
│  │  │ ┌───────────────────────────────────────────┐  │    │  │
│  │  │ │ TBODY (Scrollable)                        │  │    │  │
│  │  │ │ • Rows with formatted data                │  │    │  │
│  │  │ │ • Zebra striping (alternate colors)       │  │    │  │
│  │  │ │ • Hover effects                           │  │    │  │
│  │  │ │ • Empty state message (if no data)        │  │    │  │
│  │  │ └───────────────────────────────────────────┘  │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ Pagination Section (optional)                  │    │  │
│  │  │ • Results info (showing X-Y of Z)             │    │  │
│  │  │ • Previous/Next buttons                        │    │  │
│  │  │ • Page number buttons                          │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ Search Results Info (optional)                 │    │  │
│  │  │ • "Found X results for Y"                      │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Query
    │
    ▼
ChatbotWidget
    │
    ├─ Sends question to backend
    │
    ▼
Backend (FastAPI + Vanna)
    │
    ├─ Generates SQL
    ├─ Executes query
    │
    ▼
Backend Response
    {
      "sql": "SELECT ...",
      "results": [{...}, {...}],
      "columns": ["name", "email", "department"]
    }
    │
    ▼
ChatbotWidget Receives
    │
    ├─ Filters hidden columns
    │
    ▼
DataTable Receives
    ├─ data: results array
    ├─ columns: visible column names
    │
    ▼
DataTable Processing
    ├─ Detects column types
    ├─ Auto-selects searchable columns
    │
    ▼
DataTable Renders
    ├─ Header (title, search, export)
    ├─ Table (headers, rows, pagination)
    ├─ Footer (pagination controls)
    │
    ▼
User Sees Beautiful Table ✨
```

## Component Hierarchy

```
ChatbotWidget (Main container)
├── Messages Container
│   └── Message (For each chat message)
│       └── Message Bubble
│           ├── Message text
│           ├── SQL details (collapsible)
│           └── DataTable Component ◄─── NEW
│               ├── Header Section
│               │   ├── Title
│               │   ├── Search Input
│               │   └── Export Button
│               ├── Table
│               │   ├── TableHead
│               │   │   └── TR > TH (columns with sort indicators)
│               │   └── TableBody
│               │       └── TR > TD (rows with formatted data)
│               ├── Pagination Section
│               │   ├── Info text
│               │   └── Pagination buttons
│               └── Search Results Info
├── Input Section
│   ├── Textarea
│   └── Send Button
└── Error Display
```

## State Management

```
DataTable Component States:
├── searchTerm (string)
│   └─ Updates: onChange search input
│   └─ Effect: Re-filters data
│
├── currentPage (number)
│   └─ Updates: onClick pagination button
│   └─ Effect: Re-slices paginated data
│
└── sortConfig (object: { key, direction })
    └─ Updates: onClick column header
    └─ Effect: Re-sorts sorted data
```

## Memoization Optimization

```
useMemo Hooks (Prevent unnecessary re-renders):
├── displayColumns
│   └─ Dependencies: [data, columns]
│   └─ Caches: Auto-detected or provided columns
│
├── searchColumns
│   └─ Dependencies: [displayColumns, data, searchableColumns]
│   └─ Caches: Which columns to search in
│
├── filteredData
│   └─ Dependencies: [data, searchTerm, searchColumns]
│   └─ Caches: Filtered search results
│
├── sortedData
│   └─ Dependencies: [filteredData, sortConfig]
│   └─ Caches: Sorted results
│
└── paginatedData
    └─ Dependencies: [sortedData, currentPage, pageSize, showPagination]
    └─ Caches: Page slice of data
```

## Class Styling Architecture (TailwindCSS)

```
DataTable Styling:
├── Root Container
│   └─ Flexbox column layout, gap spacing
│
├── Header Section
│   ├── Title: Large, bold, neutral text
│   ├── Controls Row: Flexbox, responsive
│   └── Search Input: Rounded, bordered, focus styling
│
├── Table Wrapper
│   └─ Overflow-x-auto (responsive scrolling)
│
├── Table Element
│   ├── Width: 100%, border-collapse
│   ├── Font-size: 13px, line-height: 1.5
│   └─ Background: White with subtle shadows
│
├── Table Head
│   ├── Background: Gradient (neutral-50 → white)
│   ├── Position: Sticky top (scrollable header)
│   ├── Borders: Bottom border (2px, blue-ish)
│   └─ Text: Bold, uppercase, blue accent color
│
├── Table Body
│   ├── Row backgrounds: Alternate (white / neutral-50)
│   ├── Hover: Blue-tinted background
│   ├── Transition: 200ms smooth
│   └─ Borders: Minimal (bottom only)
│
├── Table Cells (TH, TD)
│   ├── Padding: 12px 14px (comfortable spacing)
│   ├── Text: Left-aligned, word-wrap
│   └─ Numbers: Right-aligned, monospace font
│
└── Pagination Section
    ├── Info text: Small, neutral color
    ├── Buttons: Rounded, bordered style
    └─ Active: Blue background, white text
```

## Feature Completeness Matrix

| Feature               | Implementation                            | Status |
| --------------------- | ----------------------------------------- | ------ |
| Column Auto-detection | `displayColumns` useMemo                  | ✅     |
| Custom Columns        | `columns` prop                            | ✅     |
| Search/Filter         | `filteredData` useMemo                    | ✅     |
| Sorting               | `sortedData` useMemo                      | ✅     |
| Pagination            | `paginatedData` useMemo                   | ✅     |
| Type Formatting       | `formatCellValue` function                | ✅     |
| Responsive            | TailwindCSS breakpoints (@media)          | ✅     |
| Zebra Striping        | `nth-child(odd)` styling                  | ✅     |
| Hover Effects         | `:hover` class & transitions              | ✅     |
| Sticky Headers        | `position: sticky`                        | ✅     |
| CSV Export            | `handleExport` function                   | ✅     |
| Empty State           | Conditional rendering                     | ✅     |
| Row Clicks            | `onRowClick` callback                     | ✅     |
| Icons                 | Lucide React (Search, Download, Chevrons) | ✅     |
| Accessibility         | Semantic HTML, ARIA labels                | ✅     |

---

**Architecture Status**: ✅ Complete and Production-Ready
**Last Updated**: March 30, 2026
