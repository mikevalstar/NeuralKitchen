import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { Users } from "~/lib/data/users";
import { userIdSchema } from "~/lib/dataValidators";
import { getGravatarUrl } from "~/lib/gravatar";

const getUser = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => userIdSchema.parse(data))
  .handler(async ({ data }) => {
    return Users.read(data.userId);
  });

interface UserData {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  image?: string | null;
}

interface LazyUserAvatarProps {
  userId: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
  showName?: boolean;
  showEmail?: boolean;
}

export function LazyUserAvatar({
  userId,
  size = "sm",
  className = "",
  showName = false,
  showEmail = false,
}: LazyUserAvatarProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const userData = await getUser({ data: { userId } });

        if (userData) {
          setUser(userData);
        } else {
          setError("User not found");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (!userId) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar className={getAvatarSize(size)}>
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        {(showName || showEmail) && <div className="text-sm text-muted-foreground">System</div>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar className={getAvatarSize(size)}>
          <AvatarFallback>
            <div className="animate-pulse bg-muted-foreground/20 rounded-full w-full h-full" />
          </AvatarFallback>
        </Avatar>
        {(showName || showEmail) && (
          <div className="text-sm text-muted-foreground">
            <div className="animate-pulse bg-muted-foreground/20 h-4 w-16 rounded" />
          </div>
        )}
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar className={getAvatarSize(size)}>
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        {(showName || showEmail) && <div className="text-sm text-muted-foreground">Unknown User</div>}
      </div>
    );
  }

  const initials = getInitials(user.name);
  const avatarSize = getAvatarSizeNumber(size);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className={getAvatarSize(size)}>
        <AvatarImage src={getGravatarUrl(user.email, avatarSize)} alt={user.name} />
        <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
      </Avatar>

      {(showName || showEmail) && (
        <div className="flex flex-col">
          {showName && <div className="text-sm font-medium">{user.name}</div>}
          {showEmail && <div className="text-xs text-muted-foreground">{user.email}</div>}
        </div>
      )}
    </div>
  );
}

function getAvatarSize(size: "sm" | "md" | "lg"): string {
  switch (size) {
    case "sm":
      return "h-6 w-6";
    case "md":
      return "h-8 w-8";
    case "lg":
      return "h-10 w-10";
    default:
      return "h-6 w-6";
  }
}

function getAvatarSizeNumber(size: "sm" | "md" | "lg"): number {
  switch (size) {
    case "sm":
      return 24;
    case "md":
      return 32;
    case "lg":
      return 40;
    default:
      return 24;
  }
}

function getInitials(name: string): string {
  if (!name) return "?";

  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}
