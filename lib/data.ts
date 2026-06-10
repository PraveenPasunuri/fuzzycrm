import { createClient } from "@/lib/supabase/server";
import { type ModuleConfig } from "@/lib/module-config";

export type Row = Record<string, any>;

export async function getModuleData(config: ModuleConfig) {
  const supabase = createClient();
  const relationSelect = config.relations
    ? Object.entries(config.relations).map(([field, relation]) => `${relation.table}:${field}(${relation.select})`)
    : [];

  const [{ data, error }, relationEntries] = await Promise.all([
    supabase
      .from(config.table)
      .select(["*", ...relationSelect].join(","))
      .order(config.orderBy, { ascending: config.orderBy.includes("date") }),
    getRelationOptions(config)
  ]);

  if (error) throw new Error(error.message);
  return { rows: data ?? [], relationOptions: relationEntries };
}

export async function getRelationOptions(config: ModuleConfig) {
  const supabase = createClient();
  const entries = await Promise.all(
    Object.entries(config.relations ?? {}).map(async ([field, relation]) => {
      const { data, error } = await supabase.from(relation.table).select(relation.select).order(relation.label);
      if (error) throw new Error(error.message);
      return [field, data ?? []] as const;
    })
  );

  return Object.fromEntries(entries);
}
