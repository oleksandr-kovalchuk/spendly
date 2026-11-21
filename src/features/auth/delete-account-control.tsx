import { hasPassword } from "./account.dal";
import { DeleteAccountButton } from "./delete-account-button";

export async function DeleteAccountControl() {
  return <DeleteAccountButton hasPassword={await hasPassword()} />;
}
