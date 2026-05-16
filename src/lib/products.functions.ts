import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const productInput = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  price: z.number().min(0).max(1_000_000),
  commission_percent: z.number().min(0).max(100),
  image_url: z.string().trim().url().max(2048).optional().nullable().or(z.literal("")),
  status: z.enum(["draft", "published"]),
});

export const listMyProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { products: data ?? [] };
  });

export const getProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", data.id)
      .eq("seller_id", userId)
      .maybeSingle();
    if (error) throw error;
    return { product };
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => productInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        seller_id: userId,
        title: data.title,
        description: data.description || null,
        price: data.price,
        commission_percent: data.commission_percent,
        image_url: data.image_url || null,
        status: data.status,
      })
      .select()
      .single();
    if (error) throw error;
    return { product };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    productInput.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...rest } = data;
    const { data: product, error } = await supabase
      .from("products")
      .update({
        title: rest.title,
        description: rest.description || null,
        price: rest.price,
        commission_percent: rest.commission_percent,
        image_url: rest.image_url || null,
        status: rest.status,
      })
      .eq("id", id)
      .eq("seller_id", userId)
      .select()
      .single();
    if (error) throw error;
    return { product };
  });

export const setProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), status: z.enum(["draft", "published"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("products")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("seller_id", userId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", data.id)
      .eq("seller_id", userId);
    if (error) throw error;
    return { ok: true };
  });
