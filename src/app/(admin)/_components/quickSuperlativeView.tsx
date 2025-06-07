import { getActiveSuperlative } from "@/discord/utils";
import React from "react";

async function getCurrentSuperlativeData() {
    const superlative = await getActiveSuperlative();
    if (superlative == null) return null;
    return superlative;
}

export default async function QuickSuperlativeView() {
    const superlative = await getCurrentSuperlativeData();

    return (
        <section className="flex flex-col h-max gap-2">
            <h2 className="text-xl">Current Superlative</h2>
            <div className="flex flex-col rounded-lg p-2 gap-2 dark:bg-neutral-900">
                <h3 className={`pb-1 text-lg ${superlative && "border-b border-neutral-800"} dark:text-neutral-400`}>
                    { superlative && superlative.data.title }
                </h3>
                { superlative && (
                    <span className="dark:text-neutral-500">
                        Starts: { new Date(superlative.start).toLocaleString() }
                    </span>
                ) }
            </div>
        </section>
    );
}