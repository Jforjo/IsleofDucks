"use client";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import DiscordLogin from "./ui/login";

export default function Header(): React.JSX.Element {
    const pathname = usePathname();
    
    return (
        <header className="relative flex justify-between items-center p-3 gap-6 dark:bg-neutral-900">
            <Link href="/" className="text-2xl font-bold text-nowrap">Isle of Ducks</Link>
            <nav className="">
                <ul className="flex flex-row gap-5">
                    <li>
                        <Link href="/">
                            <span className={pathname === "/" ? "font-bold dark:text-neutral-200" : "dark:text-neutral-400 dark:hover:text-neutral-300"}>Home</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/about">
                            <span className={pathname === "/about" ? "font-bold dark:text-neutral-200" : "dark:text-neutral-400 dark:hover:text-neutral-300"}>About</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/staff">
                            <span className={pathname === "/staff" ? "font-bold dark:text-neutral-200" : "dark:text-neutral-400 dark:hover:text-neutral-300"}>Staff</span>
                        </Link>
                    </li>
                </ul>
            </nav>
            <DiscordLogin />
        </header>
    );
}