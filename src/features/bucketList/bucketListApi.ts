import { supabase } from '@/lib/supabase';

export type BucketItem = {
  id: string;
  name: string;
  cafe: string | null;
  notes: string | null;
  isCompleted: boolean;
  createdAt: string;
};

// What the bucket-list form edits. Only `name` is required.
export type BucketDraft = {
  name: string;
  cafe: string;
  notes: string;
};

export const emptyBucketDraft: BucketDraft = { name: '', cafe: '', notes: '' };

const COLUMNS = 'id, coffee_name, cafe_name, notes, is_completed, created_at';

type BucketRow = {
  id: string;
  coffee_name: string;
  cafe_name: string | null;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
};

function toItem(row: BucketRow): BucketItem {
  return {
    id: row.id,
    name: row.coffee_name,
    cafe: row.cafe_name,
    notes: row.notes,
    isCompleted: row.is_completed,
    createdAt: row.created_at,
  };
}

function fieldsFromDraft(draft: BucketDraft) {
  return {
    coffee_name: draft.name.trim(),
    cafe_name: draft.cafe.trim() || null,
    notes: draft.notes.trim() || null,
  };
}

// Newest first. Row Level Security limits this to the signed-in user's rows.
export async function fetchBucketItems(): Promise<BucketItem[]> {
  const { data, error } = await supabase
    .from('bucket_list_items')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .returns<BucketRow[]>();
  if (error) throw error;
  return data.map(toItem);
}

export async function createBucketItem(draft: BucketDraft): Promise<BucketItem> {
  const { data, error } = await supabase
    .from('bucket_list_items')
    .insert(fieldsFromDraft(draft))
    .select(COLUMNS)
    .single<BucketRow>();
  if (error) throw error;
  return toItem(data);
}

export async function updateBucketItem(id: string, draft: BucketDraft): Promise<BucketItem> {
  const { data, error } = await supabase
    .from('bucket_list_items')
    .update(fieldsFromDraft(draft))
    .eq('id', id)
    .select(COLUMNS)
    .single<BucketRow>();
  if (error) throw error;
  return toItem(data);
}

export async function setBucketItemCompleted(id: string, isCompleted: boolean): Promise<void> {
  const { error } = await supabase.from('bucket_list_items').update({ is_completed: isCompleted }).eq('id', id);
  if (error) throw error;
}

export async function deleteBucketItem(id: string): Promise<void> {
  const { error } = await supabase.from('bucket_list_items').delete().eq('id', id);
  if (error) throw error;
}
