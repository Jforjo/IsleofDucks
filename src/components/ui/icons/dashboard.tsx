import React from 'react';

export default function DashboardIcon({
    active,
    className = '',
    fill = 'currentColor',
    secondaryfill = fill,
    strokewidth = 1,
    title,
    width = '1em',
    height = '1em',
}: {
    active: boolean;
    className?: string;
    fill?: string;
    secondaryfill?: string;
    strokewidth?: number;
    title?: string;
    width?: string;
    height?: string;
}): React.JSX.Element {
	const css = `.nc-int-icon-scale{--animation-duration:0.4s;}.nc-int-icon{position:relative;}.nc-int-icon-b{position: absolute;top: calc(50% - 0.5em);left: calc(50% - 0.5em);opacity: 0;}.nc-int-icon-a,.nc-int-icon-b{transform-origin:center center;}.nc-int-icon-scale .nc-int-icon-a,.nc-int-icon-scale .nc-int-icon-b{transition: opacity 0s calc(var(--animation-duration)/2), transform var(--animation-duration);}.nc-int-icon-scale .nc-int-icon-b{transform: scale(0.8);}.nc-int-icon-state-b .nc-int-icon-a{opacity: 0;}.nc-int-icon-state-b .nc-int-icon-b{opacity: 1;}.nc-int-icon-scale.nc-int-icon-state-b .nc-int-icon-a{transform: scale(0.8);}.nc-int-icon-scale.nc-int-icon-state-b .nc-int-icon-b{transform: scale(1);}`;

	return (
		<svg className={className} height={height} width={width} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {title && <title>{title}</title>}
            <g fill={fill}>
                <g className={`nc-int-icon nc-int-icon-scale js-nc-int-icon ${active ? "nc-int-icon-state-b" : ""}`}>
                    <g className="nc-int-icon-a">
                        <rect height="17" width="11" fill="none" stroke={fill} strokeLinecap="square" strokeLinejoin="miter" strokeMiterlimit="10" strokeWidth={strokewidth} x="3" y="1"/>
                        <rect height="9" width="11" fill="none" stroke={secondaryfill} strokeLinecap="square" strokeLinejoin="miter" strokeMiterlimit="10" strokeWidth={strokewidth} x="3" y="22"/>
                        <rect height="9" width="11" fill="none" stroke={secondaryfill} strokeLinecap="square" strokeLinejoin="miter" strokeMiterlimit="10" strokeWidth={strokewidth} x="18" y="1"/>
                        <rect height="17" width="11" fill="none" stroke={fill} strokeLinecap="square" strokeLinejoin="miter" strokeMiterlimit="10" strokeWidth={strokewidth} x="18" y="14"/>
                    </g>
                    <g className="nc-int-icon-b">
                        <path d="M14,19H3c-0.552,0-1-0.448-1-1V2c0-0.552,0.448-1,1-1h11c0.552,0,1,0.448,1,1v16C15,18.552,14.552,19,14,19z " fill={fill}/>
                        <path d="M14,31H3c-0.552,0-1-0.448-1-1v-8c0-0.552,0.448-1,1-1h11c0.552,0,1,0.448,1,1v8 C15,30.552,14.552,31,14,31z" fill={secondaryfill}/>
                        <path d="M29,11H18c-0.552,0-1-0.448-1-1V2c0-0.552,0.448-1,1-1h11c0.552,0,1,0.448,1,1v8 C30,10.552,29.552,11,29,11z" fill={secondaryfill}/>
                        <path d="M29,31H18c-0.552,0-1-0.448-1-1V14c0-0.552,0.448-1,1-1h11c0.552,0,1,0.448,1,1v16 C30,30.552,29.552,31,29,31z" fill={fill}/>
                    </g>
                </g>
                <style>{css}</style>
            </g>
        </svg>
	);
};