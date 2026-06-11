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
  relations?: Record<string, { table: string; label: string; select: string; alias?: string }>;
};

export const eventStatuses = ["Booked", "Shoot Completed", "Editing", "Delivered", "Closed"];
export const clientStatuses = ["Inquiry", "Pending", "Waiting For Event Date", "Confirmed", "Completed", "Cancelled"];
export const deliverableStatuses = ["Pending", "In Progress", "Delivered"];
export const editingStatuses = ["Not Assigned", "Assigned", "In Progress", "Submitted For Editing", "Sent For Review", "Changes Requested", "Completed"];

export const modules: Record<string, ModuleConfig> = {
  clients: {
    slug: "clients",
    title: "Clients",
    table: "clients",
    description: "Manage client details, quote totals, advances, deliverables, backup, and status.",
    orderBy: "created_at",
    searchFields: ["client_number", "host_name", "contact_no", "email", "event_type", "city", "deliverables_summary", "status"],
    statusField: "status",
    filterField: "status",
    displayField: "host_name",
    columns: [
      { key: "client_number", label: "Client ID" },
      { key: "host_name", label: "Host" },
      { key: "contact_no", label: "Contact" },
      { key: "event_type", label: "Event type" },
      { key: "event_date", label: "Event date", type: "date" },
      { key: "total_price", label: "Total", type: "currency" },
      { key: "balance_due", label: "Balance", type: "currency" },
      { key: "status", label: "Status", type: "status" }
    ],
    fields: [
      { name: "client_number", label: "Client ID", type: "number" },
      { name: "host_name", label: "Host name", type: "text", required: true },
      { name: "contact_no", label: "Contact no", type: "tel" },
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
      { name: "deliverables_summary", label: "Deliverables", type: "text", placeholder: "Photos, video, reel..." },
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
    searchFields: ["event_name", "event_type", "location", "photo_shooter.name", "video_shooter.name", "requirement", "clients.host_name"],
    statusField: "status",
    filterField: "status",
    displayField: "event_name",
    relations: {
      client_id: { table: "clients", label: "host_name", select: "id,host_name,contact_no,client_number" },
      photo_shooter_id: { table: "team_members", alias: "photo_shooter", label: "name", select: "id,name,role" },
      video_shooter_id: { table: "team_members", alias: "video_shooter", label: "name", select: "id,name,role" }
    },
    columns: [
      { key: "event_name", label: "Event" },
      { key: "clients.host_name", label: "Client", type: "relation" },
      { key: "event_date", label: "Date", type: "date" },
      { key: "photo_shooter.name", label: "Photo shooter", type: "relation" },
      { key: "video_shooter.name", label: "Video shooter", type: "relation" },
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
      { name: "photo_shooter_id", label: "Photo shooter assigned", type: "select", relation: "photo_shooter_id" },
      { name: "video_shooter_id", label: "Video shooter assigned", type: "select", relation: "video_shooter_id" },
      { name: "requirement", label: "Requirement", type: "textarea", placeholder: "Photo, video, reel..." },
      { name: "photo_data_uploaded", label: "Photo data uploaded", type: "text", placeholder: "Hard disk, Drive, WeTransfer..." },
      { name: "video_data_uploaded", label: "Video data uploaded", type: "text", placeholder: "Hard disk, Drive, WeTransfer..." },
      { name: "total_hours", label: "Total hours", type: "number" },
      { name: "status", label: "Status", type: "select", options: eventStatuses, required: true }
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
    table: "team_members",
    description: "Manage photographers, videographers, editors, and total hours worked.",
    orderBy: "created_at",
    searchFields: ["name", "role", "contact_no", "email", "designation", "specialty", "payment_terms"],
    displayField: "name",
    columns: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "designation", label: "Designation" },
      { key: "contact_no", label: "Contact" },
      { key: "specialty", label: "Specialty" },
      { key: "total_hours_worked", label: "Hours worked" }
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "role", label: "Role", type: "select", options: ["Shooter", "Editor", "Both"], required: true },
      { name: "designation", label: "Designation", type: "text", placeholder: "Photo, Video, Photo Editor..." },
      { name: "contact_no", label: "Contact no", type: "tel" },
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
    searchFields: ["clients.host_name", "events.event_name", "photo_editor.name", "video_editor.name", "task_type", "source_file_link", "output_file_link", "review_notes"],
    statusField: "status",
    filterField: "status",
    displayField: "task_type",
    relations: {
      client_id: { table: "clients", label: "host_name", select: "id,host_name,client_number" },
      event_id: { table: "events", label: "event_name", select: "id,event_name" },
      photo_editor_id: { table: "team_members", alias: "photo_editor", label: "name", select: "id,name,role" },
      video_editor_id: { table: "team_members", alias: "video_editor", label: "name", select: "id,name,role" }
    },
    columns: [
      { key: "clients.host_name", label: "Client", type: "relation" },
      { key: "events.event_name", label: "Event", type: "relation" },
      { key: "photo_editor.name", label: "Photo editor", type: "relation" },
      { key: "video_editor.name", label: "Video editor", type: "relation" },
      { key: "submitted_date", label: "Submitted", type: "date" },
      { key: "delivery_date", label: "Delivery", type: "date" },
      { key: "status", label: "Status", type: "status" }
    ],
    fields: [
      { name: "client_id", label: "Client", type: "select", relation: "client_id" },
      { name: "event_id", label: "Event", type: "select", relation: "event_id" },
      { name: "task_type", label: "Task type", type: "select", options: ["Photo Editing", "Video Editing", "Reel Editing", "Album Design"], required: true },
      { name: "photo_editor_id", label: "Photo editor assigned", type: "select", relation: "photo_editor_id" },
      { name: "video_editor_id", label: "Video editor assigned", type: "select", relation: "video_editor_id" },
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
