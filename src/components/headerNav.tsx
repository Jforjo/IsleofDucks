"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function HeaderNav({
    isStaff = false
}: {
    isStaff?: boolean
}): React.JSX.Element {
    const pathname = usePathname();

    return (
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
                <li>
                    <Link href="/superlative">
                        <span className={pathname === "/superlative" ? "font-bold dark:text-neutral-200" : "dark:text-neutral-400 dark:hover:text-neutral-300"}>Superlative</span>
                    </Link>
                </li>
                <li>
                    <Link href="/discord">
                        <span className={pathname === "/discord" ? "font-bold dark:text-neutral-200" : "dark:text-neutral-400 dark:hover:text-neutral-300"}>Discord</span>
                    </Link>
                </li>
                {isStaff && (
                    <li>
                        <Link href="/dashboard">
                            <span className={pathname === "/dashboard" ? "font-bold dark:text-neutral-200" : "dark:text-neutral-400 dark:hover:text-neutral-300"}>Admin</span>
                        </Link>
                    </li>
                )}
            </ul>
        </nav>
    );
}