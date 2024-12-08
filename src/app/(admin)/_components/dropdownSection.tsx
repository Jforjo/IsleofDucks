"use client";
import { ChevronIcon } from "@/components/ui/icons";
import React from "react";

export default function DropdownSection({
    title,
    subtitle,
    children
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}): React.JSX.Element {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
        <section className="flex flex-col p-5 dark:bg-neutral-900 rounded-lg h-fit">
            <header className={`flex flex-col font-bold ${isOpen ? "border-b mb-5" : ""} border-neutral-800 dark:text-neutral-400`}>
                <h2 className={`text-xl flex items-center justify-between ${subtitle ? "mb-2" : isOpen ? "mb-5" : ""}`}>
                    {title}
                    <button
                        className="rounded-md dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <ChevronIcon active={!isOpen} className="w-7 h-7" strokewidth={2} />
                    </button>
                </h2>
                { subtitle &&
                    <p className={`text-sm ${isOpen ? "mb-5" : ""} dark:text-neutral-500`}>
                        {subtitle}
                    </p>
                }
            </header>
            <main className={`flex-col h-fit ${isOpen ? "flex" : "hidden"}`} aria-hidden={!isOpen}>
            {/* Use the bottom one if "interpolate-size: 'allow-keywords';" is enabled */}
            {/* <main className={`flex flex-col overflow-hidden ${isOpen ? "h-fit" : "h-0"}`} aria-hidden={!isOpen}> */}
                {children}
            </main>
        </section>
    );
}