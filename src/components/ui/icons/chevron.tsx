import React from 'react';

export default function ChevronIcon({
    active,
    className = '',
    fill = 'currentColor',
    strokewidth = 1,
    title,
    width = '1em',
    height = '1em',
}: {
    active: boolean;
    className?: string;
    fill?: string;
    strokewidth?: number;
    title?: string;
    width?: string;
    height?: string;
}): React.JSX.Element {
	const css = `.nc-int-icon-slide-up{--animation-duration:0.3s;}.nc-int-icon{position:relative;}.nc-int-icon-b{position: absolute;top: calc(50% - 0.5em);left: calc(50% - 0.5em);opacity: 0;}.nc-int-icon-slide-up{overflow:hidden;}.nc-int-icon-slide-up .nc-int-icon-a,.nc-int-icon-slide-up .nc-int-icon-b{transition: opacity var(--animation-duration), transform var(--animation-duration);}.nc-int-icon-slide-up .nc-int-icon-b{transform: translateY(100%);}.nc-int-icon-state-b .nc-int-icon-a{opacity: 0;}.nc-int-icon-state-b .nc-int-icon-b{opacity: 1;}.nc-int-icon-slide-up.nc-int-icon-state-b .nc-int-icon-a{transform: translateY(-100%);}.nc-int-icon-slide-up.nc-int-icon-state-b .nc-int-icon-b{transform: translateY(0%);}`;

	return (
		<svg className={className} height={height} width={width} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {title && <title>{title}</title>}
            <g fill={fill}>
                <g className={`nc-int-icon nc-int-icon-slide-up js-nc-int-icon ${active ? "nc-int-icon-state-b" : ""}`}>
                    <g className="nc-int-icon-a">
                        <path d="M22 18L16 12L10 18" fill="none" stroke={fill} strokeLinecap="square" strokeMiterlimit="10" strokeWidth={strokewidth}/>
                    </g>
                    <g className="nc-int-icon-b">
                        <path d="M22 14L16 20L10 14" fill="none" stroke={fill} strokeLinecap="square" strokeMiterlimit="10" strokeWidth={strokewidth}/>
                    </g>
                </g>
                <style>{css}</style>
            </g>
        </svg>
	);
};