import { Environment } from "../entities";
import { log } from "../../../common/logger";
import { fetch } from "../fetch";

function isFetchableStatus(status: Environment["lifecycleStatus"]): boolean {
  if (status === "provisioning") return true;
  if (status === "starting") return true;
  return false;
}

export async function getEnvironmentStartupLogs(
  environment: Environment
): Promise<string | null> {
  if (!environment.ipv4) {
    log.warn(
      "Tried to get environment startup logs for an environment that doesn't have an IP!",
      { environment }
    );
    return null;
  }

  // Only ping the environment if it's in provisioning
  if (!isFetchableStatus(environment.lifecycleStatus)) {
    return "";
  }

  const response = await fetch(`http://${environment.ipv4}:8333/startupLogs`, {
    method: "get",
    headers: {
      authorization: environment.secret,
    },
    expectStatus: 200,
    timeoutMs: 500,
  });

  log.debug("Log response from environment for startup logs", {
    environment: environment.subdomain,
    responseBodyFirst50: response.bodyText.substr(0, 50),
    status: response.status,
  });

  return response.bodyText;
}
