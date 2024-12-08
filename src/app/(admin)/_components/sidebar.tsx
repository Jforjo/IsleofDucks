"use client";
import { DashboardIcon } from "@/components/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Sidebar(): React.JSX.Element {
    const pathname = usePathname();
    
    return (
        <div className="w-64 px-4 py-1 bg-neutral-900">
            <nav className="my-2">
                <ul className="flex flex-col gap-1">
                    <li className={`flex rounded-md hover:dark:bg-neutral-800 ${pathname === "/dashboard" ? "dark:text-neutral-200 dark:bg-neutral-800" : "dark:text-neutral-400 dark:hover:text-neutral-300"}`}>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 flex-grow px-3 py-2"
                        >
                            <DashboardIcon
                                active={pathname === "/dashboard"}
                                className="w-5 h-5"
                            />
                            <span className="">
                                Dashboard
                            </span>
                        </Link>
                    </li>
                    <li className={`flex rounded-md hover:dark:bg-neutral-800 ${pathname === "/immunity" ? "dark:text-neutral-200 dark:bg-neutral-800" : "dark:text-neutral-400 dark:hover:text-neutral-300"}`}>
                        <Link
                            href="/immunity"
                            className="flex items-center gap-3 flex-grow px-3 py-2"
                        >
                            <span>
                                Immunity
                            </span>
                        </Link>
                    </li>
                    <li className={`flex rounded-md hover:dark:bg-neutral-800 ${pathname === "/superlative" ? "dark:text-neutral-200 dark:bg-neutral-800" : "dark:text-neutral-400 dark:hover:text-neutral-300"}`}>
                        <Link
                            href="/superlative"
                            className="flex items-center gap-3 flex-grow px-3 py-2"
                        >
                            <span>
                                Superlative
                            </span>
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}