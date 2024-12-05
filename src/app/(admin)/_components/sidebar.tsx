"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Sidebar(): React.JSX.Element {
    const pathname = usePathname();
    return (
        <div className="w-32 bg-neutral-900">
            <nav className="my-2">
                <ul className="flex flex-col gap-1">
                    <li className={`p-2 hover:dark:bg-neutral-800 ${pathname === "/dashboard" ? "font-bold dark:text-neutral-200" : "dark:text-neutral-400 dark:hover:text-neutral-300"}`}>
                        <Link href="/dashboard">
                            <span className="">
                                Dashboard
                            </span>
                        </Link>
                    </li>
                    <li className={`p-2 hover:dark:bg-neutral-800 ${pathname === "/immunity" ? "font-bold dark:text-neutral-200" : "dark:text-neutral-400 dark:hover:text-neutral-300"}`}>
                        <Link href="/immunity">
                            <span>
                                Immunity
                            </span>
                        </Link>
                    </li>
                    <li className={`p-2 hover:dark:bg-neutral-800 ${pathname === "/superlative" ? "font-bold dark:text-neutral-200" : "dark:text-neutral-400 dark:hover:text-neutral-300"}`}>
                        <Link href="/superlative">
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