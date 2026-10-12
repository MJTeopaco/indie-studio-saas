import React, { useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './table';
import { Skeleton } from './skeleton';
import { Inbox } from 'lucide-react';

export function DataTable({
    columns,
    data = [],
    isLoading = false,
    emptyMessage = 'No records found',
    className = '',
}) {
    const [sorting, setSorting] = useState([]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className={`overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-xs ${className}`}>
            <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-b border-slate-200/80 dark:border-slate-800/80">
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, idx) => (
                            <TableRow key={`skeleton-${idx}`} className="border-b border-slate-100 dark:border-slate-800/50">
                                {columns.map((_, colIdx) => (
                                    <TableCell key={`col-${colIdx}`} className="py-3.5 px-4">
                                        <Skeleton className="h-4 w-full max-w-[120px] rounded-md" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && 'selected'}
                                className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="py-3 px-4 text-xs font-medium text-slate-700 dark:text-slate-200">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-28 text-center">
                                <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-slate-500">
                                    <Inbox className="h-6 w-6 stroke-1" />
                                    <span className="text-xs font-medium">{emptyMessage}</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export default DataTable;
