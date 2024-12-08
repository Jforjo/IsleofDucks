"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex items-center justify-center h-full w-full gap-2">
            <h2 className="text-xl text-neutral-800 dark:text-natural-200">Something went wrong!</h2>
            <button
                className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-neutral-100 p-2 text-neutral-500 hover:border-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400 hover:dark:border-neutral-500 hover:dark:bg-neutral-900 dark:hover:text-neutral-100"
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
            >
                Retry
            </button>
        </div>
    );
}
