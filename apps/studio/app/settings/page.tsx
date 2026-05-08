import { redirect } from "next/navigation";

export default function SettingsPage() {
  redirect("/assets?section=api-key");
}
