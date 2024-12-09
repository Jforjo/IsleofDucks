"use client";
import ImageWithFallback from "@/components/ui/fallbackImage";
import React from "react";

export default function StaffBoxes({
    staff
}: {
    staff: Record<string, { name: string; uuid: string; }[]> | undefined
}): React.JSX.Element {

    if (!staff) return <></>;

    return (
        <>
            { Object.entries(staff).map(([role, names]) => {
                return <div key={role} className="flex flex-col justify-center dark:bg-neutral-700 p-4 items-center gap-4">
                    <h3 className="font-bold text-lg">
                        { role }
                    </h3>
                    <div className="flex flex-row gap-2">
                        { names.map(name => {
                            return <div key={name.name} className="flex flex-col dark:bg-neutral-800 p-4 items-center gap-2">
                                {/* <ImageWithFallback fallbackSrc={fallbackImg.src} src={`https://mineskin.eu/helm/${name.name}/100.png`} width={100} height={100} alt={name.name}/> */}
                                <ImageWithFallback fallbackSrc="/images/profile.png" src={`https://crafatar.com/avatars/${name.uuid}?size=96`} width={96} height={96} alt={name.name}/>
                                <span>
                                    { name.name }
                                </span>
                            </div>
                        }) }
                    </div>
                </div>
            }) }
        </>
    );
}