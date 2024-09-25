"use client";
// import Image from "next/image";
import { useSession } from "next-auth/react";
// import duckbg from "../../public/images/duckbg.gif";

export default function Home() {
    const session = useSession();
    return (
        <>
            <section className="h-screen">
                {/* <Image
                    src={duckbg}
                    width={1920}
                    height={1080}
                    alt="Duck"
                    priority
                /> */}

            </section>
            <section className="bg-gray-800 p-4 m-8">
                { JSON.stringify(session) }
            </section>
        </>
    );
}
