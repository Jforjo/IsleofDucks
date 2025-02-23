import React from "react";
import StaffBoxes from "@/components/staffBoxes";
import { GetAllGuildMembers, IsleofDucks } from "@/discord/discordUtils";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";

export default async function Staff() {
    const members = await GetAllGuildMembers(IsleofDucks.serverID);
    const staffMembers: { name: string | undefined; uuid: string; role: string; order: number; }[] = [];
    for (const member of members.filter(member => {
        return member.roles.includes(IsleofDucks.roles.staff);
    })) {
        let stats = { role: "", order: 0 };
        if (member.roles.includes(IsleofDucks.roles.owner)) stats = { role: 'Owner', order: 0 };
        else if (member.roles.includes(IsleofDucks.roles.admin)) stats = { role: 'Admin', order: 1 };
        else if (member.roles.includes(IsleofDucks.roles.mod_duck)) stats = { role: 'Moderator', order: 2 };
        else if (member.roles.includes(IsleofDucks.roles.mod_duckling)) stats = { role: 'Moderator', order: 2 };
        else if (member.roles.includes(IsleofDucks.roles.trainee)) stats = { role: 'Trainee', order: 3 };
        else continue;
        
        const username = member.nick?.replace('✧', '').split(' ')[0];
        const uuid = await getUsernameOrUUID(username ?? "");
        if (uuid.success === false) continue;

        staffMembers.push({ name: username, uuid: uuid.uuid, role: stats.role, order: stats.order });
    }
    const staff = staffMembers
        .sort((a, b) => (a?.order || 0) - (b?.order || 0))
        .reduce<Record<string, { name: string; uuid: string; }[]>>((accumlator: Record<string, { name: string; uuid: string; }[]>, current) => {
            if (!current || !current.name) return accumlator;
            (accumlator[current.role] = accumlator[current.role] || []).push({ name: current.name, uuid: current.uuid });
            return accumlator;
    }, {});
    
    return (
        <section className="mt-8 flex flex-wrap justify-center gap-4">
            <StaffBoxes staff={staff} />
        </section>
    );
}