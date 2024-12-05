import { GetAllGuildMembers, IsleofDucks } from "@/discord/discordUtils";
import fallbackImg from "@/public/images/profile.png";
import ImageWithFallback from "@/components/ui/fallbackImage";
import React from "react";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";

export default async function Staff() {
    const members = await GetAllGuildMembers(IsleofDucks.serverID);
    const staff = members.filter(member => {
        return member.roles.includes(IsleofDucks.roles.staff);
    }).map(member => {
        const username = member.nick?.replace('✧', '').split(' ')[0];
        if (member.roles.includes(IsleofDucks.roles.owner)) return { name: username, role: 'Owner', order: 0 };
        if (member.roles.includes(IsleofDucks.roles.admin)) return { name: username, role: 'Admin', order: 1 };
        if (member.roles.includes(IsleofDucks.roles.mod_duck)) return { name: username, role: 'Moderator', order: 2 };
        if (member.roles.includes(IsleofDucks.roles.mod_duckling)) return { name: username, role: 'Moderator', order: 2 };
        if (member.roles.includes(IsleofDucks.roles.trainee)) return { name: username, role: 'Trainee', order: 3 };
    }).sort((a, b) => (a?.order || 0) - (b?.order || 0)).reduce<Record<string, string[]>>((accumlator: Record<string, string[]>, current) => {
        if (!current || !current.name) return accumlator;
        (accumlator[current.role] = accumlator[current.role] || []).push(current.name);
        return accumlator;
    }, {});
    return (
        <section className="mt-8 flex flex-wrap justify-center gap-4">
            { Object.entries(staff).map(([role, names]) => {
                return <div key={role} className="flex flex-col justify-center dark:bg-neutral-700 p-4 items-center gap-4">
                    <h3 className="font-bold text-lg">
                        { role }
                    </h3>
                    <div className="flex flex-row gap-2">
                        { names.map(async name => {
                            const uuidRes = await getUsernameOrUUID(name);
                            let uuid = "";
                            if (uuidRes.success === true) uuid = uuidRes.uuid;
                            return <div key={name} className="flex flex-col dark:bg-neutral-800 p-4 items-center gap-2">
                                {/* <ImageWithFallback fallbackSrc={fallbackImg.src} src={`https://mineskin.eu/helm/${name}/100.png`} width={100} height={100} alt={name}/> */}
                                <ImageWithFallback fallbackSrc={fallbackImg.src} src={`https://crafatar.com/avatars/${uuid}?size=96`} width={96} height={96} alt={name}/>
                                <span>
                                    { name }
                                </span>
                            </div>
                        }) }
                    </div>
                </div>
            }) }
        </section>
    );
}