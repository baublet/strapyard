import { ExternalEnvironmentHandler } from "../index";
import { log } from "../../../../common/logger";
import { digitalOceanApi } from "./digitalOceanApi";

export const shutdownEnvironment: ExternalEnvironmentHandler["shutdownEnvironment"] = async (
  environment,
  environmentDomainRecords
) => {
  log.info("Destroying a DigitalOcean environment and its domain records", {
    environment: environment.name,
    environmentDomainRecords,
  });

  const dropAction = await digitalOceanApi<{
    id: string;
    status: "in-progress" | "completed" | "errored";
  }>({
    path: `droplets/${environment.sourceId}/actions`,
    method: "post",
    body: {
      type: "shutdown",
    },
  });

  // Delete the domain records. When we recreate the environment, it'll have a new IP
  await Promise.all(
    environmentDomainRecords.map((record) =>
      digitalOceanApi({
        path: `domains/${process.env.STRAPYARD_DOMAIN}/records/${record.providerId}`,
        method: "delete",
        expectJson: false,
      })
    )
  );

  return dropAction;
};
