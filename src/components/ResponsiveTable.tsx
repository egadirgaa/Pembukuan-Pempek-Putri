import { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card } from './ui/card';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => ReactNode;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (item: any) => void;
}

export function ResponsiveTable({ columns, data, onRowClick }: ResponsiveTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => (
                <TableRow
                  key={item.id || idx}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(item[column.key], item) : item[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">Tidak ada data</p>
          </Card>
        ) : (
          data.map((item, idx) => (
            <Card
              key={item.id || idx}
              className={`p-4 ${onRowClick ? 'cursor-pointer active:bg-accent' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              <div className="space-y-2">
                {columns
                  .filter((col) => !col.hideOnMobile)
                  .map((column) => (
                    <div key={column.key} className="flex justify-between items-start gap-2">
                      <span className="text-sm text-muted-foreground min-w-[100px]">{column.label}:</span>
                      <span className="text-right flex-1">
                        {column.render ? column.render(item[column.key], item) : item[column.key]}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
