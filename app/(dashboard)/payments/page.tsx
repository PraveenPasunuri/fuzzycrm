import { ModuleManager } from "@/components/module-manager";
import { getModuleData } from "@/lib/data";
import { modules } from "@/lib/module-config";

export default async function PaymentsPage() {
  const config = modules.payments;
  const data = await getModuleData(config);
  return <ModuleManager config={config} rows={data.rows} relationOptions={data.relationOptions} />;
}
