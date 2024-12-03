"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Header(): React.JSX.Element {
    const pathname = usePathname();
    
    return (
        <header className="fixed left-1/2 -translate-x-1/2 top-8 flex justify-between items-center p-2 gap-6 rounded-2xl bg-slate-300 bg-opacity-25 backdrop-blur">
            <Link href="/" className="text-2xl font-bold pl-1 text-nowrap">Isle of Ducks</Link>
            <nav>
                <ul className="flex flex-row gap-5">
                    <li>
                        <Link href="/">
                            <span className={pathname === "/" ? "font-bold text-gray-300" : "text-gray-400"}>Home</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/about">
                            <span className={pathname === "/about" ? "font-bold text-gray-300" : "text-gray-400"}>About</span>
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}