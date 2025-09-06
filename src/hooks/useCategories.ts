import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  type: 'income' | 'expense' | 'savings' | 'debt';
  icon?: string;
  color?: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: CreateCategoryData) => {
    if (!user) return { error: 'No user found' };

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            ...categoryData,
            user_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      toast({
        title: "Category created",
        description: "Your category has been saved successfully.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating category",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<CreateCategoryData>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCategories(categories.map(c => c.id === id ? data : c));
      toast({
        title: "Category updated",
        description: "Category has been updated successfully.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error updating category",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(categories.filter(c => c.id !== id));
      toast({
        title: "Category deleted",
        description: "Category has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
};