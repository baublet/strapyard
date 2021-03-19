import React from "react";
import cx from "classnames";

import type { EnvironmentSize } from "../../lambda/common/entities/environment";

import {
  useEnvironmentDetails,
  EnvironmentLifecycleStatus,
} from "./useEnvironmentDetails";
import { EnvironmentLogs } from "./EnvironmentLogs";

import { H3 } from "../components/H3";
import { RightNavigationLayout } from "../components/RightNavigationLayout";
import { EnvironmentActions } from "./EnvironmentActions";
import { EnvironmentBuilding } from "./EnvironmentBuilding";
import { MachineSize } from "../components/MachineSize";
import { Link } from "../components/Link";
import { Loader } from "../components/Loader";

interface EnvironmentProps {
  id: string;
}

const StatusMap: Record<
  EnvironmentLifecycleStatus,
  "red" | "green" | "yellow" | "gray"
> = {
  creating: "yellow",
  error_provisioning: "red",
  finished_provisioning: "yellow",
  new: "yellow",
  provisioning: "yellow",
  ready: "green",
  snapshotting: "yellow",
  starting: "yellow",
  starting_from_snapshot: "yellow",
  stopped: "green",
  stopping: "yellow",
};

const StatusClassNames: Record<"red" | "green" | "yellow" | "gray", string> = {
  gray: "bg-gray-300",
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500 animate-pulse",
};

export function Environment({ id }: EnvironmentProps) {
  const { loading, environment } = useEnvironmentDetails(id);

  if (loading || !environment) {
    return <Loader />;
  }

  const hasLogs = Boolean(environment && environment.logs);

  return (
    <div>
      <RightNavigationLayout
        navigation={<EnvironmentActions environment={environment} />}
        content={
          <>
            <div className="mb-4 flex">
              <div
                className={cx(
                  "rounded-full p-2 inline-block w-16 mr-6 text-white",
                  StatusClassNames[StatusMap[environment.lifecycleStatus]]
                )}
              >
                <MachineSize size={environment.size as EnvironmentSize} />
              </div>
              <div className="flex flex-col">
                <H3>{environment?.name || ""}</H3>
                <span>
                  <Link to={environment.repositoryHttpUrl} external={true}>
                    {environment.repositoryUrl}
                  </Link>
                </span>
              </div>
            </div>
            <b>Status:</b> {environment.lifecycleStatus}
          </>
        }
      />
      {!hasLogs ? (
        <EnvironmentBuilding />
      ) : (
        <div className="mt-4">
          <EnvironmentLogs
            environmentId={environment?.id}
            startupLogs={environment?.logs?.startupLogs || ""}
            commands={environment?.logs?.commands || []}
          />
        </div>
      )}
    </div>
  );
}
