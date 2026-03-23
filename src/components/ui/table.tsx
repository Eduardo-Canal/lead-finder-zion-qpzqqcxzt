import * as React from 'react'
import { ArrowUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { designTokens } from '@/constants/designTokens'

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, style, ...props }, ref) => {
    const wrapperStyles: React.CSSProperties = {
      borderRadius: designTokens.effects.borderRadius.lg,
      border: `1px solid ${designTokens.colors.neutral[200]}`,
      overflow: 'hidden',
      boxShadow: designTokens.effects.shadows.sm,
    }

    return (
      <div className="relative w-full overflow-auto" style={wrapperStyles}>
        <table
          ref={ref}
          className={cn('w-full caption-bottom text-sm', className)}
          style={{ fontFamily: designTokens.typography.fontFamily.sans, ...style }}
          {...props}
        />
      </div>
    )
  },
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, style, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('[&_tr]:border-b', className)}
    style={{
      backgroundColor: designTokens.colors.neutral[50],
      borderColor: designTokens.colors.neutral[200],
      ...style,
    }}
    {...props}
  />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, style, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t font-medium [&>tr]:last:border-b-0', className)}
    style={{
      backgroundColor: designTokens.colors.neutral[100],
      borderColor: designTokens.colors.neutral[200],
      color: designTokens.colors.neutral[700],
      ...style,
    }}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, style, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-neutral-50/50 data-[state=selected]:bg-neutral-100',
        className,
      )}
      style={{ borderColor: designTokens.colors.neutral[200], ...style }}
      {...props}
    />
  ),
)
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, style, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-semibold [&:has([role=checkbox])]:pr-0',
      className,
    )}
    style={{ color: designTokens.colors.neutral[700], ...style }}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableSortHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    isSorted?: boolean | 'asc' | 'desc'
    onSort?: () => void
  }
>(({ className, children, isSorted, onSort, style, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-semibold [&:has([role=checkbox])]:pr-0 cursor-pointer transition-colors',
      className,
    )}
    onClick={onSort}
    style={{ color: designTokens.colors.neutral[700], ...style }}
    {...props}
  >
    <div className="flex items-center gap-2 hover:text-neutral-900 group">
      {children}
      <ArrowUpDown
        className={cn(
          'h-3.5 w-3.5 transition-opacity',
          isSorted ? 'opacity-100 text-primary-500' : 'opacity-0 group-hover:opacity-50',
        )}
        style={isSorted ? { color: designTokens.colors.primary[500] } : {}}
      />
    </div>
  </th>
))
TableSortHead.displayName = 'TableSortHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, style, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    style={{ color: designTokens.colors.neutral[600], ...style }}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, style, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm', className)}
    style={{ color: designTokens.colors.neutral[500], ...style }}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableSortHead,
  TableRow,
  TableCell,
  TableCaption,
}
