import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { ResponsiveContainer } from 'recharts';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { BarChart3 } from 'lucide-react';

export const ChartContainer = ({ 
  title, 
  subtitle, 
  loading, 
  empty, 
  height = 300, 
  children 
}) => {
  return (
    <Card>
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {loading ? (
          <div style={{ height }} className="flex items-center justify-center">
            <LoadingState message="Loading chart data..." />
          </div>
        ) : empty ? (
          <div style={{ height }} className="flex items-center justify-center">
            <EmptyState icon={BarChart3} title="No data available" description="There is no data to display for this chart." />
          </div>
        ) : (
          <div style={{ height }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
