"use client"

import DataTable from '@/components/chatbot/DataTable'

const sampleData = [
  {
    id: '1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    department: 'Engineering',
    cgpa: 9.2,
    status: 'Active',
    start_date: '2025-06-01',
  },
  {
    id: '2',
    name: 'Sneha Patel',
    email: 'sneha.patel@example.com',
    department: 'Design',
    cgpa: 8.5,
    status: 'Active',
    start_date: '2025-06-01',
  },
  {
    id: '3',
    name: 'Karan Desai',
    email: 'karan.desai@example.com',
    department: 'Engineering',
    cgpa: 7.8,
    status: 'Active',
    start_date: '2025-05-01',
  },
  {
    id: '4',
    name: 'Meera Shah',
    email: 'meera.shah@example.com',
    department: 'Marketing',
    cgpa: 9.5,
    status: 'Completed',
    start_date: '2025-01-01',
  },
  {
    id: '5',
    name: 'Arjun Trivedi',
    email: 'arjun.trivedi@example.com',
    department: 'HR',
    cgpa: 8.1,
    status: 'Active',
    start_date: '2025-07-01',
  },
]

export default function DataTableDemo() {
  return (
    <div className="space-y-12 bg-neutral-50 p-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">DataTable Component Showcase</h1>
        <p className="mt-2 text-neutral-600">Modern SaaS-style table component with advanced features</p>
      </div>

      {/* Basic Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Basic Table</h2>
          <p className="text-sm text-neutral-600">Simple data table with automatic column detection and sorting</p>
        </div>
        <div className="bg-white p-6">
          <DataTable data={sampleData} title="Interns Directory" showSearch={true} pageSize={5} />
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Key Features</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: 'Dynamic Columns',
              description: 'Auto-generates columns from JSON data or accepts custom column config',
            },
            {
              title: 'Sorting',
              description: 'Click column headers to sort by that column (ascending/descending)',
            },
            {
              title: 'Search & Filter',
              description: 'Built-in search functionality across searchable columns',
            },
            {
              title: 'Pagination',
              description: 'Configurable page size with navigation controls',
            },
            {
              title: 'Type Formatting',
              description: 'Automatically detects and formats numbers, dates, booleans, and arrays',
            },
            {
              title: 'Responsive Design',
              description: 'Works perfectly on mobile, tablet, and desktop screens',
            },
            {
              title: 'Zebra Striping',
              description: 'Alternating row colors for improved readability',
            },
            {
              title: 'Hover Effects',
              description: 'Interactive row highlighting with smooth transitions',
            },
            {
              title: 'Export Data',
              description: 'Download filtered/sorted data as CSV file',
            },
            {
              title: 'Empty State',
              description: 'Graceful handling of empty datasets with custom messages',
            },
            {
              title: 'Row Clicks',
              description: 'Callback function for handling row interaction',
            },
            {
              title: 'Clean UI',
              description: 'Minimal borders, professional spacing, and typography',
            },
          ].map((feature, idx) => (
            <div key={idx} className="rounded-lg border border-neutral-200 bg-white p-4">
              <h3 className="font-semibold text-neutral-900">{feature.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Example */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Usage Example</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-300 bg-neutral-900 p-4">
          <pre className="text-xs text-neutral-100">
{`import DataTable from '@/components/chatbot/DataTable'

export default function MyComponent() {
  const data = [
    { name: 'John', department: 'Engineering', cgpa: 8.5 },
    { name: 'Jane', department: 'Design', cgpa: 9.2 },
  ]

  return (
    <DataTable
      data={data}
      columns={['name', 'department', 'cgpa']}
      title="Team Members"
      showSearch={true}
      showPagination={true}
      pageSize={10}
      searchableColumns={['name', 'department']}
      onRowClick={(row) => console.log('Clicked:', row)}
      emptyMessage="No team members found"
    />
  )
}`}
          </pre>
        </div>
      </div>

      {/* Props Reference */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Props Reference</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-neutral-900">Prop</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-900">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-900">Default</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-900">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {[
                ['data', 'array[]', '[]', 'Array of objects to display'],
                ['columns', 'string[]', '[]', 'Column names to display (auto-detect if empty)'],
                ['title', 'string', 'null', 'Optional table title'],
                ['showSearch', 'boolean', 'true', 'Show search input'],
                ['showPagination', 'boolean', 'true', 'Show pagination controls'],
                ['pageSize', 'number', '10', 'Items per page'],
                ['searchableColumns', 'string[]', 'null', 'Columns to include in search'],
                ['onRowClick', 'function', 'null', 'Callback when row is clicked'],
                ['emptyMessage', 'string', 'No data available', 'Message for empty state'],
                ['className', 'string', "''", 'Additional CSS classes'],
              ].map(([prop, type, defaultVal, desc], idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{prop}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">{type}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">{defaultVal}</td>
                  <td className="px-4 py-3 text-neutral-700">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
