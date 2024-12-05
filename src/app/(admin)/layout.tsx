import type { Metadata } from "next";
import "../globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import Sidebar from "./_components/sidebar";

export const metadata: Metadata = {
    title: "Create Next App",
    description: "Generated by create next app",
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
                    className={`flex flex-col min-h-screen dark:bg-neutral-950`}
                >
                    <Header />
                    <div className="flex flex-grow">
                        <Sidebar />
                        <main className="flex flex-grow">
                            {children}
                        </main>
                    </div>
                </body>
            </html>
        </ClerkProvider>
    );
}
