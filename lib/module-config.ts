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
export const clientStatuses = ["Inquiry", "Pending", "Waiting For Event Date", "Confirmed", "Completed", "Cancelled"];
export const paymentStatuses = ["Not Paid", "Advance Paid", "Partially Paid", "Fully Paid"];
export const deliverableStatuses = ["Pending", "In Progress", "Delivered"];
export const editingStatuses = ["Not Assigned", "Assigned", "In Progress", "Submitted For Editing", "Sent For Review", "Changes Requested", "Completed"];

export const modules: Record<string, ModuleConfig> = {
  clients: {
    slug: "clients",
    title: "Clients",
    table: "clients",
    description: "Manage client details, quote totals, advances, deliverables, backup, and status.",
    orderBy: "created_at",
    searchFields: ["client_number", "name", "phone", "email", "event_type", "city", "deliverables", "status"],
    statusField: "status",
    filterField: "status",
    displayField: "name",
    columns: [
      { key: "client_number", label: "Client ID" },
      { key: "name", label: "Client" },
      { key: "phone", label: "Phone" },
      { key: "event_type", label: "Event type" },
      { key: "event_date", label: "Event date", type: "date" },
      { key: "total_price", label: "Total", type: "currency" },
      { key: "balance_due", label: "Balance", type: "currency" },
      { key: "status", label: "Status", type: "status" }
    ],
    fields: [
      { name: "client_number", label: "Client ID", type: "number" },
      { name: "name", label: "Client name", type: "text", required: true },
      { name: "phone", label: "Contact no", type: "tel" },
      { name: "email", label: "Email", type: "email" },
      { name: "event_type", label: "Event type", type: "text" },
      { name: "event_date", label: "Event date", type: "date" },
      { name: "quoted_hours", label: "Quoted hours", type: "number" },
      { name: "quoted_price", label: "Quoted price", type: "number" },
      { name: "no_of_events", label: "No of events", type: "number" },
      { name: "city", label: "City", type: "text" },
      { name: "total_price", label: "Total price", type: "number" },
      { name: "advance_paid", label: "Advance paid", type: "number" },
      { name: "balance_due", label: "Balance due", type: "number" },
      { name: "deliverables", label: "Deliverables", type: "text", placeholder: "Photos, video, reel..." },
      { name: "data_backup", label: "Data backup", type: "text", placeholder: "Yes, hard disk, cloud..." },
      { name: "status", label: "Status", type: "select", options: clientStatuses },
      { name: "address", label: "Address", type: "textarea" },
      { name: "notes", label: "Notes", type: "textarea" }
    ]
  },
  events: {
    slug: "events",
    title: "Events",
    table: "events",
    description: "Track event schedule, location, shooters, requirements, data uploads, and hours.",
    orderBy: "event_date",
    searchFields: ["event_name", "event_type", "location", "photo_shooter_assigned", "video_shooter_assigned", "requirement", "clients.name"],
    statusField: "status",
    filterField: "status",
    displayField: "event_name",
    relations: {
      client_id: { table: "clients", label: "name", select: "id,name,phone,client_number" }
    },
    columns: [
      { key: "event_name", label: "Event" },
      { key: "clients.name", label: "Client", type: "relation" },
      { key: "event_date", label: "Date", type: "date" },
      { key: "photo_shooter_assigned", label: "Photo shooter" },
      { key: "video_shooter_assigned", label: "Video shooter" },
      { key: "total_hours", label: "Hours" },
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
      { name: "photo_shooter_assigned", label: "Photo shooter assigned", type: "text" },
      { name: "video_shooter_assigned", label: "Video shooter assigned", type: "text" },
      { name: "requirement", label: "Requirement", type: "textarea", placeholder: "Photo, video, reel..." },
      { name: "photo_data_uploaded", label: "Photo data uploaded", type: "text", placeholder: "Hard disk, Drive, WeTransfer..." },
      { name: "video_data_uploaded", label: "Video data uploaded", type: "text", placeholder: "Hard disk, Drive, WeTransfer..." },
      { name: "total_hours", label: "Total hours", type: "number" },
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
    title: "Team",
    table: "editors",
    description: "Manage photographers, videographers, editors, and total hours worked.",
    orderBy: "created_at",
    searchFields: ["name", "phone", "email", "designation", "specialty", "payment_terms"],
    displayField: "name",
    columns: [
      { key: "name", label: "Name" },
      { key: "designation", label: "Designation" },
      { key: "phone", label: "Phone" },
      { key: "specialty", label: "Specialty" },
      { key: "total_hours_worked", label: "Hours worked" }
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "designation", label: "Designation", type: "text", placeholder: "Photo, Video, Photo Editor..." },
      { name: "phone", label: "Contact no", type: "tel" },
      { name: "email", label: "Email", type: "email" },
      { name: "specialty", label: "Specialty", type: "text" },
      { name: "total_hours_worked", label: "Total no of hours worked", type: "number" },
      { name: "payment_terms", label: "Payment terms", type: "text" },
      { name: "notes", label: "Notes", type: "textarea" }
    ]
  },
  "editing-tasks": {
    slug: "editing-tasks",
    title: "Editing Tasks",
    table: "editing_tasks",
    description: "Track client editing assignments, submitted dates, delivery dates, review notes, and files.",
    orderBy: "expected_delivery_date",
    searchFields: ["clients.name", "events.event_name", "editors.name", "task_type", "photo_editor_assigned", "video_editor_assigned", "source_file_link", "output_file_link", "review_notes"],
    statusField: "status",
    filterField: "status",
    displayField: "task_type",
    relations: {
      client_id: { table: "clients", label: "name", select: "id,name,client_number" },
      event_id: { table: "events", label: "event_name", select: "id,event_name" },
      editor_id: { table: "editors", label: "name", select: "id,name" }
    },
    columns: [
      { key: "clients.name", label: "Client", type: "relation" },
      { key: "events.event_name", label: "Event", type: "relation" },
      { key: "photo_editor_assigned", label: "Photo editor" },
      { key: "video_editor_assigned", label: "Video editor" },
      { key: "submitted_date", label: "Submitted", type: "date" },
      { key: "delivery_date", label: "Delivery", type: "date" },
      { key: "status", label: "Status", type: "status" }
    ],
    fields: [
      { name: "client_id", label: "Client", type: "select", relation: "client_id" },
      { name: "event_id", label: "Event", type: "select", relation: "event_id" },
      { name: "editor_id", label: "Editor", type: "select", relation: "editor_id" },
      { name: "task_type", label: "Task type", type: "select", options: ["Photo Editing", "Video Editing", "Reel Editing", "Album Design"], required: true },
      { name: "photo_editor_assigned", label: "Photo editor assigned", type: "text" },
      { name: "video_editor_assigned", label: "Video editor assigned", type: "text" },
      { name: "assigned_date", label: "Assigned date", type: "date" },
      { name: "submitted_date", label: "Submitted date", type: "date" },
      { name: "delivery_date", label: "Delivery date", type: "date" },
      { name: "expected_delivery_date", label: "Expected delivery date", type: "date" },
      { name: "editor_payment", label: "Editor payment", type: "number" },
      { name: "source_file_link", label: "Source file link", type: "url" },
      { name: "output_file_link", label: "Output file link", type: "url" },
      { name: "status", label: "Status", type: "select", options: editingStatuses, required: true },
      { name: "review_notes", label: "Review notes", type: "textarea" }
    ]
  }
};
