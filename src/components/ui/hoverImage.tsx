"use client";
import Image from "next/image";
import React, { useState } from "react";

export default function HoverImage({
    srcOriginal,
    srcHover,
    width,
    height,
    alt,
    className
}: {
    srcOriginal: string;
    srcHover: string;
    width: number;
    height: number;
    alt: string;
    className?: string;
}): React.JSX.Element {
    const [hover, setHover] = useState(false);
    return (
        <Image
            src={hover ? srcHover : srcOriginal}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            width={width}
            height={height}
            alt={alt}
            className={className}
        />
    );
}