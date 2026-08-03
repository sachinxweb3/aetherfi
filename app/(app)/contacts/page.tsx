import type { Metadata } from "next"
import { ContactsView } from "@/components/contacts/ContactsView"

export const metadata: Metadata = {
  title: "Address Book — AetherFI",
  description: "Save recipients for fast, safe USDC transfers on Arc Testnet. Contacts are stored only on your device — you review and sign every payment yourself.",
}

// /(app)/contacts — saved recipients (address book), inside the app shell.
export default function ContactsPage() {
  return <ContactsView />
}
