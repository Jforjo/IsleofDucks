import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { addImmunePlayer } from "@/discord/utils";
import React from "react";

async function addImmune(username: string, reason: string) {
    const uuidResponse = await getUsernameOrUUID(username);
    if (uuidResponse.success === true) {
        await addImmunePlayer(uuidResponse.uuid, reason);
    }
}

export default function ImmunityButton({
    className,
    username,
    reason,
    setUsername,
    setReason
}: {
    className: string;
    username: string;
    reason: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    setReason: React.Dispatch<React.SetStateAction<string>>;
}): React.JSX.Element {
    return <button
        className={className}
        onClick={async (e) => {
            e.currentTarget.disabled = true;
            e.currentTarget.textContent = "Adding...";
            void addImmune(username, reason);
            setUsername("");
            setReason("");
            e.currentTarget.textContent = "Added";
            // Enable the button again after 1 second
            setTimeout(() => {
                e.currentTarget.disabled = false;
                e.currentTarget.textContent = "Add Immunity";
            }, 1000);
        }}
        >
        Add Immunity
    </button>
}