"use client";
// lib/uploadStorage.ts - Helper riusabile upload Supabase Storage

import { supabase } from "@/lib/supabase";

const BUCKET = 'commesse-foto';

export async function uploadFile(folder: string, file: File): Promise<{ url: string; path: string } | null> {
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const fname = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    
    const { data, error } = await supabase.storage.from(BUCKET).upload(fname, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
    
    if (error) {
      console.warn('[upload]', error);
      return null;
    }
    
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return { url: urlData.publicUrl, path: data.path };
  } catch (e) {
    console.warn('[uploadFile]', e);
    return null;
  }
}

export async function uploadMultipleFiles(folder: string, files: FileList | File[]): Promise<string[]> {
  const arr = Array.from(files);
  const results = await Promise.all(arr.map(f => uploadFile(folder, f)));
  return results.filter(Boolean).map(r => r!.url);
}

export async function deleteFile(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    return !error;
  } catch {
    return false;
  }
}
