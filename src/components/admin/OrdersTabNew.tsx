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
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [menuOptions, setMenuOptions] = useState<Record<string, any>>({});

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
      loadMenuOptions();
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

  const loadMenuOptions = async () => {
    if (!currentTenant?.id) {
      console.log('🔍 No tenant ID available for loading menu options');
      return;
    }
    
    console.log('🔍 Loading menu options for tenant:', currentTenant.id);
    
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
        console.error('❌ Error loading menu options:', error);
        return;
      }

      console.log('🔍 Raw menu options data:', optionsData);

      // Create a lookup map for option IDs to names
      const optionsMap: Record<string, any> = {};
      optionsData?.forEach(option => {
        console.log('🔍 Processing option:', option);
        optionsMap[option.id] = {
          label: option.label,
          items: option.items || []
        };
      });

      console.log('🔍 Final options map:', optionsMap);
      setMenuOptions(optionsMap);
    } catch (error) {
      console.error('❌ Error loading menu options:', error);
    }
  };

  // Test database permissions
  const testDatabasePermissions = async () => {
    if (!currentTenant?.id) return;
    
    try {
      console.log('🧪 Testing database permissions...');
      
      // Test read permission
      const { data: testRead, error: readError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('tenant_id', currentTenant.id)
        .limit(1);
        
      if (readError) {
        console.error('❌ Read permission test failed:', readError);
      } else {
        console.log('✅ Read permission test passed:', testRead);
      }
      
      // Test update permission (dry run)
      if (testRead && testRead.length > 0) {
        const testOrder = testRead[0];
        console.log('🧪 Testing update permission on order:', testOrder.id);
        
        const { data: testUpdate, error: updateError } = await supabase
          .from('orders')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', testOrder.id)
          .select();
          
        if (updateError) {
          console.error('❌ Update permission test failed:', updateError);
        } else {
          console.log('✅ Update permission test passed:', testUpdate);
        }
      }
    } catch (error) {
      console.error('❌ Permission test error:', error);
    }
  };

  const getOrderItems = (orderId: string) => {
    return orderItems.filter(item => item.order_id === orderId);
  };

  const resolveOptionNames = (optionsJson: string) => {
    try {
      console.log('🔍 Resolving options:', optionsJson);
      console.log('🔍 Available menu options:', menuOptions);
      
      const options = JSON.parse(optionsJson);
      const resolvedOptions: Record<string, string> = {};
      
      Object.entries(options).forEach(([optionId, itemId]) => {
        console.log(`🔍 Processing option: ${optionId} -> ${itemId}`);
        const option = menuOptions[optionId];
        console.log(`🔍 Found option:`, option);
        
        if (option) {
          const item = option.items.find((i: any) => i.id === itemId);
          console.log(`🔍 Found item:`, item);
          if (item) {
            resolvedOptions[option.label] = item.name;
            console.log(`✅ Resolved: ${option.label} = ${item.name}`);
          } else {
            resolvedOptions[option.label] = `Unknown (${String(itemId).substring(0, 8)}...)`;
            console.log(`⚠️ Item not found for option: ${option.label}`);
          }
        } else {
          resolvedOptions[`Option (${optionId.substring(0, 8)}...)`] = `Item (${String(itemId).substring(0, 8)}...)`;
          console.log(`❌ Option not found: ${optionId}`);
        }
      });
      
      console.log('🔍 Final resolved options:', resolvedOptions);
      return resolvedOptions;
    } catch (error) {
      console.error('Error resolving option names:', error);
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
      console.error('No selected order for status update');
      return;
    }

    console.log('🔄 Updating order status:', {
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

      console.log('📝 Update data:', updateData);

      const { data: result, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedOrder.id)
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Update successful:', result);

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: data.status, notes: data.notes || null }
          : order
      ));

      setShowStatusUpdate(false);
      setSelectedOrder(null);
      reset();
      
      console.log('🎉 Status update completed successfully');
      
      // Show success toast
      toast({
        title: "Status Updated",
        description: `Order ${selectedOrder.order_code} status updated to ${data.status}`,
        variant: "default",
      });
      
      // Force refresh the orders list to ensure UI is up to date
      setTimeout(() => {
        console.log('🔄 Refreshing orders list...');
        loadOrders();
      }, 500);
    } catch (error: any) {
      console.error('❌ Error updating order status:', error);
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
    console.log('🔍 Opening status update for order:', order.order_code, 'Current status:', order.status);
    setSelectedOrder(order);
    setValue('status', order.status);
    setValue('notes', order.notes || '');
    setShowStatusUpdate(true);
    console.log('🔍 Form initialized with status:', order.status);
  };

  const sendReceiptToWhatsApp = (order: Order) => {
    // Format the receipt message
    const receiptMessage = `🍽️ *Receipt - ${order.order_code}*

📅 *Date:* ${formatDateTime(new Date(order.created_at))}
👤 *Customer:* ${order.customer_name}
📞 *Phone:* ${order.phone}
💰 *Total:* ${formatCurrency(order.total)}
📊 *Status:* ${order.status}

📋 *Order Details:*
${order.items?.map(item => 
  `• ${item.name} x${item.quantity} = ${formatCurrency(item.price * item.quantity)}`
).join('\n') || 'No items found'}

Thank you for your order! 🙏`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(receiptMessage);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${order.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
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
          </div>
        );
      },
    },
  ];

  const filteredOrders = filterStatus && filterStatus !== 'all'
    ? orders.filter(order => order.status === filterStatus)
    : orders;

  const stats = {
    total: orders.length,
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
                            console.log('🔍 Processing item notes:', notes);
                            
                            // Handle structured format from checkout
                            if (notes.startsWith('OPTIONS:')) {
                              const optionsText = notes.replace('OPTIONS:', '');
                              console.log('🔍 OPTIONS: prefix detected, optionsText:', optionsText);
                              
                              // Check if it's JSON format
                              if (optionsText.includes('{') && optionsText.includes('}')) {
                                console.log('🔍 OPTIONS: contains JSON, attempting resolution');
                                try {
                                  const jsonMatch = optionsText.match(/\{.*\}/);
                                  if (jsonMatch) {
                                    const resolvedOptions = resolveOptionNames(jsonMatch[0]);
                                    console.log('🔍 OPTIONS: resolved options:', resolvedOptions);
                                    
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
                                  console.error('🔍 OPTIONS: JSON resolution failed:', error);
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
                                console.log('🔍 Processing JSON notes:', notes);
                                // Extract JSON from structured format
                                const jsonMatch = notes.match(/\{.*\}/);
                                console.log('🔍 JSON match:', jsonMatch);
                                
                                if (jsonMatch) {
                                  const resolvedOptions = resolveOptionNames(jsonMatch[0]);
                                  console.log('🔍 Resolved options for display:', resolvedOptions);
                                  
                                  // If resolution failed, try manual resolution
                                  if (Object.keys(resolvedOptions).length === 0) {
                                    console.log('🔍 Manual resolution attempt...');
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
                                    
                                    console.log('🔍 Manual resolved options:', manualResolved);
                                    
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
                                console.error('🔍 Error processing JSON notes:', error);
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
                              console.log('🔍 Fallback: Attempting to resolve JSON in plain text fallback');
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
                                  
                                  console.log('🔍 Fallback resolved options:', manualResolved);
                                  
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
                                console.error('🔍 Fallback resolution failed:', error);
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
            console.log('📋 Form submitted with data:', data);
            console.log('📋 Current form status value:', status);
            console.log('📋 Selected order status:', selectedOrder?.status);
            handleStatusUpdate(data);
          })} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={status}
                onValueChange={(value) => {
                  console.log('🔄 Status changed to:', value);
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
    </div>
  );
}
