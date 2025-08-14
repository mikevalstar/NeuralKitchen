import md5 from "js-md5";

/**
 * Generate a Gravatar URL for the given email address
 * @param email The email address to generate the Gravatar URL for
 * @param size The size of the avatar in pixels (default: 80)
 * @param defaultImage The default image type to use if no Gravatar is found (default: "mp" for mystery person)
 * @returns The Gravatar URL
 */
export function getGravatarUrl(
  email: string | undefined | null,
  size: number = 80,
  defaultImage: string = "mp",
): string {
  if (!email) {
    return `https://www.gravatar.com/avatar/00000000000000000000000000000000?s=${size}&d=${defaultImage}`;
  }

  const hash = md5(email.toLowerCase().trim());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
}
