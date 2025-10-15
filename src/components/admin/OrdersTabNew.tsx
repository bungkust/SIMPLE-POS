import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedTable } from '@/components/ui/advanced-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormSelect, SelectItem } from '@/components/forms/FormSelect';
import { Select, SelectContent, SelectItem as SelectItemComponent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
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
  DollarSign,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/form-utils';
import { orderStatusUpdateSchema, type OrderStatusUpdateData } from '@/lib/form-schemas';
import { useAuth } from '@/contexts/AuthContext';
import { ColumnDef } from '@tanstack/react-table';
import { Database } from '@/lib/database.types';
import { ThermalReceiptImage } from '@/components/ThermalReceiptImage';
import { logger } from '@/lib/logger';
import { createSafeWhatsAppUrl } from '@/lib/security-utils';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export function OrdersTab() {
  const { currentTenant } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingMenuOptions, setLoadingMenuOptions] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [menuOptions, setMenuOptions] = useState<Record<string, any>>({});
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  // Memoize tenant ID to prevent unnecessary re-renders
  const tenantId = useMemo(() => currentTenant?.id, [currentTenant?.id]);
  
  // Use ref to track if we've already loaded data for this tenant
  const loadedTenantRef = useRef<string | null>(null);

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

  const loadOrders = useCallback(async () => {
    if (loadingOrders) {
      logger.database('Already loading orders, skipping', { component: 'OrdersTab' });
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      logger.log('OrdersTab: Starting to load orders...');
    }
    
    setLoadingOrders(true);
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
        logger.error('OrdersTab: Error loading orders:', ordersError);
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
          logger.error('OrdersTab: Error loading order items:', itemsError);
        } else {
          setOrderItems(itemsData || []);
        }
      }

    } catch (error) {
      logger.error('OrdersTab: Unexpected error:', error);
      setOrders([]);
      setOrderItems([]);
    } finally {
      setLoading(false);
      setLoadingOrders(false);
    }
  }, [tenantId, loadingOrders]);

  const loadMenuOptions = useCallback(async () => {
    if (loadingMenuOptions) {
      logger.log('🔍 Already loading menu options, skipping...');
      return;
    }
    
    if (!currentTenant?.id) {
      logger.log('🔍 No tenant ID available for loading menu options');
      return;
    }
    
    logger.log('🔍 Loading menu options for tenant:', currentTenant.id);
    setLoadingMenuOptions(true);
    
    try {
      const { data: optionsData, error } = await supabase
        .from('menu_options')
        .select(`
          id,
          label,
          menu_item_id,
          items:menu_option_items(id, name, additional_price)
        `)
        .eq('tenant_id', currentTenant.id);

      if (error) {
        logger.error('❌ Error loading menu options:', error);
        return;
      }

      // Create a lookup map for option IDs to names
      const optionsMap: Record<string, any> = {};
      optionsData?.forEach(option => {
        optionsMap[option.id] = {
          label: option.label,
          items: option.items || []
        };
      });
      setMenuOptions(optionsMap);
    } catch (error) {
      logger.error('❌ Error loading menu options:', error);
    } finally {
      setLoadingMenuOptions(false);
    }
  }, [tenantId, loadingMenuOptions]);

  // Load data when tenant changes
  useEffect(() => {
    if (tenantId) {
      logger.log('🔄 Loading data for new tenant:', tenantId);
      loadOrders();
      loadMenuOptions();
      loadTenantInfo();
      loadPaymentMethods();
    }
  }, [tenantId]); // Only depend on tenantId, not the functions

  const loadTenantInfo = async () => {
    if (!currentTenant?.id) return;

    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', currentTenant.id)
        .single();

      if (error) {
        logger.error('Error loading tenant info:', error);
      } else {
        setTenantInfo(tenant);
      }
    } catch (error) {
      logger.error('Error loading tenant info:', error);
    }
  };

  const loadPaymentMethods = async () => {
    if (!currentTenant?.id) return;

    try {
      const { data: methods, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        logger.error('Error loading payment methods:', error);
      } else {
        setPaymentMethods(methods || []);
      }
    } catch (error) {
      logger.error('Error loading payment methods:', error);
    }
  };

  // Test database permissions
  const testDatabasePermissions = async () => {
    if (!currentTenant?.id) return;
    
    try {
      logger.log('🧪 Testing database permissions...');
      
      // Test read permission
      const { data: testRead, error: readError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('tenant_id', currentTenant.id)
        .limit(1);
        
      if (readError) {
        logger.error('❌ Read permission test failed:', readError);
      } else {
        logger.log('✅ Read permission test passed:', testRead);
      }
      
      // Test update permission (dry run)
      if (testRead && testRead.length > 0) {
        const testOrder = testRead[0];
        logger.log('🧪 Testing update permission on order:', testOrder.id);
        
        const { data: testUpdate, error: updateError } = await supabase
          .from('orders')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', testOrder.id)
          .select();
          
        if (updateError) {
          logger.error('❌ Update permission test failed:', updateError);
        } else {
          logger.log('✅ Update permission test passed:', testUpdate);
        }
      }
    } catch (error) {
      logger.error('❌ Permission test error:', error);
    }
  };

  const getOrderItems = (orderId: string) => {
    return orderItems.filter(item => item.order_id === orderId);
  };

  const resolveOptionNames = (optionsJson: string) => {
    try {
      logger.log('🔍 Resolving options:', optionsJson);
      logger.log('🔍 Available menu options:', menuOptions);
      
      const options = JSON.parse(optionsJson);
      const resolvedOptions: Record<string, string> = {};
      
      Object.entries(options).forEach(([optionId, itemId]) => {
        logger.log(`🔍 Processing option: ${optionId} -> ${itemId}`);
        const option = menuOptions[optionId];
        logger.log(`🔍 Found option:`, option);
        
        if (option) {
          const item = option.items.find((i: any) => i.id === itemId);
          logger.log(`🔍 Found item:`, item);
          if (item) {
            resolvedOptions[option.label] = item.name;
            logger.log(`✅ Resolved: ${option.label} = ${item.name}`);
          } else {
            resolvedOptions[option.label] = `Unknown (${String(itemId).substring(0, 8)}...)`;
            logger.log(`⚠️ Item not found for option: ${option.label}`);
          }
        } else {
          resolvedOptions[`Option (${optionId.substring(0, 8)}...)`] = `Item (${String(itemId).substring(0, 8)}...)`;
          logger.log(`❌ Option not found: ${optionId}`);
        }
      });
      
      logger.log('🔍 Final resolved options:', resolvedOptions);
      return resolvedOptions;
    } catch (error) {
      logger.error('Error resolving option names:', error);
      return {};
    }
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
      case 'DIBATALKAN': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = async (data: OrderStatusUpdateData) => {
    if (!selectedOrder) {
      logger.error('No selected order for status update');
      return;
    }

    logger.log('🔄 Updating order status:', {
      orderId: selectedOrder.id,
      orderCode: selectedOrder.order_code,
      currentStatus: selectedOrder.status,
      newStatus: data.status,
      notes: data.notes
    });

    setUpdatingStatus(true);
    try {
      const updateData = {
        status: data.status,
        notes: data.notes || null,
        updated_at: new Date().toISOString()
      };

      logger.log('📝 Update data:', updateData);

      const { data: result, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedOrder.id)
        .select();

      if (error) {
        logger.error('❌ Supabase error:', error);
        throw error;
      }

      logger.log('✅ Update successful:', result);

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: data.status, notes: data.notes || null }
          : order
      ));

      setShowStatusUpdate(false);
      setSelectedOrder(null);
      reset();
      
      logger.log('🎉 Status update completed successfully');
      
      // Show success toast
      toast({
        title: "Status Updated",
        description: `Order ${selectedOrder.order_code} status updated to ${data.status}`,
        variant: "default",
      });
      
      // Force refresh the orders list to ensure UI is up to date
      setTimeout(() => {
        logger.log('🔄 Refreshing orders list...');
        loadOrders();
      }, 500);
    } catch (error: any) {
      logger.error('❌ Error updating order status:', error);
      toast({
        title: "Update Failed",
        description: `Failed to update order status: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openStatusUpdate = (order: Order) => {
    logger.log('🔍 Opening status update for order:', order.order_code, 'Current status:', order.status);
    setSelectedOrder(order);
    setValue('status', order.status);
    setValue('notes', order.notes || '');
    setShowStatusUpdate(true);
    logger.log('🔍 Form initialized with status:', order.status);
  };

  const sendReceiptToWhatsApp = (order: Order) => {
    // Set order for receipt generation
    setSelectedOrderForReceipt(order);
    setShowReceiptGenerator(true);
  };

  const cancelOrder = async (order: Order) => {
    if (!currentTenant?.id) return;

    try {
      logger.log('🗑️ Cancelling order:', order.order_code);
      
      // Update order status to DIBATALKAN
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'DIBATALKAN',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      logger.log('✅ Order cancelled successfully');
      
      toast({
        title: "Order Cancelled",
        description: `Order ${order.order_code} has been cancelled and removed from the list.`,
        variant: "default",
      });
      
      // Reload orders to reflect changes
      await loadOrders();
    } catch (error: any) {
      logger.error('❌ Error cancelling order:', error);
      toast({
        title: "Cancel Failed",
        description: `Failed to cancel order: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleImageGenerated = (imageDataUrl: string) => {
    if (!selectedOrderForReceipt) return;

    // Download the image first
    const link = document.createElement('a');
    link.download = `receipt-${selectedOrderForReceipt.order_code}.png`;
    link.href = imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Simple WhatsApp message without redundant info
    const receiptMessage = `Terima kasih atas pesanannya!

Berikut adalah struk atas pembelian Anda.

Terima kasih dan selamat menikmati!`;

    try {
      // Create secure WhatsApp URL with input sanitization
      const whatsappUrl = createSafeWhatsAppUrl(selectedOrderForReceipt.phone, receiptMessage);
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      logger.error('Failed to create WhatsApp URL', { error: error.message });
      toast({
        title: "Error",
        description: "Invalid phone number format. Please check the customer's phone number.",
        variant: "destructive",
      });
      return;
    }
    
    // Close the receipt generator
    setShowReceiptGenerator(false);
    setSelectedOrderForReceipt(null);
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
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openStatusUpdate(order)}
              title="Update Status"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => sendReceiptToWhatsApp(order)}
              title="Send Receipt to WhatsApp"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cancelOrder(order)}
              title="Cancel Order"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const filteredOrders = filterStatus && filterStatus !== 'all'
    ? orders.filter(order => order.status === filterStatus && order.status !== 'DIBATALKAN')
    : orders.filter(order => order.status !== 'DIBATALKAN');

  const stats = {
    total: orders.filter(o => o.status !== 'DIBATALKAN').length,
    pending: orders.filter(o => o.status === 'BELUM BAYAR').length,
    processing: orders.filter(o => o.status === 'SUDAH BAYAR').length,
    completed: orders.filter(o => o.status === 'SUDAH BAYAR').length, // Using SUDAH BAYAR as completed
    cancelled: orders.filter(o => o.status === 'DIBATALKAN').length,
    totalRevenue: orders
      .filter(o => o.status === 'SUDAH BAYAR')
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="BELUM BAYAR">Belum Bayar</SelectItem>
                <SelectItem value="SUDAH BAYAR">Sudah Bayar</SelectItem>
                <SelectItem value="DIBATALKAN">Dibatalkan</SelectItem>
              </FormSelect>
              <Button
                variant="outline"
                size="sm"
                onClick={testDatabasePermissions}
              >
                🧪 Test DB
              </Button>
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

              {/* Payment Method Details */}
              <div>
                <h4 className="font-medium mb-2">Payment Method Details</h4>
                <div className="p-3 border rounded-lg bg-muted/20">
                  {(() => {
                    const currentPaymentMethod = paymentMethods.find(pm => pm.payment_type === selectedOrder.payment_method);
                    
                    if (!currentPaymentMethod) {
                      return (
                        <div className="text-sm text-muted-foreground">
                          <p>Payment Method: {selectedOrder.payment_method}</p>
                          <p className="text-xs mt-1">No additional details available</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Method:</span>
                          <span className="text-sm">{currentPaymentMethod.name}</span>
                        </div>
                        
                        {selectedOrder.payment_method === 'TRANSFER' && (
                          <>
                            {currentPaymentMethod.bank_name && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Bank:</span>
                                <span className="text-sm">{currentPaymentMethod.bank_name}</span>
                              </div>
                            )}
                            {currentPaymentMethod.account_number && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Account Number:</span>
                                <span className="text-sm font-mono">{currentPaymentMethod.account_number}</span>
                              </div>
                            )}
                            {currentPaymentMethod.account_holder && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Account Holder:</span>
                                <span className="text-sm">{currentPaymentMethod.account_holder}</span>
                              </div>
                            )}
                          </>
                        )}
                        
                        {selectedOrder.payment_method === 'QRIS' && currentPaymentMethod.qris_image_url && (
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground mb-2">QR Code:</p>
                            <div className="flex justify-center">
                              <img 
                                src={currentPaymentMethod.qris_image_url} 
                                alt="QRIS Code" 
                                className="w-32 h-32 object-contain border rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {selectedOrder.payment_method === 'QRIS' && !currentPaymentMethod.qris_image_url && (
                          <div className="text-sm text-muted-foreground">
                            <p>QRIS payment method</p>
                            <p className="text-xs mt-1">QR Code not available</p>
                          </div>
                        )}
                        
                        {selectedOrder.payment_method === 'COD' && (
                          <div className="text-sm text-muted-foreground">
                            <p>Cash on Delivery</p>
                            <p className="text-xs mt-1">Payment to be collected upon delivery</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {getOrderItems(selectedOrder.id).map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{item.name_snapshot}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.qty} × {formatCurrency(item.price_snapshot || 0)}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency((item.price_snapshot || 0) * item.qty)}
                        </p>
                      </div>
                      
                      {/* Display options/customizations if they exist */}
                      {item.notes && item.notes.trim() && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          {(() => {
                            const notes = item.notes;
                            logger.log('🔍 Processing item notes:', notes);
                            
                            // Handle structured format from checkout
                            if (notes.startsWith('OPTIONS:')) {
                              const optionsText = notes.replace('OPTIONS:', '');
                              logger.log('🔍 OPTIONS: prefix detected, optionsText:', optionsText);
                              
                              // Check if it's JSON format
                              if (optionsText.includes('{') && optionsText.includes('}')) {
                                logger.log('🔍 OPTIONS: contains JSON, attempting resolution');
                                try {
                                  const jsonMatch = optionsText.match(/\{.*\}/);
                                  if (jsonMatch) {
                                    const resolvedOptions = resolveOptionNames(jsonMatch[0]);
                                    logger.log('🔍 OPTIONS: resolved options:', resolvedOptions);
                                    
                                    if (Object.keys(resolvedOptions).length > 0) {
                                      return (
                                        <>
                                          <p className="text-xs font-medium text-muted-foreground mb-1">Selected Options:</p>
                                          <div className="text-sm text-foreground">
                                            {Object.entries(resolvedOptions).map(([key, value]) => (
                                              <div key={key} className="flex justify-between">
                                                <span className="text-muted-foreground">{key}:</span>
                                                <span>{value}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </>
                                      );
                                    }
                                  }
                                } catch (error) {
                                  logger.error('🔍 OPTIONS: JSON resolution failed:', error);
                                }
                              }
                              
                              // Fallback to original logic for non-JSON OPTIONS
                              return (
                                <>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Selected Options:</p>
                                  <div className="text-sm text-foreground">
                                    {optionsText.split(';').map((option, index) => (
                                      <div key={index} className="text-sm">
                                        {option.trim()}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              );
                            }
                            
                            // Handle user notes
                            if (notes.startsWith('USER_NOTES:')) {
                              const userNotes = notes.replace('USER_NOTES:', '');
                              return (
                                <>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Customer Notes:</p>
                                  <div className="text-sm text-foreground italic">
                                    {userNotes}
                                  </div>
                                </>
                              );
                            }
                            
                            // Handle structured JSON format from MenuDetailSheet
                            if (notes.includes('{') && notes.includes('}')) {
                              try {
                                logger.log('🔍 Processing JSON notes:', notes);
                                // Extract JSON from structured format
                                const jsonMatch = notes.match(/\{.*\}/);
                                logger.log('🔍 JSON match:', jsonMatch);
                                
                                if (jsonMatch) {
                                  const resolvedOptions = resolveOptionNames(jsonMatch[0]);
                                  logger.log('🔍 Resolved options for display:', resolvedOptions);
                                  
                                  // If resolution failed, try manual resolution
                                  if (Object.keys(resolvedOptions).length === 0) {
                                    logger.log('🔍 Manual resolution attempt...');
                                    const options = JSON.parse(jsonMatch[0]);
                                    const manualResolved: Record<string, string> = {};
                                    
                                    Object.entries(options).forEach(([optionId, itemId]) => {
                                      const option = menuOptions[optionId];
                                      if (option) {
                                        const item = option.items.find((i: any) => i.id === itemId);
                                        if (item) {
                                          manualResolved[option.label] = item.name;
                                        } else {
                                          manualResolved[option.label] = `Unknown (${String(itemId).substring(0, 8)}...)`;
                                        }
                                      } else {
                                        manualResolved[`Option (${optionId.substring(0, 8)}...)`] = `Item (${String(itemId).substring(0, 8)}...)`;
                                      }
                                    });
                                    
                                    logger.log('🔍 Manual resolved options:', manualResolved);
                                    
                                    return (
                                      <>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Selected Options:</p>
                                        <div className="text-sm text-foreground">
                                          {Object.keys(manualResolved).length > 0 ? (
                                            Object.entries(manualResolved).map(([key, value]) => (
                                              <div key={key} className="flex justify-between">
                                                <span className="text-muted-foreground">{key}:</span>
                                                <span>{value}</span>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="text-muted-foreground italic">
                                              Option details not available
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    );
                                  }
                                  
                                  return (
                                    <>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Selected Options:</p>
                                      <div className="text-sm text-foreground">
                                        {Object.keys(resolvedOptions).length > 0 ? (
                                          Object.entries(resolvedOptions).map(([key, value]) => (
                                            <div key={key} className="flex justify-between">
                                              <span className="text-muted-foreground">{key}:</span>
                                              <span>{value}</span>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="text-muted-foreground italic">
                                            Option details not available
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  );
                                }
                              } catch (error) {
                                logger.error('🔍 Error processing JSON notes:', error);
                                // Fallback to plain text
                                return (
                                  <>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p>
                                    <div className="text-sm text-foreground">
                                      {notes}
                                    </div>
                                  </>
                                );
                              }
                            }
                            
                            // Handle legacy formatted text from MenuDetailModal
                            if (notes.includes(':')) {
                              return (
                                <>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Selected Options:</p>
                                  <div className="text-sm text-foreground">
                                    {notes.split(';').map((option, index) => (
                                      <div key={index} className="text-sm">
                                        {option.trim()}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              );
                            }
                            
                            // Fallback for plain text - but try to resolve if it looks like JSON
                            if (notes.includes('{') && notes.includes('}')) {
                              logger.log('🔍 Fallback: Attempting to resolve JSON in plain text fallback');
                              try {
                                const jsonMatch = notes.match(/\{.*\}/);
                                if (jsonMatch) {
                                  const options = JSON.parse(jsonMatch[0]);
                                  const manualResolved: Record<string, string> = {};
                                  
                                  Object.entries(options).forEach(([optionId, itemId]) => {
                                    const option = menuOptions[optionId];
                                    if (option) {
                                      const item = option.items.find((i: any) => i.id === itemId);
                                      if (item) {
                                        manualResolved[option.label] = item.name;
                                      } else {
                                        manualResolved[option.label] = `Unknown (${String(itemId).substring(0, 8)}...)`;
                                      }
                                    } else {
                                      manualResolved[`Option (${optionId.substring(0, 8)}...)`] = `Item (${String(itemId).substring(0, 8)}...)`;
                                    }
                                  });
                                  
                                  logger.log('🔍 Fallback resolved options:', manualResolved);
                                  
                                  if (Object.keys(manualResolved).length > 0) {
                                    return (
                                      <>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Selected Options:</p>
                                        <div className="text-sm text-foreground">
                                          {Object.entries(manualResolved).map(([key, value]) => (
                                            <div key={key} className="flex justify-between">
                                              <span className="text-muted-foreground">{key}:</span>
                                              <span>{value}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    );
                                  }
                                }
                              } catch (error) {
                                logger.error('🔍 Fallback resolution failed:', error);
                              }
                            }
                            
                            return (
                              <>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p>
                                <div className="text-sm text-foreground">
                                  {notes}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
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
          <form onSubmit={handleSubmit((data) => {
            logger.log('📋 Form submitted with data:', data);
            logger.log('📋 Current form status value:', status);
            logger.log('📋 Selected order status:', selectedOrder?.status);
            handleStatusUpdate(data);
          })} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={status}
                onValueChange={(value) => {
                  logger.log('🔄 Status changed to:', value);
                  setValue('status', value as 'BELUM BAYAR' | 'SUDAH BAYAR' | 'DIBATALKAN');
                }}
                disabled={updatingStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItemComponent value="BELUM BAYAR">Belum Bayar</SelectItemComponent>
                  <SelectItemComponent value="SUDAH BAYAR">Sudah Bayar</SelectItemComponent>
                  <SelectItemComponent value="DIBATALKAN">Dibatalkan</SelectItemComponent>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>

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

      {/* Receipt Image Generator */}
      {showReceiptGenerator && selectedOrderForReceipt && tenantInfo && (
        <ThermalReceiptImage
          order={{
            ...selectedOrderForReceipt,
            order_items: getOrderItems(selectedOrderForReceipt.id),
            payment_methods: paymentMethods
          }}
          tenant={tenantInfo}
          onImageGenerated={handleImageGenerated}
        />
      )}
    </div>
  );
}
