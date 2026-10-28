import type { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      l0Ids: string[];
      teamIds: string[];
    };
  }

  interface User {
    id: string;
    role: Role;
    l0Ids: string[];
    teamIds: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    l0Ids: string[];
    teamIds: string[];
  }
}
