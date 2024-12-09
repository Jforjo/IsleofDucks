import React from 'react';

/**
 * Renders a loading spinner icon with customizable properties.
 *
 * @param {string} [className=""] - CSS classes to apply to the SVG element.
 * @param {string} [fill="currentColor"] - Fill color for the primary parts of the SVG icon.
 * @param {string} [secondaryfill=fill] - Fill color for the secondary parts of the SVG icon.
 * @param {number} [strokewidth=1] - Width of the stroke applied to the SVG elements.
 * @param {string} [title] - Title attribute for the SVG element, used for accessibility.
 * @param {string} [width="1em"] - Width of the SVG element.
 * @param {string} [height="1em"] - Height of the SVG element.
 * @returns {React.JSX.Element} The rendered SVG loading spinner element.
 */
export default function LoadingIcon({
    className = "",
    fill = "currentColor",
    secondaryfill = fill,
    strokewidth = 1,
    title,
    width = "1em",
    height = "1em",
}: {
    className?: string;
    fill?: string;
    secondaryfill?: string;
    strokewidth?: number;
    title?: string;
    width?: string;
    height?: string;
}): React.JSX.Element {
	const css = `.nc-loop-circle-2-32-icon-o{--animation-duration:0.65s;transform-origin:16px 16px;animation:nc-loop-circle-2-anim var(--animation-duration) infinite cubic-bezier(.645,.045,.355,1)}@keyframes nc-loop-circle-2-anim{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`;

	return (
		<svg className={className} height={height} width={width} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {title && <title>{title}</title>}
            <g fill={fill} strokeLinecap="square" strokeLinejoin="miter">
                <g className="nc-loop-circle-2-32-icon-o">
                    <circle cx="16" cy="16" fill="none" opacity=".4" r="15" stroke={fill} strokeWidth={strokewidth}/>
                    <path d="M16 1a15 15 0 0 1 15 15" fill="none" stroke={secondaryfill} strokeLinecap="butt" strokeWidth={strokewidth}/>
                </g>
                <style>{css}</style>
            </g>
        </svg>
	);
};