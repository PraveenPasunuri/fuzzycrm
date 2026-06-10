export type FieldType = "text" | "email" | "tel" | "date" | "time" | "number" | "textarea" | "select" | "url";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  relation?: string;
  placeholder?: string;
};

export type ModuleConfig = {
  slug: string;
  title: string;
  table: string;
  description: string;
  orderBy: string;
  searchFields: string[];
  statusField?: string;
  filterField?: string;
  displayField: string;
  columns: { key: string; label: string; type?: "currency" | "date" | "status" | "relation" }[];
  fields: FieldConfig[];
  relations?: Record<string, { table: string; label: string; select: string }>;
};

export const eventStatuses = ["Booked", "Shoot Completed", "Editing", "Delivered", "Closed"];
export const paymentStatuses = ["Not Paid", "Advance Paid", "Partially Paid", "Fully Paid"];
export const deliverableStatuses = ["Pending", "In Progress", "Delivered"];
export const editingStatuses = ["Not Assigned", "Assigned", "In Progress", "Sent For Review", "Changes Requested", "Completed"];

export const modules: Record<string, ModuleConfig> = {
  clients: {
    slug: "clients",
    title: "Clients",
    table: "clients",
    description: "Manage client contacts, addresses, and notes.",
    orderBy: "created_at",
    searchFields: ["name", "phone", "email", "address"],
    displayField: "name",
    columns: [
      { key: "name", label: "Client" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "created_at", label: "Created", type: "date" }
    ],
    fields: [
      { name: "name", label: "Client name", type: "text", required: true },
      { name: "phone", label: "Phone", type: "tel" },
      { name: "email", label: "Email", type: "email" },
      { name: "address", label: "Address", type: "textarea" },
      { name: "notes", label: "Notes", type: "textarea" }
    ]
  },
  events: {
    slug: "events",
    title: "Events",
    table: "events",
    description: "Track booked shoots, schedules, packages, and lifecycle status.",
    orderBy: "event_date",
    searchFields: ["event_name", "event_type", "location", "package_name", "clients.name"],
    statusField: "status",
    filterField: "status",
    displayField: "event_name",
    relations: {
      client_id: { table: "clients", label: "name", select: "id,name" }
    },
    columns: [
      { key: "event_name", label: "Event" },
      { key: "clients.name", label: "Client", type: "relation" },
      { key: "event_date", label: "Date", type: "date" },
      { key: "total_amount", label: "Total", type: "currency" },
      { key: "status", label: "Status", type: "status" }
    ],
    fields: [
      { name: "event_name", label: "Event name", type: "text", required: true },
      { name: "client_id", label: "Client", type: "select", relation: "client_id", required: true },
      { name: "event_type", label: "Event type", type: "text", required: true, placeholder: "Wedding, birthday, corporate..." },
      { name: "event_date", label: "Event date", type: "date", required: true },
      { name: "start_time", label: "Start time", type: "time" },
      { name: "end_time", label: "End time", type: "time" },
      { name: "location", label: "Location", type: "text" },
      { name: "package_name", label: "Package name", type: "text" },
      { name: "total_amount", label: "Total amount", type: "number" },
      { name: "status", label: "Status", type: "select", options: eventStatuses, required: true }
    ]
  },
  payments: {
    slug: "payments",
    title: "Payments",
    table: "payments",
    description: "Track advance payments, balances, due dates, and methods.",
    orderBy: "payment_due_date",
    searchFields: ["events.event_name", "payment_status", "payment_method", "notes"],
    statusField: "payment_status",
    filterField: "payment_status",
    displayField: "payment_status",
    relations: {
      event_id: { table: "events", label: "event_name", select: "id,event_name,total_amount" }
    },
    columns: [
      { key: "events.event_name", label: "Event", type: "relation" },
      { key: "total_amount", label: "Total", type: "currency" },
      { key: "advance_paid", label: "Advance", type: "currency" },
      { key: "balance_amount", label: "Balance", type: "currency" },
      { key: "payment_due_date", label: "Due", type: "date" },
      { key: "payment_status", label: "Status", type: "status" }
    ],
    fields: [
      { name: "event_id", label: "Event", type: "select", relation: "event_id", required: true },
      { name: "total_amount", label: "Total amount", type: "number", required: true },
      { name: "advance_paid", label: "Advance paid", type: "number" },
      { name: "balance_amount", label: "Balance amount", type: "number" },
      { name: "payment_due_date", label: "Payment due date", type: "date" },
      { name: "payment_status", label: "Payment status", type: "select", options: paymentStatuses, required: true },
      { name: "payment_method", label: "Payment method", type: "text" },
      { name: "notes", label: "Notes", type: "textarea" }
    ]
  },
  deliverables: {
    slug: "deliverables",
    title: "Deliverables",
    table: "deliverables",
    description: "Track files and final delivery links for each event.",
    orderBy: "due_date",
    searchFields: ["events.event_name", "deliverable_type", "description", "delivery_link"],
    statusField: "status",
    filterField: "status",
    displayField: "deliverable_type",
    relations: {
      event_id: { table: "events", label: "event_name", select: "id,event_name" }
    },
    columns: [
      { key: "events.event_name", label: "Event", type: "relation" },
      { key: "deliverable_type", label: "Type" },
      { key: "due_date", label: "Due", type: "date" },
      { key: "delivery_link", label: "Link" },
      { key: "status", label: "Status", type: "status" }
    ],
    fields: [
      { name: "event_id", label: "Event", type: "select", relation: "event_id", required: true },
      { name: "deliverable_type", label: "Deliverable type", type: "select", options: ["Raw Photos", "Edited Photos", "Highlight Video", "Full Video", "Reel", "Album", "YouTube Thumbnail"], required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "due_date", label: "Due date", type: "date" },
      { name: "delivery_link", label: "Google Drive / delivery link", type: "url" },
      { name: "status", label: "Status", type: "select", options: deliverableStatuses, required: true }
    ]
  },
  editors: {
    slug: "editors",
    title: "Editors",
    table: "editors",
    description: "Manage outsourced editor contacts, specialties, and terms.",
    orderBy: "created_at",
    searchFields: ["name", "phone", "email", "specialty", "payment_terms"],
    displayField: "name",
    columns: [
      { key: "name", label: "Editor" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "specialty", label: "Specialty" },
      { key: "payment_terms", label: "Payment terms" }
    ],
    fields: [
      { name: "name", label: "Editor name", type: "text", required: true },
      { name: "phone", label: "Phone", type: "tel" },
      { name: "email", label: "Email", type: "email" },
      { name: "specialty", label: "Specialty", type: "text" },
      { name: "payment_terms", label: "Payment terms", type: "text" },
      { name: "notes", label: "Notes", type: "textarea" }
    ]
  },
  "editing-tasks": {
    slug: "editing-tasks",
    title: "Editing Tasks",
    table: "editing_tasks",
    description: "Assign outsourced edits and track review status, file links, and payments.",
    orderBy: "expected_delivery_date",
    searchFields: ["events.event_name", "editors.name", "task_type", "source_file_link", "output_file_link", "review_notes"],
    statusField: "status",
    filterField: "status",
    displayField: "task_type",
    relations: {
      event_id: { table: "events", label: "event_name", select: "id,event_name" },
      editor_id: { table: "editors", label: "name", select: "id,name" }
    },
    columns: [
      { key: "events.event_name", label: "Event", type: "relation" },
      { key: "editors.name", label: "Editor", type: "relation" },
      { key: "task_type", label: "Task" },
      { key: "expected_delivery_date", label: "Expected", type: "date" },
      { key: "editor_payment", label: "Editor pay", type: "currency" },
      { key: "status", label: "Status", type: "status" }
    ],
    fields: [
      { name: "event_id", label: "Event", type: "select", relation: "event_id", required: true },
      { name: "editor_id", label: "Editor", type: "select", relation: "editor_id" },
      { name: "task_type", label: "Task type", type: "select", options: ["Photo Editing", "Video Editing", "Reel Editing", "Album Design"], required: true },
      { name: "assigned_date", label: "Assigned date", type: "date" },
      { name: "expected_delivery_date", label: "Expected delivery date", type: "date" },
      { name: "editor_payment", label: "Editor payment", type: "number" },
      { name: "source_file_link", label: "Source file link", type: "url" },
      { name: "output_file_link", label: "Output file link", type: "url" },
      { name: "status", label: "Status", type: "select", options: editingStatuses, required: true },
      { name: "review_notes", label: "Review notes", type: "textarea" }
    ]
  }
};
