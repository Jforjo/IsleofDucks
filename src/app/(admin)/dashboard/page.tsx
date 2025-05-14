import React from "react";
import DashboardImmunity from "../_components/dashboardImmunity";
import { ClerkGetUserRoles, RolesCompare } from "@/app/_actions";
import DropdownSection from "../_components/dropdownSection";
import { redirect } from "next/navigation";

const allowedPerms = new Set([
    "admin",
    "mod",
    "trainee",
]);

export default async function Dashboard(): Promise<React.JSX.Element> {
    const userRoles = await ClerkGetUserRoles();
    if (!userRoles) redirect("/");
    if (!RolesCompare(userRoles, allowedPerms).length) redirect("/");
    const isAdmin = userRoles.has("admin");
    
    return (
        <>
            { isAdmin && 
                <DropdownSection title="Immunity - Quick Add" subtitle="Add someone to the immunity list">
                    <DashboardImmunity />
                </DropdownSection>
            }
            <DropdownSection title="Superlative" subtitle="Current Superlative">
                <span>some content</span>
            </DropdownSection>
            <DropdownSection title="No Subtitle">
                <span>some content</span>
            </DropdownSection>
        </>
    );
}
