"use client"

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react'

export default function DataTable({
  data = [],
  columns = [],
  title = null,
  showSearch = true,
  showPagination = true,
  pageSize = 10,
  searchableColumns = null,
  onRowClick = null,
  emptyMessage = 'No data available',
  className = '',
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  // Auto-generate columns from first row if not provided
  const displayColumns = useMemo(() => {
    if (columns.length > 0) return columns
    if (data.length === 0) return []
    return Object.keys(data[0]).filter(
      (key) => !['id', 'user_id', 'intern_id', 'department_id', 'mentor_id', 'assigned_by', 'created_at', 'updated_at', 'password', 'password_hash', 'api_key', 'secret', 'token'].includes(key),
    )
  }, [data, columns])

  // Search functionality
  const searchColumns = useMemo(() => {
    if (searchableColumns) return searchableColumns
    return displayColumns.filter((col) => typeof data[0]?.[col] === 'string' || typeof data[0]?.[col] === 'number')
  }, [displayColumns, data, searchableColumns])

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data

    return data.filter((row) =>
      searchColumns.some((col) => String(row[col] || '').toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [data, searchTerm, searchColumns])

  // Sorting functionality
  const sortedData = useMemo(() => {
    let sorted = [...filteredData]

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]

        if (aVal == null) return 1
        if (bVal == null) return -1

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
        }

        const strA = String(aVal).toLowerCase()
        const strB = String(bVal).toLowerCase()

        if (sortConfig.direction === 'asc') {
          return strA.localeCompare(strB)
        }
        return strB.localeCompare(strA)
      })
    }

    return sorted
  }, [filteredData, sortConfig])

  // Pagination
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData
    const startIdx = (currentPage - 1) * pageSize
    return sortedData.slice(startIdx, startIdx + pageSize)
  }, [sortedData, currentPage, pageSize, showPagination])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  // Handle column sort
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  // Format cell value
  const formatCellValue = (value) => {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  // Determine cell type for styling
  const getCellType = (value) => {
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (String(value).match(/^\d{4}-\d{2}-\d{2}/)) return 'date'
    return 'text'
  }

  // Export data as CSV
  const handleExport = () => {
    const headers = displayColumns.join(',')
    const rows = sortedData
      .map((row) =>
        displayColumns
          .map((col) => {
            const value = String(row[col] || '')
            return value.includes(',') ? `"${value}"` : value
          })
          .join(','),
      )
      .join('\n')

    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-${Date.now()}.csv`
    a.click()
  }

  if (displayColumns.length === 0) {
    return (
      <div className={`rounded-lg border border-neutral-200 bg-white p-8 text-center ${className}`}>
        <p className="text-sm text-neutral-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header Section */}
      {(title || showSearch) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {title && <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {showSearch && searchColumns.length > 0 && (
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm placeholder-neutral-400 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {sortedData.length > 0 && (
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-neutral-200 bg-gradient-to-b from-neutral-50 to-white">
              {displayColumns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="cursor-pointer select-none px-4 py-3.5 text-left text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{col.replace(/_/g, ' ')}</span>
                    {sortConfig.key === col && (
                      <span className="text-blue-600">
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-neutral-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={`${rowIdx}-${JSON.stringify(row)}`}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${
                    rowIdx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'
                  } ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-neutral-50'}`}
                >
                  {displayColumns.map((col) => {
                    const value = row[col]
                    const cellType = getCellType(value)

                    return (
                      <td key={`${col}-${rowIdx}`} className="px-4 py-3.5 text-sm text-neutral-900">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`truncate break-words font-medium ${
                              cellType === 'number' ? 'text-right font-mono' : ''
                            }`}
                            title={formatCellValue(value)}
                          >
                            {formatCellValue(value)}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={displayColumns.length} className="px-4 py-8 text-center text-sm text-neutral-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-600">
            Showing <span className="font-medium">{Math.min((currentPage - 1) * pageSize + 1, sortedData.length)}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * pageSize, sortedData.length)}</span> of{' '}
            <span className="font-medium">{sortedData.length}</span> results
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors disabled:bg-neutral-50 disabled:text-neutral-400 hover:enabled:bg-neutral-50"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === p
                        ? 'bg-blue-600 text-white'
                        : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors disabled:bg-neutral-50 disabled:text-neutral-400 hover:enabled:bg-neutral-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Results Info */}
      {searchTerm && (
        <p className="text-xs text-neutral-500">
          Found {sortedData.length} result{sortedData.length !== 1 ? 's' : ''} for &#34;{searchTerm}&quot;
        </p>
      )}
    </div>
  )
}
