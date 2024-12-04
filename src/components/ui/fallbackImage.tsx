"use client";
import React, { useState } from 'react';
import Image from 'next/image';

interface Props extends React.ComponentProps<typeof Image> {
    fallbackSrc: string
}
export default function ImageWithFallback(props: Props): React.JSX.Element {
    const { src, fallbackSrc, ...rest } = props;
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