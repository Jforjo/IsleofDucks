"use server";
import Link from "next/link";
import React from "react";
import DiscordLogin from "./ui/login";
import HoverImage from "./ui/hoverImage";
import HeaderNav from "./headerNav";
import { ClerkUserHasRole } from "@/app/_actions";

export default async function Header(): Promise<React.JSX.Element> {
    const isStaff = await ClerkUserHasRole([
        "admin",
        "mod",
        "trainee",
    ]);
    
    return (
        <header className="relative flex justify-between items-center p-3 gap-6 dark:bg-neutral-800">
            <Link href="/" className="w-52 text-2xl font-bold text-nowrap flex items-center gap-3">
                <HoverImage className="rounded-full" srcOriginal="/images/icon.png" srcHover="/images/icon.gif" width={40} height={40} alt="Isle of Ducks" />
                Isle of Ducks
            </Link>
            <HeaderNav isStaff={isStaff} />
            <div className="w-52 flex justify-right">
                <DiscordLogin />
            </div>
        </header>
    );
}
