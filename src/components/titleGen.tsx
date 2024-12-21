"use client";
import React, { useEffect, useRef, useState } from "react";

interface BBox { x: number; y: number; width: number; height: number };

function SVG({
    svgRef,
    width,
    height,
    lineThickness,
    text,
    gap,
    leftLineColor,
    rightLineColor,
    titleColor
}: {
    svgRef: React.RefObject<SVGSVGElement | null>;
    width: number;
    height: number;
    lineThickness: number;
    text: string;
    gap: number;
    leftLineColor: string;
    rightLineColor: string;
    titleColor: string;
}) {
    const ref = useRef<null | SVGTextElement>(null);

    const [ bbox, setbbox ] = useState<null | BBox>(null);
    const [ lineSize, setLineSize ] = useState(width / 2);
    const [ rightLinePos, setRightLinePos ] = useState(width / 2 + gap);

    useEffect(() => {
        if (ref.current) {
            setbbox(ref.current.getBBox());
        }
    }, [text, width, height, lineThickness, gap]);

    useEffect(() => {
        if (bbox) {
            setLineSize( ( ( width - bbox.width ) / 2 ) - gap);
            setRightLinePos(( ( width - bbox.width ) / 2 ) + gap + bbox.width);
        }
    }, [bbox]);

    return (
        <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <defs>
                <linearGradient id="gradientLeft" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="100%" stopColor={leftLineColor} />
                </linearGradient>
                <linearGradient id="gradientRight" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor={rightLineColor} />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
            <path
                d={`M 0 ${height / 2} q ${lineSize} -${lineThickness} ${lineSize} 0 q 0 ${lineThickness} -${lineSize} 0 z`}
                fill="url(#gradientLeft)"
            />
            <path
                d={`M ${rightLinePos} ${height / 2} q 0 -${lineThickness} ${lineSize} 0 q -${lineSize} ${lineThickness} -${lineSize} 0 z`}
                fill="url(#gradientRight)"
            />
            <text ref={ref} x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={titleColor} fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif">{text}</text>
        </svg>
    );
}

function useSvgConverter({
    canvas,
    svgContent,
    fileName
}: {
    canvas: HTMLCanvasElement | null;
    svgContent: string;
    fileName?: string;
}) {
    const [ svgContentState, setSvgContentState ] = useState(svgContent);

    useEffect(() => {
        setSvgContentState(svgContent);
    }, [svgContent]);

    const convertToPng = async () => {
        const ctx = canvas?.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");

        const saveImage = () => {
            if (canvas) {
                const dataUrl = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = dataUrl;
                const svgFileName = fileName ?? "title";

                link.download = `${svgFileName}.png`;
                link.click();
            }
        }

        const img = new Image();
        img.onload = () => {
            if (canvas) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.width = img.width;
                canvas.height = img.height;
            }
            
            ctx.drawImage(img, 0, 0);
            saveImage();
        };
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContentState)}`;
    }
    
    return { convertToPng };
}

function SaveAsPngButton({
    svgRef,
    title
}: {
    svgRef: React.RefObject<SVGSVGElement | null>;
    title: string;
}) {
    const [ canvasRef, setCanvasRef ] = useState<null | HTMLCanvasElement>(null);
    const { convertToPng } = useSvgConverter({
        canvas: canvasRef,
        svgContent: svgRef.current?.outerHTML ?? "",
        fileName: title
    });

    return (
        <div>
            <canvas ref={setCanvasRef} hidden></canvas>
            <button
                className="rounded-md px-3 py-2 border dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:border-neutral-700 dark:hover:border-neutral-600"
                onClick={() => {
                    void convertToPng();
                }}
            >
                Save as PNG
            </button>
        </div>
    )
}

export default function TitleGenerator(): React.JSX.Element {
    const [ width, setWidth ] = useState(512);
    const [ height, setHeight ] = useState(32);
    const [ text, setText ] = useState("Guild");
    const [ gap, setGap ] = useState(16);
    const [ lineThickness, setLineThickness ] = useState(16);
    const [ leftLineColor, setLeftLineColor ] = useState("#ff0000");
    const [ rightLineColor, setRightLineColor ] = useState("#ff0000");
    const [ titleColor, setTitleColor ] = useState("#ff0000");

    const svgRef = useRef<SVGSVGElement | null>(null);

    return (
        <>
            <div className="w-full flex justify-center m-2">
                <SVG
                    svgRef={svgRef}
                    width={width}
                    height={height}
                    lineThickness={lineThickness}
                    text={text}
                    gap={gap}
                    leftLineColor={leftLineColor}
                    rightLineColor={rightLineColor}
                    titleColor={titleColor}
                />
            </div>
            <div className="flex flex-row gap-2 max-w-3xl w-full justify-center">
                <SaveAsPngButton title={`title-${text}-${width}x${height}`} svgRef={svgRef} />
            </div>
            <div className="flex flex-col gap-4 max-w-3xl w-full">
                <label className="flex flex-col gap-1">
                    <span>Width - {width}</span>
                    <input
                        type="range"
                        min="0"
                        max="1920"
                        step="1"
                        value={width}
                        onChange={(e) => setWidth(parseInt(e.target.value))}
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span>Height - {height}</span>
                    <input
                        type="range"
                        min="0"
                        max="256"
                        step="1"
                        value={height}
                        onChange={(e) => setHeight(parseInt(e.target.value))}
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span>Line thickness - {lineThickness}</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={lineThickness}
                        onChange={(e) => setLineThickness(parseInt(e.target.value))}
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span>Gap around title - {gap}</span>
                    <input
                        type="range"
                        min="0"
                        max={width / 2}
                        step="1"
                        value={gap}
                        onChange={(e) => setGap(parseInt(e.target.value))}
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span>Title</span>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="rounded-md p-2 border dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
                    />
                </label>
                <div className="flex flex-row justify-evenly items-center gap-2">
                    <label className="flex flex-col gap-1 items-center">
                        <span>Left line colour</span>
                        <input
                            type="color"
                            value={leftLineColor}
                            onChange={(e) => setLeftLineColor(e.target.value)}
                            className="w-full h-8 p-0.5 rounded-md dark:bg-neutral-950"
                        />
                    </label>
                    <label className="flex flex-col gap-1 items-center">
                        <span>Title colour</span>
                        <input
                            type="color"
                            value={titleColor}
                            onChange={(e) => setTitleColor(e.target.value)}
                            className="w-full h-8 p-0.5 rounded-md dark:bg-neutral-950"
                        />
                    </label>
                    <label className="flex flex-col gap-1 items-center">
                        <span>Right line colour</span>
                        <input
                            type="color"
                            value={rightLineColor}
                            onChange={(e) => setRightLineColor(e.target.value)}
                            className="w-full h-8 p-0.5 rounded-md dark:bg-neutral-950"
                        />
                    </label>
                </div>
            </div>
        </>
    );
}