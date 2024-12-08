"use client";
import React, { useState } from 'react';
import Image from 'next/image';

interface Props extends React.ComponentProps<typeof Image> {
    fallbackSrc: string
}
export default function ImageWithFallback({
    src,
    fallbackSrc,
    ...rest
}: Props): React.JSX.Element {
    const [imgSrc, setImgSrc] = useState(src);

    return (
        <Image
            {...rest}
            src={imgSrc}
            onError={() => {
                setImgSrc(fallbackSrc);
            }}
        />
    );
};