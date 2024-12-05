"use client";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { addImmunePlayer } from "@/discord/utils";
import React, { useState } from "react";

async function addImmune(username: string, discord: string, reason: string) {
    const uuidResponse = await getUsernameOrUUID(username);
    if (uuidResponse.success === true) {
        await addImmunePlayer(uuidResponse.uuid, discord, reason);
    }
}

export default function QuickImmunity() {
    const [username, setUsername] = useState("");
    const [discord, setDiscord] = useState("");
    const [reason, setReason] = useState("");

    return (
        <section className="m-4 p-2 flex flex-col h-max gap-2">
            <h2 className="text-xl">Immunity - Quick Add</h2>
            <div className="flex flex-col rounded-lg p-2 gap-2 dark:bg-neutral-900">
                <label className="flex flex-row items-center gap-2 justify-between">
                    <span className="dark:text-neutral-400">
                        Username
                        <i className="text-red-500">*</i>
                    </span>
                    <input
                        className="px-2 py-1 w-44 rounded-md border dark:border-neutral-600 bg-transparent dark:text-neutral-300"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </label>
                <label className="flex flex-row items-center gap-2 justify-between">
                    <span className="dark:text-neutral-400">
                        Discord ID
                    </span>
                    <input
                        className="px-2 py-1 w-44 rounded-md border dark:border-neutral-600 bg-transparent dark:text-neutral-300"
                        type="text"
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                    />
                </label>
                <label className="flex flex-row items-center gap-2 justify-between">
                    <span className="dark:text-neutral-400">
                        Reason
                        <i className="text-red-500">*</i>
                    </span>
                    <input
                        className="px-2 py-1 w-44 rounded-md border dark:border-neutral-600 bg-transparent dark:text-neutral-300"
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </label>
                <div className="flex flex-row gap-2 mt-1 justify-around">
                    <button
                        className="px-4 py-2 rounded-md active:scale-95 dark:bg-neutral-800 hover:dark:bg-neutral-700 dark:text-neutral-200 hover:dark:text-neutral-100"
                        onClick={() => {
                            setUsername("");
                            setDiscord("");
                            setReason("");
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 rounded-md active:scale-95 dark:bg-neutral-800 hover:dark:bg-neutral-700 dark:text-neutral-200 hover:dark:text-neutral-100"
                        onClick={async (e) => {
                            e.currentTarget.disabled = true;
                            e.currentTarget.textContent = "Adding...";
                            await addImmune(username, discord, reason);
                            setUsername("");
                            setDiscord("");
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
                </div>
            </div>
        </section>
    );
}