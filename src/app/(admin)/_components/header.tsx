"use client";
import Link from "next/link";
import React from "react";
import DiscordLogin from "@/components/ui/login";
import HoverImage from "@/components/ui/hoverImage";

export default function Header(): React.JSX.Element {
    return (
        <header className="relative flex justify-between items-center p-3 gap-6 dark:bg-neutral-900">
            <Link href="/" className="text-2xl font-bold text-nowrap flex items-center gap-3">
                <HoverImage className="rounded-full" srcOriginal="/images/icon.png" srcHover="/images/icon.gif" width={40} height={40} alt="Isle of Ducks" />
                Isle of Ducks
            </Link>
            <DiscordLogin />
        </header>
    );
}
