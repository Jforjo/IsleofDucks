import type { Metadata } from "next";
import "../globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Suspense } from "react";
import Loading from "@/components/ui/loading";

export const metadata: Metadata = {
    title: "🦆 Isle of Ducks",
    description: "Isle of Ducks",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider appearance={{ baseTheme: dark }}>
            <html lang="en" suppressHydrationWarning>
                <body
                    className="flex flex-col min-h-screen dark:bg-neutral-900"
                >
                    <Header />
                    <main className="flex-grow">
                        <Suspense fallback={<Loading />}>
                            {children}
                        </Suspense>
                    </main>
                </body>
            </html>
        </ClerkProvider>
    );
}
