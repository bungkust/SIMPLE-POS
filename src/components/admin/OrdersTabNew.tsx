import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedTable } from '@/components/ui/advanced-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormSelect, SelectItem } from '@/components/forms/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Filter, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Download, 
  Printer, 
  MessageCircle, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Eye,
  Edit,
  Calendar,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/form-utils';
import { orderStatusUpdateSchema, type OrderStatusUpdateData } from '@/lib/form-schemas';
import { useAuth } from '@/contexts/AuthContext';
import { ColumnDef } from '@tanstack/react-table';
import { Database } from '@/lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export function OrdersTab() {
  const { currentTenant } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<OrderStatusUpdateData>({
    resolver: zodResolver(orderStatusUpdateSchema),
    defaultValues: {
      status: 'BELUM BAYAR',
      notes: ''
    }
  });

  const status = watch('status');

  useEffect(() => {
    if (currentTenant) {
      loadOrders();
    }
  }, [currentTenant]);

  const loadOrders = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('OrdersTab: Starting to load orders...');
    }
    try {
      if (!currentTenant?.id) {
        setOrders([]);
        setOrderItems([]);
        setLoading(false);
        return;
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('OrdersTab: Error loading orders:', ordersError);
        setOrders([]);
        setOrderItems([]);
        setLoading(false);
        return;
      }

      setOrders(ordersData || []);

      // Load order items
      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map(order => order.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (itemsError) {
          console.error('OrdersTab: Error loading order items:', itemsError);
        } else {
          setOrderItems(itemsData || []);
        }
      }

    } catch (error) {
      console.error('OrdersTab: Unexpected error:', error);
      setOrders([]);
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getOrderItems = (orderId: string) => {
    return orderItems.filter(item => item.order_id === orderId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BELUM BAYAR': return 'warning';
      case 'SUDAH BAYAR': return 'info';
      case 'SEDANG DISIAPKAN': return 'processing';
      case 'SIAP DIAMBIL': return 'success';
      case 'SELESAI': return 'success';
      case 'DIBATALKAN': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'BELUM BAYAR': return <Clock className="h-4 w-4" />;
      case 'SUDAH BAYAR': return <CheckCircle className="h-4 w-4" />;
      case 'SEDANG DISIAPKAN': return <AlertCircle className="h-4 w-4" />;
      case 'SIAP DIAMBIL': return <CheckCircle className="h-4 w-4" />;
      case 'SELESAI': return <CheckCircle className="h-4 w-4" />;
      case 'DIBATALKAN': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = async (data: OrderStatusUpdateData) => {
    if (!selectedOrder) return;

    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: data.status,
          notes: data.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: data.status, notes: data.notes || null }
          : order
      ));

      setShowStatusUpdate(false);
      setSelectedOrder(null);
      reset();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status: ' + error.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openStatusUpdate = (order: Order) => {
    setSelectedOrder(order);
    setValue('status', order.status);
    setValue('notes', order.notes || '');
    setShowStatusUpdate(true);
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Table columns definition
  const orderColumns: ColumnDef<Order>[] = [
    {
      accessorKey: "order_code",
      header: "Order Code",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("order_code")}</div>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("customer_name")}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.getValue("phone")}</div>
      ),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        const total = row.getValue("total") as number;
        return (
          <div className="font-medium">{formatCurrency(total)}</div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <StatusBadge status={getStatusColor(status)}>
            <div className="flex items-center gap-1">
              {getStatusIcon(status)}
              {status}
            </div>
          </StatusBadge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <div className="text-sm">{formatDateTime(date)}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openOrderDetails(order)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openStatusUpdate(order)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const filteredOrders = filterStatus 
    ? orders.filter(order => order.status === filterStatus)
    : orders;

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'BELUM BAYAR').length,
    processing: orders.filter(o => ['SUDAH BAYAR', 'SEDANG DISIAPKAN'].includes(o.status)).length,
    completed: orders.filter(o => ['SIAP DIAMBIL', 'SELESAI'].includes(o.status)).length,
    cancelled: orders.filter(o => o.status === 'DIBATALKAN').length,
    totalRevenue: orders
      .filter(o => ['SIAP DIAMBIL', 'SELESAI'].includes(o.status))
      .reduce((sum, o) => sum + (o.total || 0), 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Ready/Delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From completed orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                Manage and track all customer orders
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <FormSelect
                value={filterStatus}
                onValueChange={setFilterStatus}
                placeholder="Filter by status"
              >
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="BELUM BAYAR">Belum Bayar</SelectItem>
                <SelectItem value="SUDAH BAYAR">Sudah Bayar</SelectItem>
                <SelectItem value="SEDANG DISIAPKAN">Sedang Disiapkan</SelectItem>
                <SelectItem value="SIAP DIAMBIL">Siap Diambil</SelectItem>
                <SelectItem value="SELESAI">Selesai</SelectItem>
                <SelectItem value="DIBATALKAN">Dibatalkan</SelectItem>
              </FormSelect>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AdvancedTable
            columns={orderColumns}
            data={filteredOrders}
            searchKey="customer_name"
            searchPlaceholder="Search by customer name..."
            showSearch={true}
            showColumnToggle={true}
            showExport={false}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.order_code}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Customer</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.customer_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.phone}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Order Info</h4>
                  <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(selectedOrder.total || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Payment: {selectedOrder.payment_method}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {getOrderItems(selectedOrder.id).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{item.name_snapshot}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.qty} × {formatCurrency(item.price_snapshot || 0)}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency((item.price_snapshot || 0) * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status for order #{selectedOrder?.order_code}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleStatusUpdate)} className="space-y-4">
            <FormSelect
              {...register('status')}
              label="Status"
              error={errors.status?.message}
              required
              disabled={updatingStatus}
            >
              <SelectItem value="BELUM BAYAR">Belum Bayar</SelectItem>
              <SelectItem value="SUDAH BAYAR">Sudah Bayar</SelectItem>
              <SelectItem value="SEDANG DISIAPKAN">Sedang Disiapkan</SelectItem>
              <SelectItem value="SIAP DIAMBIL">Siap Diambil</SelectItem>
              <SelectItem value="SELESAI">Selesai</SelectItem>
              <SelectItem value="DIBATALKAN">Dibatalkan</SelectItem>
            </FormSelect>

            <FormTextarea
              {...register('notes')}
              label="Notes (Optional)"
              placeholder="Add any notes about this status update..."
              error={errors.notes?.message}
              disabled={updatingStatus}
              rows={3}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowStatusUpdate(false)}
                disabled={updatingStatus}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
