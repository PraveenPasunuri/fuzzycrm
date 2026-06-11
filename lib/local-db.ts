import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

type Row = Record<string, any>;
type Store = Record<string, Row[]>;
type Filter = { op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in"; column: string; value: any };

const dbPath = path.join(process.cwd(), "data", "local-db.json");

const seed: Store = {
  clients: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      client_number: 1001,
      host_name: "Praveen Pasunuri",
      contact_no: "5551234567",
      email: "praveen@example.com",
      event_type: "Wedding",
      event_date: "2026-08-15",
      quoted_hours: 8,
      quoted_price: 250,
      no_of_events: 2,
      city: "Dallas",
      total_price: 2000,
      advance_paid: 500,
      balance_due: 1500,
      deliverables_summary: "Edited Photos, Highlight Video, Album",
      data_backup: "Google Drive",
      status: "Confirmed",
      address: "Dallas, TX",
      notes: "Local demo client",
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-01T10:00:00.000Z"
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      client_number: 1002,
      host_name: "Anika Sharma",
      contact_no: "5559876543",
      email: "anika@example.com",
      event_type: "Birthday",
      event_date: "2026-07-20",
      quoted_hours: 4,
      quoted_price: 200,
      no_of_events: 1,
      city: "Austin",
      total_price: 800,
      advance_paid: 0,
      balance_due: 800,
      deliverables_summary: "Edited Photos, Reel",
      data_backup: "Pending",
      status: "Pending",
      address: "Austin, TX",
      notes: "",
      created_at: "2026-06-03T10:00:00.000Z",
      updated_at: "2026-06-03T10:00:00.000Z"
    }
  ],
  team_members: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Rahul Photo",
      role: "Shooter",
      designation: "Photo Shooter",
      contact_no: "5552223333",
      email: "rahul@example.com",
      specialty: "Wedding photography",
      total_hours_worked: 18,
      payment_terms: "Per event",
      notes: "",
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-01T10:00:00.000Z"
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Meera Edits",
      role: "Editor",
      designation: "Photo Editor",
      contact_no: "5554445555",
      email: "meera@example.com",
      specialty: "Photo Editing",
      total_hours_worked: 0,
      payment_terms: "Per project",
      notes: "",
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-01T10:00:00.000Z"
    }
  ],
  events: [
    {
      id: "55555555-5555-4555-8555-555555555555",
      client_id: "11111111-1111-4111-8111-111111111111",
      event_name: "Wedding Ceremony",
      event_type: "Wedding",
      event_date: "2026-08-15",
      start_time: "09:00",
      end_time: "17:00",
      location: "Dallas Convention Center",
      photo_shooter_id: "33333333-3333-4333-8333-333333333333",
      video_shooter_id: null,
      requirement: "Photo and video coverage",
      photo_data_uploaded: "Pending",
      video_data_uploaded: "Pending",
      total_hours: 8,
      status: "Booked",
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-01T10:00:00.000Z"
    },
    {
      id: "66666666-6666-4666-8666-666666666666",
      client_id: "11111111-1111-4111-8111-111111111111",
      event_name: "Reception",
      event_type: "Wedding",
      event_date: "2026-08-16",
      start_time: "18:00",
      end_time: "22:00",
      location: "Dallas Ballroom",
      photo_shooter_id: null,
      video_shooter_id: null,
      requirement: "Candid photo, highlight video",
      photo_data_uploaded: "Pending",
      video_data_uploaded: "Pending",
      total_hours: 4,
      status: "Booked",
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-01T10:00:00.000Z"
    }
  ],
  deliverables: [
    {
      id: "77777777-7777-4777-8777-777777777777",
      client_id: "11111111-1111-4111-8111-111111111111",
      event_id: "55555555-5555-4555-8555-555555555555",
      deliverable_type: "Edited Photos",
      description: "Wedding ceremony edited gallery",
      due_date: "2026-09-01",
      delivery_link: "",
      status: "Pending",
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-01T10:00:00.000Z"
    }
  ],
  editing_tasks: [
    {
      id: "88888888-8888-4888-8888-888888888888",
      client_id: "11111111-1111-4111-8111-111111111111",
      event_id: "55555555-5555-4555-8555-555555555555",
      task_type: "Photo Editing",
      photo_editor_id: "44444444-4444-4444-8444-444444444444",
      video_editor_id: null,
      assigned_date: "2026-08-17",
      submitted_date: null,
      expected_delivery_date: "2026-08-25",
      delivery_date: "2026-08-25",
      editor_payment: 250,
      source_file_link: "https://drive.google.com",
      output_file_link: "",
      status: "Assigned",
      review_notes: "",
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-01T10:00:00.000Z"
    }
  ]
};

function ensureDb() {
  const dir = path.dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(dbPath)) writeFileSync(dbPath, JSON.stringify(seed, null, 2));
}

function readStore(): Store {
  ensureDb();
  return JSON.parse(readFileSync(dbPath, "utf8")) as Store;
}

function writeStore(store: Store) {
  ensureDb();
  writeFileSync(dbPath, JSON.stringify(store, null, 2));
}

function relationFor(field: string) {
  if (field === "client_id") return "clients";
  if (field === "event_id") return "events";
  if (["photo_shooter_id", "video_shooter_id", "photo_editor_id", "video_editor_id"].includes(field)) return "team_members";
  return field.replace(/_id$/, "s");
}

function parseRelations(select?: string) {
  if (!select) return [];
  const matches = select.matchAll(/([a-z_]+):([a-z_]+)\(([^)]*)\)/g);
  return Array.from(matches).map((match) => ({
    alias: match[1],
    field: match[2],
    columns: match[3].split(",").map((column) => column.trim())
  }));
}

function pick(row: Row, columns: string[]) {
  if (!columns.length || columns.includes("*")) return { ...row };
  return Object.fromEntries(columns.map((column) => [column, row[column]]));
}

function compare(left: any, right: any) {
  if (typeof left === "number" || typeof right === "number") return Number(left) - Number(right);
  return String(left ?? "").localeCompare(String(right ?? ""));
}

function matches(row: Row, filter: Filter) {
  const value = row[filter.column];
  if (filter.op === "eq") return value === filter.value;
  if (filter.op === "neq") return value !== filter.value;
  if (filter.op === "gt") return value > filter.value;
  if (filter.op === "gte") return value >= filter.value;
  if (filter.op === "lt") return value < filter.value;
  if (filter.op === "lte") return value <= filter.value;
  if (filter.op === "in") return Array.isArray(filter.value) && filter.value.includes(value);
  return true;
}

class LocalQuery {
  private columns = "*";
  private count: "exact" | null = null;
  private head = false;
  private filters: Filter[] = [];
  private orderColumn: string | null = null;
  private ascending = true;
  private mutation: "insert" | "update" | "delete" | null = null;
  private payload: Row | null = null;

  constructor(private table: string) {}

  select(columns = "*", options?: { count?: "exact"; head?: boolean }) {
    this.columns = columns;
    this.count = options?.count ?? null;
    this.head = options?.head ?? false;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderColumn = column;
    this.ascending = options?.ascending ?? true;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ op: "eq", column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ op: "neq", column, value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ op: "gt", column, value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ op: "gte", column, value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ op: "lt", column, value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ op: "lte", column, value });
    return this;
  }

  in(column: string, value: any[]) {
    this.filters.push({ op: "in", column, value });
    return this;
  }

  insert(payload: Row) {
    this.mutation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Row) {
    this.mutation = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.mutation = "delete";
    return this;
  }

  then(resolve: (value: any) => void, reject: (reason?: any) => void) {
    return this.execute().then(resolve, reject);
  }

  private async execute() {
    const store = readStore();
    store[this.table] ??= [];

    if (this.mutation) {
      const now = new Date().toISOString();
      if (this.mutation === "insert" && this.payload) {
        const row = { id: crypto.randomUUID(), ...this.payload, created_at: now, updated_at: now };
        store[this.table].push(row);
        writeStore(store);
        return { data: [row], error: null };
      }

      if (this.mutation === "update" && this.payload) {
        const rows = store[this.table].map((row) =>
          this.filters.every((filter) => matches(row, filter)) ? { ...row, ...this.payload, updated_at: now } : row
        );
        store[this.table] = rows;
        writeStore(store);
        return { data: rows, error: null };
      }

      if (this.mutation === "delete") {
        store[this.table] = store[this.table].filter((row) => !this.filters.every((filter) => matches(row, filter)));
        writeStore(store);
        return { data: null, error: null };
      }
    }

    let rows = [...store[this.table]].filter((row) => this.filters.every((filter) => matches(row, filter)));
    if (this.orderColumn) {
      rows.sort((a, b) => compare(a[this.orderColumn!], b[this.orderColumn!]) * (this.ascending ? 1 : -1));
    }

    const count = this.count === "exact" ? rows.length : null;
    if (this.head) return { data: null, count, error: null };

    const relationSpecs = parseRelations(this.columns);
    const ownColumns = this.columns
      .split(",")
      .map((column) => column.trim())
      .filter((column) => column && column === "*" || !column.includes("("));

    rows = rows.map((row) => {
      const result = pick(row, ownColumns);
      for (const relation of relationSpecs) {
        const relationTable = relationFor(relation.field);
        const related = store[relationTable]?.find((item) => item.id === row[relation.field]) ?? null;
        result[relation.alias] = related ? pick(related, relation.columns) : null;
      }
      return result;
    });

    return { data: rows, count, error: null };
  }
}

export function createLocalClient() {
  return {
    from(table: string) {
      return new LocalQuery(table);
    },
    auth: {
      async signOut() {
        return { error: null };
      }
    }
  };
}
