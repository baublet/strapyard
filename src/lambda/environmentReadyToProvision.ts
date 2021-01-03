require("@babel/polyfill/noConflict");
require("dotenv").config();
require("source-map-support").install();

import { APIGatewayEvent } from "aws-lambda";

import { log } from "../common/logger";
import { base64Encode } from "./common/base64Encode";
import { getDatabaseConnection } from "./common/db";
import { enqueueJob } from "./common/enqueueJob";
import { getBySecret, update } from "./common/environment";
import { create } from "./common/environmentCommand";
import { getById } from "./common/sshKey";

// Called by a box when it's up and starts running our provisioning scripts
export const handler = async (event: APIGatewayEvent) => {
  const body = JSON.parse(event.body);
  const db = getDatabaseConnection();
  const secret = event.headers.authorization;

  if (!secret) {
    log.error("EnvironmentReadyToProvision did not receive a secret");
    return {
      statusCode: 403,
    };
  }

  // Check if the environment exists
  const environment = await getBySecret(db, secret);

  if (!environment) {
    log.error(
      `EnvironmentReadyToProvision received invalid environment secret (not found)`,
      { secret }
    );
    return {
      statusCode: 404,
    };
  }

  const sshKey = await getById(db, environment.sshKeyId, ["privateKey"]);

  // Make sure they're not in the wrong status for some reason
  if (environment.lifecycleStatus !== "creating") {
    log.error(
      `EnvironmentReadyToProvision request received for environment that's not in the proper status`,
      { environment }
    );
    return {
      statusCode: 400,
    };
  }

  // Update the environment in the database
  try {
    await db.transaction(async (trx) => {
      await update(trx, environment.id, {
        lifecycleStatus: "provisioning",
      });

      // Add an initial command, for test purposes
      const environmentCommand = await create(trx, {
        command: `eval $(ssh-agent -s)
&& (echo "${base64Encode(sshKey.privateKey)}" | base64 -d) >> ~/.ssh/strapyard
&&  ssh-add ~/.ssh/strapyard`,
        environmentId: environment.id,
        title: "Admin Only: Insert SSH Key",
        adminOnly: true,
        status: "running",
      });

      await enqueueJob(trx, "sendCommand", {
        environmentCommandId: environmentCommand.commandId,
      });
    });
  } catch (e) {
    log.error("Error adding initial command", {
      message: e.message,
      stack: e.stack,
    });
  }

  log.debug("Updated environment to provisioning", { environment });

  return {
    statusCode: 200,
  };
};
