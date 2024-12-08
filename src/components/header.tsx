"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import DiscordLogin from "./ui/login";
import HoverImage from "./ui/hoverImage";

export default function Header(): React.JSX.Element {
    const pathname = usePathname();
    
    return (
        <header className="relative flex justify-between items-center p-3 gap-6 dark:bg-neutral-800">
            <Link href="/" className="w-52 text-2xl font-bold text-nowrap flex items-center gap-3">
                <HoverImage className="rounded-full" srcOriginal="/images/icon.png" srcHover="/images/icon.gif" width={40} height={40} alt="Isle of Ducks" />
                Isle of Ducks
            </Link>
            <nav className="flex-grow flex justify-center">
                <ul className="flex flex-row gap-5">
                    <li>
                        <Link href="/">
                            <span className={pathname === "/" ? "font-bold dark:text-neutral-200" : "dark:text-neutral-400 dark:hover:text-neutral-300"}>Home</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/staff">
                            <span className={pathname === "/staff" ? "font-bold dark:text-neutral-200" : "dark:text-neutral-400 dark:hover:text-neutral-300"}>Staff</span>
                        </Link>
                    </li>
                </ul>
            </nav>
            <div className="w-52 flex justify-right">
                <DiscordLogin />
            </div>
        </header>
    );
}
