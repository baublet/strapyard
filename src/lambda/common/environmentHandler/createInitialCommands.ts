import { log } from "../../../common/logger";
import { Transaction } from "../db";
import { Environment } from "../environment";
import { create } from "../environmentCommand";

interface AddSSHKeyArguments {
  environment: Environment;
}

export async function createInitialCommands(
  trx: Transaction,
  { environment }: AddSSHKeyArguments
): Promise<void> {
  await create(trx, {
    command: `mkdir -p ~/project \
&& (cd ~/project; git clone ${environment.repositoryUrl})`,
    environmentId: environment.id,
    title: "Clone Repository",
    adminOnly: true,
    status: "waiting",
  });

  await create(trx, {
    command: `(curl -fsSL https://code-server.dev/install.sh | sh) \
&& sudo systemctl enable --now code-server@$USER`,
    environmentId: environment.id,
    title: "Install VS Code Server",
    adminOnly: true,
    status: "waiting",
  });

  await create(trx, {
    command: `( \
  echo "deb [trusted=yes] https://apt.fury.io/caddy/ /" \
    | sudo tee -a /etc/apt/sources.list.d/caddy-fury.list \
  )\
&& sudo apt update \
&& sudo apt install caddy \
&& echo "${environment.subdomain}.${process.env.STRAPYARD_DOMAIN} \
reverse_proxy 127.0.0.1:8080" > /etc/caddy/Caddyfile \
&& sudo systemctl reload caddy`,
    environmentId: environment.id,
    title: "Install Web Server",
    adminOnly: true,
    status: "waiting",
  });

  await create(trx, {
    command: `echo "bind-addr: 127.0.0.1:8080 \
auth: password \
password: aa82dd974de376d337fb0854 \
home: ${process.env.STRAPYARD_URL}/environment/${environment.subdomain} \
cert: false" > ~/.config/code-server/config.yaml \
&& sudo systemctl restart code-server@$USER`,
    environmentId: environment.id,
    title: "Configure Code Server",
    adminOnly: true,
    status: "waiting",
  });
}
