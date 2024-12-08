import React from "react";
import { LoadingIcon } from "./icons";

export default function Loading(): React.JSX.Element {
    return (
        <div className="flex items-center justify-center h-full w-full">
            <LoadingIcon strokewidth={2} className="w-12 h-12 m-8" />
        </div>
    );
}