import React from "react";

import { useCurrentUserEnvironments } from "../useCurrentUserEnvironments";
import { H3 } from "../components/H3";
import { Loader } from "../components/Loader";
import { EnvironmentCard } from "../EnvironmentCard";

export function Environment() {
  const { loading, environments } = useCurrentUserEnvironments();

  return (
    <div>
      <H3>Environments</H3>
      <Loader display={loading} />
      <ul>
        {environments.map((env) => (
          <EnvironmentCard environment={env} />
        ))}
      </ul>
    </div>
  );
}
