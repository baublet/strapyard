import {
  ServiceContainer,
  createServiceContainer,
} from "@baublet/service-container";
import { ContextFunction } from "apollo-server-core";
import { Request, Response } from "express";

import { authenticateRequest } from "./authentication/authenticateRequest";
import { log } from "./config/log";
import { UserEntity } from "./dataServices/user";
export { UserAccountEntity } from "./dataServices/userAccount";
import { getClientId } from "./helpers";

export interface Context {
  destroy: () => Promise<void>;
  getClientId: () => string;
  getCurrentUser: <T extends boolean | undefined>(
    orThrow?: T
  ) => T extends false | undefined ? UserEntity | undefined : UserEntity;
  getCurrentUserId: <T extends boolean>(
    orThrow?: T
  ) => T extends false ? string | undefined : string;
  getCurrentUserAccountId: <T extends boolean | undefined>(
    orThrow?: T
  ) => T extends false | undefined ? string | undefined : string;
  setCurrentUserAccount: (userAccountId: UserAccountEntity) => void;
  getCurrentUserAccount: <T extends boolean | undefined>(
    orThrow?: T
  ) => T extends false | undefined
    ? UserAccountEntity | undefined
    : UserAccountEntity;
  setCurrentUser: (user?: UserEntity) => void;
  services: ServiceContainer;
  setCookie: (
    key: string,
    value: string | undefined,
    options?: {
      expires?: Date;
    }
  ) => void;
  getCookies: () => Map<string, { value: string | undefined; options: any }>;
  getResponse: () => Response | undefined;
  setResponse: (response: Response) => void;
  getRequest: () => Request | undefined;
  setRequest: (request: Request) => void;
  toString: () => string;
  toJSON: () => any;
}

export function createContext(
  {
    clientId,
    currentUser,
    services = createServiceContainer(),
    currentUserAccount,
  }: Partial<Context> & {
    clientId: string;
    currentUser?: UserEntity;
    currentUserAccount?: UserAccountEntity;
  } = {
    clientId: "no-client-hash-set",
  }
): Context {
  const cookiesToSet = new Map<
    string,
    { value: string | undefined; options: any }
  >();
  let contextResponse: Response;
  let contextRequest: Request;

  let currentUserRecord: UserEntity | undefined = Object.assign(
    {},
    currentUser
  );
  let userAccount = currentUserAccount;

  const context: Context = {
    destroy: async () => {
      const serviceArray = services.getAll();
      await Promise.all(
        serviceArray.map(async ({ service, factory }) => {
          if (factory === contextService) {
            // Don't let the context factory destroy itself (this creates an infinite loop!)
            return;
          }
          const resolvedService = await service;
          if (isServiceWithDestroyFunction(resolvedService)) {
            return resolvedService.destroy();
          }
        })
      );
    },
    getCurrentUserAccountId: (orThrow?: boolean) => {
      if (orThrow && !userAccount) {
        throw new Error("No current user account set");
      }
      return userAccount?.id || "robot";
    },
    getCurrentUserAccount: <T extends boolean | undefined>(orThrow?: T) => {
      const currentUserAccount = userAccount;
      if (!currentUserAccount && orThrow) {
        throw new Error("Not logged in");
      }
      return currentUserAccount as T extends false | undefined
        ? UserAccountEntity | undefined
        : UserAccountEntity;
    },
    setCurrentUserAccount: (newUserAccount?: UserAccountEntity) =>
      (userAccount = newUserAccount),
    getClientId: () => clientId,
    getCookies: () => cookiesToSet,
    getRequest: () => contextRequest,
    getResponse: () => contextResponse,
    getCurrentUser: <T extends boolean | undefined>(orThrow?: T) => {
      const currentUser = currentUserRecord;
      if (!currentUser && orThrow) {
        throw new Error("Not logged in");
      }
      return currentUser as T extends false | undefined
        ? UserEntity | undefined
        : UserEntity;
    },
    getCurrentUserId: (orThrow?: boolean) => {
      const currentUserId = currentUserRecord?.id;
      if (!currentUserId && orThrow) {
        throw new Error("Not logged in");
      }
      return currentUserId || "robot";
    },
    setCurrentUser: (currentUser?: UserEntity) =>
      (currentUserRecord = currentUser),
    services,
    setCookie: (key, value, options) =>
      cookiesToSet.set(key, { value, options }),
    setRequest: (request) => (contextRequest = request),
    setResponse: (response) => (contextResponse = response),
    toJSON: () => ({ clientId }),
    toString: () => clientId,
  };

  services.set(contextService, context);

  return context;
}

export const createGraphqlContext: ContextFunction<
  {
    req: Request;
    res: Response;
  },
  Context
> = async ({ req, res }) => {
  const token = req.cookies?.w8mngr;
  const clientId = getClientId(req, res);

  const context = createContext({
    clientId,
  });

  context.setResponse(res);
  context.setRequest(req);

  log("debug", "New request", {
    token,
    clientId,
    cookies: req.cookies,
    headers: req.headers,
  });

  const authenticationResult = await authenticateRequest(req, context);

  if (authenticationResult) {
    context.setCurrentUser(authenticationResult.user);
    context.setCurrentUserAccount(authenticationResult.userAccount);
  }

  return context;
};

export function contextService(serviceContainer: ServiceContainer): Context {
  if (serviceContainer.has(contextService)) {
    return serviceContainer.get(contextService);
  }
  throw new Error("Context service container not properly initialized!");
}

function isServiceWithDestroyFunction(
  value: unknown
): value is { destroy: () => Promise<void> } {
  if (typeof value !== "object") {
    return false;
  }

  const anyValue: any = value;
  if (typeof anyValue.destroy !== "function") {
    return false;
  }

  return true;
}
