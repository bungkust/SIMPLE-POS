import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormInput } from '@/components/forms/FormInput';
import { AdvancedTable } from '@/components/ui/advanced-table';
import { ResponsiveTable, createMobileCardConfig } from '@/components/ui/responsive-table';
import { useIsMobile } from '@/hooks/use-media-query';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Tag,
  Hash,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { categoryFormSchema, type CategoryFormData } from '@/lib/form-schemas';
import { useAppToast } from '@/components/ui/toast-provider';
import { ColumnDef } from '@tanstack/react-table';
import { colors, typography, components, sizes, spacing, cn } from '@/lib/design-system';

type Category = {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export function CategoriesTab() {
  const { currentTenant } = useAuth();
  const { showSuccess, showError } = useAppToast();
  const isMobile = useIsMobile();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      sort_order: 0
    }
  });

  useEffect(() => {
    if (currentTenant) {
      loadCategories();
    }
  }, [currentTenant]);

  const loadCategories = async () => {
    if (!currentTenant?.id) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error loading categories:', error);
        showError('Error', 'Failed to load categories');
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      showError('Error', 'Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    if (!currentTenant?.id) return;

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: data.name,
            sort_order: data.sort_order
          })
          .eq('id', editingCategory.id);

        if (error) throw error;

        showSuccess('Category Updated', 'Category berhasil diperbarui.');
      } else {
        // Create new category - ensure unique sort_order
        const existingSortOrder = categories.find(c => c.sort_order === data.sort_order);
        if (existingSortOrder) {
          showError('Sort Order Conflict', 'Sort order already exists. Please choose a different number.');
          return;
        }

        const { error } = await supabase
          .from('categories')
          .insert({
            tenant_id: currentTenant.id,
            name: data.name,
            sort_order: data.sort_order
          });

        if (error) throw error;

        showSuccess('Category Created', 'Category baru berhasil dibuat.');
      }

      setShowForm(false);
      setEditingCategory(null);
      reset();
      loadCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      showError('Save Failed', 'Gagal menyimpan category: ' + error.message);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setValue('name', category.name);
    setValue('sort_order', category.sort_order);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    reset();
    // Suggest next available sort_order
    const maxSortOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.sort_order || 0)) 
      : 0;
    setValue('sort_order', maxSortOrder + 1);
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    try {
      // Check if category has menu items
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('category_id', category.id)
        .limit(1);

      if (menuError) throw menuError;

      if (menuItems && menuItems.length > 0) {
        showError('Cannot Delete', 'Cannot delete category that has menu items. Please move or delete the menu items first.');
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== category.id));
      setShowDeleteDialog(false);
      setDeletingCategory(null);
      showSuccess('Category Deleted', 'Category berhasil dihapus.');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      showError('Delete Failed', 'Gagal menghapus category: ' + error.message);
    }
  };

  const moveCategory = async (category: Category, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === category.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const targetCategory = categories[newIndex];
    setUpdatingOrder(category.id);

    try {
      // Swap sort orders - use separate updates to avoid primary key conflicts
      const { error: error1 } = await supabase
        .from('categories')
        .update({ sort_order: targetCategory.sort_order })
        .eq('id', category.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('categories')
        .update({ sort_order: category.sort_order })
        .eq('id', targetCategory.id);

      if (error2) throw error2;

      // Update local state
      setCategories(prev => {
        const newCategories = [...prev];
        [newCategories[currentIndex], newCategories[newIndex]] = [newCategories[newIndex], newCategories[currentIndex]];
        return newCategories;
      });

      showSuccess('Order Updated', 'Category order berhasil diperbarui.');
    } catch (error: any) {
      console.error('Error updating category order:', error);
      showError('Update Failed', 'Gagal memperbarui urutan category.');
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Table columns definition
  const categoryColumns: ColumnDef<Category>[] = [
    {
      accessorKey: "sort_order",
      header: "Order",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{row.getValue("sort_order")}</span>
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Category Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{date.toLocaleDateString('id-ID')}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const category = row.original;
        const currentIndex = categories.findIndex(c => c.id === category.id);
        const canMoveUp = currentIndex > 0;
        const canMoveDown = currentIndex < categories.length - 1;

        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => moveCategory(category, 'up')}
              disabled={!canMoveUp || updatingOrder === category.id}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => moveCategory(category, 'down')}
              disabled={!canMoveDown || updatingOrder === category.id}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(category)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeletingCategory(category);
                setShowDeleteDialog(true);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className={cn(spacing.lg)}>
        <Card className={cn(components.card)}>
          <CardContent className={cn(sizes.card.lg)}>
            <div className="animate-pulse">
              <div className={cn("h-4 bg-gray-200 rounded w-1/4 mb-4")}></div>
              <div className={cn(spacing.sm)}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={cn("h-12 bg-gray-200 rounded")}></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(spacing.lg, "w-full max-w-full overflow-hidden")}>
      <Card className={cn(components.card, "w-full max-w-full overflow-hidden")}>
        <CardHeader>
          <div className={cn(spacing.md)}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className={cn(typography.h3, "flex items-center gap-2")}>
                  <Tag className={cn(sizes.icon.md)} />
                  Categories
                </CardTitle>
                <CardDescription className={cn(typography.body.medium, colors.text.secondary)}>
                  Kelola kategori menu
                </CardDescription>
              </div>
              {!isMobile && (
                <Button onClick={handleAddNew} className={cn(components.buttonPrimary)}>
                  <Plus className={cn(sizes.icon.sm, "mr-2")} />
                  Add Category
                </Button>
              )}
            </div>
            {isMobile && (
              <Button onClick={handleAddNew} className={cn("w-full", components.buttonPrimary)}>
                <Plus className={cn(sizes.icon.sm, "mr-2")} />
                Add Category
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden w-full max-w-full">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Tag className={cn(sizes.icon.lg, colors.text.muted, "mx-auto mb-4")} />
              <h3 className={cn(typography.h3, "mb-2")}>No Categories Found</h3>
              <p className={cn(typography.body.medium, colors.text.muted, "mb-4")}>
                Create your first category to organize your menu items.
              </p>
              <Button onClick={handleAddNew} className={cn(components.buttonPrimary)}>
                <Plus className={cn(sizes.icon.sm, "mr-2")} />
                Add First Category
              </Button>
            </div>
          ) : (
            <div className={cn(spacing.md)}>
              <Alert className={cn(components.alert)}>
                <AlertCircle className={cn(sizes.icon.sm)} />
                <AlertDescription className={cn(typography.body.small)}>
                  Use the arrow buttons to reorder categories. Categories with menu items cannot be deleted.
                </AlertDescription>
              </Alert>
              
              <ResponsiveTable
                columns={categoryColumns}
                data={categories}
                searchKey="name"
                searchPlaceholder="Search categories..."
                showSearch={true}
                showColumnToggle={false}
                showExport={false}
                pageSize={10}
                mobileCardConfig={createMobileCardConfig<Category>({
                  primaryField: 'name',
                  secondaryField: 'sort_order',
                  statusField: 'sort_order',
                  statusConfig: {
                    getStatus: (category) => ({
                      label: `Order: ${category.sort_order}`,
                      variant: 'outline' as const
                    })
                  },
                  iconField: 'name',
                  iconConfig: {
                    getIcon: () => <Tag className="h-4 w-4 text-primary" />
                  },
                  expandable: false,
                  getActions: (category) => {
                    const currentIndex = categories.findIndex(c => c.id === category.id);
                    const canMoveUp = currentIndex > 0;
                    const canMoveDown = currentIndex < categories.length - 1;

                    return (
                      <div className="flex items-center space-x-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveCategory(category, 'up')}
                          disabled={!canMoveUp || updatingOrder === category.id}
                          title="Move Up"
                          className="h-7 w-7 p-0"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveCategory(category, 'down')}
                          disabled={!canMoveDown || updatingOrder === category.id}
                          title="Move Down"
                          className="h-7 w-7 p-0"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          title="Edit Category"
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingCategory(category);
                            setShowDeleteDialog(true);
                          }}
                          title="Delete Category"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  }
                })}
                emptyState={{
                  icon: <Tag className="h-12 w-12" />,
                  title: "No Categories Found",
                  description: "Create your first category to organize your menu items.",
                  action: (
                    <Button onClick={handleAddNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Category
                    </Button>
                  )
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent fullScreenOnMobile={true}>
          <DialogHeader>
            <DialogTitle className={cn(typography.h3)}>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription className={cn(typography.body.medium, colors.text.secondary)}>
              {editingCategory 
                ? 'Update the category information'
                : 'Create a new category for your menu items'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className={cn(spacing.md)}>
            <FormInput
              {...register('name')}
              label="Category Name"
              placeholder="Enter category name"
              error={errors.name?.message}
              required
            />

            <FormInput
              {...register('sort_order', { valueAsNumber: true })}
              label="Sort Order"
              type="number"
              placeholder="0"
              error={errors.sort_order?.message}
              required
              helperText="Lower numbers appear first in the menu"
            />

            <div className={cn("flex justify-end space-x-2")}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className={cn(components.buttonOutline)}
              >
                Cancel
              </Button>
              <Button type="submit" className={cn(components.buttonPrimary)}>
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={cn(typography.h3)}>Delete Category</DialogTitle>
            <DialogDescription className={cn(typography.body.medium, colors.text.secondary)}>
              Are you sure you want to delete "{deletingCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className={cn("flex justify-end space-x-2")}>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className={cn(components.buttonOutline)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingCategory && handleDelete(deletingCategory)}
              className={cn(components.buttonDestructive)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
