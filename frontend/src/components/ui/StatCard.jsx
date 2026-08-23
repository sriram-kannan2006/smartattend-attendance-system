import React from 'react';
import { Card, CardContent } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StatCard = ({ icon: Icon, label, value, trend, trendValue, variant = 'primary' }) => {
  const variants = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    error: 'bg-error-100 text-error-600',
    info: 'bg-info-100 text-info-600',
  };

  const trendIcon = {
    up: <TrendingUp className="h-4 w-4 text-success-600 mr-1" />,
    down: <TrendingDown className="h-4 w-4 text-error-600 mr-1" />,
    neutral: <Minus className="h-4 w-4 text-secondary-500 mr-1" />
  };

  const trendColor = {
    up: 'text-success-600',
    down: 'text-error-600',
    neutral: 'text-secondary-500'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-500 truncate">{label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-secondary-900">{value}</p>
              {trend && trendValue && (
                <div className="flex items-center text-sm">
                  {trendIcon[trend]}
                  <span className={trendColor[trend]}>{trendValue}</span>
                </div>
              )}
            </div>
          </div>
          <div className={cn("inline-flex items-center justify-center p-3 rounded-lg ml-4", variants[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
