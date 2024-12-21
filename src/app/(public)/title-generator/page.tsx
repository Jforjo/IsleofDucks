import TitleGenerator from "@/components/titleGen";
import React from "react";

export default function TitleGeneratorPage(): React.JSX.Element {
    return (
        <section className="flex flex-col p-4 gap-4 items-center">
            <TitleGenerator />
        </section>
    )
}