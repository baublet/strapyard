import { ProviderSSHKey } from "./index";
import { ConnectionOrTransaction } from "../db";

type GetSSHKeyInput = Pick<ProviderSSHKey, "user" | "userSource" | "source">;

export async function get(
  trx: ConnectionOrTransaction,
  input: GetSSHKeyInput
): Promise<ProviderSSHKey | undefined> {
  const found = await trx<ProviderSSHKey>("providerSSHKeys")
    .select()
    .where("source", "=", input.source)
    .andWhere("user", "=", input.userSource)
    .andWhere("userSource", "=", input.userSource)
    .limit(1);
  if (!found.length) {
    return undefined;
  }
  return found[0];
}
