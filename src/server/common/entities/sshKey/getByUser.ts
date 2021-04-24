import { SSHKey } from "./index";
import { ConnectionOrTransaction } from "../../db";

export async function getByUser(
  trx: ConnectionOrTransaction,
  userId: string,
  props: (keyof SSHKey)[] | "*" = "*"
): Promise<SSHKey | undefined> {
  const found = await trx<SSHKey>("sshKeys")
    .select(props)
    .where("userId", "=", userId)
    .limit(1);

  if (found.length > 0) {
    return found[0];
  }
  return undefined;
}
