import Link from "next/link";
import React from "react";

export default function Home(): React.JSX.Element {
    return (
        <>
            <section className="flex flex-col justify-center items-center max-w-3xl mx-auto my-64">
                <h1 className="text-6xl font-bold mb-4 dark:text-neutral-300">
                    Isle of Ducks
                </h1>
                <span className="mb-2 dark:text-neutral-400">
                    A community of SkyBlock players on the Minecraft server Hypixel
                </span>
                <p className="mb-6 dark:text-neutral-500">
                    Please note that this website is still a work in progress
                </p>
                <Link
                    className="px-4 py-2 rounded-md active:scale-95 shadow-md active:shadow-sm dark:shadow-blurple-500 hover:dark:shadow-blurple-600 dark:bg-blurple-600 hover:dark:bg-blurple-700 dark:text-neutral-200 hover:dark:text-neutral-100"
                    href="/discord"
                    target="_blank"
                >
                    Our Discord
                </Link>
            </section>
        </>
    );
}
