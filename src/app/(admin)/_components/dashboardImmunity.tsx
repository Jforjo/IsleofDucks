"use client";
import React, { useState } from "react";
import ImmunityButton from "./ui/immunityButton";

export default function DashboardImmunity() {
    const [username, setUsername] = useState("");
    const [discord, setDiscord] = useState("");
    const [reason, setReason] = useState("");

    return (
        <>
            <label className="flex flex-col gap-1 max-w-3xl mb-4">
                <span className="dark:text-neutral-500">
                    Username
                    <i className="dark:text-red-600">*</i>
                </span>
                <input
                    className="px-3 py-2 rounded-md border dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:placeholder:text-neutral-500"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                />
            </label>
            <label className="flex flex-col gap-1 max-w-3xl mb-4">
                <span className="dark:text-neutral-500">
                    Discord ID
                </span>
                <input
                    className="px-3 py-2 rounded-md border dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:placeholder:text-neutral-500"
                    type="text"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder="Discord ID (optional)"
                />
            </label>
            <label className="flex flex-col gap-1 max-w-3xl mb-6">
                <span className="dark:text-neutral-500">
                    Reason
                    <i className="dark:text-red-600">*</i>
                </span>
                <input
                    className="px-3 py-2 rounded-md border dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:placeholder:text-neutral-500"
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason"
                />
            </label>
            <div className="flex flex-row gap-4 max-w-3xl">
                <button
                    className="px-4 py-2 rounded-md active:scale-95 border dark:bg-neutral-950 hover:dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 hover:dark:text-neutral-300"
                    onClick={() => {
                        setUsername("");
                        setDiscord("");
                        setReason("");
                    }}
                >
                    Cancel
                </button>
                <ImmunityButton
                    className="px-4 py-2 rounded-md active:scale-95 border dark:bg-neutral-950 hover:dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 hover:dark:text-neutral-300"
                    username={username}
                    discord={discord}
                    reason={reason}
                    setUsername={setUsername}
                    setDiscord={setDiscord}
                    setReason={setReason}
                />
            </div>
        </>
    );
}