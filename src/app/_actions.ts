"use server";

import { currentUser } from "@clerk/nextjs/server";

export async function ClerkGetUserRoles(): Promise<Set<string> | null> {
    const user = await currentUser();
    if (!user) return null;
    if (!user.publicMetadata.roles) return null;
    return new Set(user.publicMetadata.roles as string[]);
}
export async function ClerkUserHasRole(roles: string[]): Promise<boolean> {
    const user = await currentUser();
    if (!user) return false;
    if (!user.publicMetadata.roles) return false;
    const userRoles = user.publicMetadata.roles as string[];
    for (const role of roles) {
        if (userRoles.includes(role)) return true;
    }
    return false;
}