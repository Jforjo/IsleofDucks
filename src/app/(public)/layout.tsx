import type { Metadata } from "next";
import "../globals.css";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
    title: "Isle of Ducks",
    description: "Isle of Ducks",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body
                    className="flex flex-col min-h-screen dark:bg-neutral-950"
                >
                    <Header />
                    <main className="flex-grow">
                        {children}
                    </main>
                </body>
            </html>
        </ClerkProvider>
    );
}
