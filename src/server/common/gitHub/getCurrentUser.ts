import { log } from "../../../common/logger";
import { githubApi } from "./githubApi";
import { Context } from "../context";

interface GitHubUserResponse {
  id: number;
  avatar_url: string;
  html_url: string;
  repos_url: string;
  name: string;
  email: string;
  public_repos: number;
}

export interface GitHubUser {
  [key: string]: any;
  id: string;
  avatar: string;
  bioUrl: string;
  reposUrl: string;
  name: string;
  email: string;
  publicRepos: number;
}

export async function getCurrentUser(
  context: Pick<Context, "cache" | "accessToken">
): Promise<GitHubUser | null> {
  const accessToken = context.accessToken;
  if (!accessToken) {
    return null;
  }

  const gitHubUserCache = context.cache.gitHubUserCache;
  const cachedUser = await gitHubUserCache.get(accessToken);

  if (!cachedUser) {
    const fetchResponse = (await githubApi({
      path: "user",
      accessToken,
    })) as GitHubUserResponse;

    log.debug("GitHub user fetch res: ", fetchResponse);

    if (!fetchResponse.id) {
      return null;
    }

    const userData: GitHubUser = {
      id: fetchResponse.id?.toString(),
      avatar: fetchResponse.avatar_url,
      bioUrl: fetchResponse.html_url,
      reposUrl: fetchResponse.repos_url,
      name: fetchResponse.name,
      email: fetchResponse.email,
      publicRepos: fetchResponse.public_repos,
    };

    gitHubUserCache.set(accessToken, userData);
    return userData;
  } else {
    log.debug("Cache hit for gitHub/getCurrentUser");
  }

  return cachedUser;
}
