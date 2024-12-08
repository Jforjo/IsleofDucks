import React from "react";

/**
 * A simple SVG icon for Discord.
 *
 * @param {string} [className=""] CSS classes to apply to the SVG element.
 * @param {string} [fill="currentColor"] Fill color for the SVG icon.
 * @param {string} [title] Title attribute for the SVG element.
 * @param {string} [width="1em"] Width of the SVG element.
 * @param {string} [height="1em"] Height of the SVG element.
 * @returns {React.JSX.Element} The rendered SVG element.
 */
export default function DiscordIcon({
    className = "",
    fill = "currentColor",
    title,
    width = "1em",
    height = "1em",
}: {
    className?: string;
    fill?: string;
    title?: string;
    width?: string;
    height?: string;
}): React.JSX.Element {
    return (
        <svg className={className} height={height} width={width} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            {title && <title>{title}</title>}
            <g fill={fill}>
                <path
                    d="M26.413,6.536c-1.971-.902-4.052-1.543-6.189-1.904-.292,.523-.557,1.061-.793,1.612-2.277-.343-4.592-.343-6.869,0-.236-.551-.5-1.089-.793-1.612-2.139,.365-4.221,1.006-6.194,1.909C1.658,12.336,.596,17.987,1.127,23.558h0c2.294,1.695,4.861,2.984,7.591,3.811,.615-.827,1.158-1.704,1.626-2.622-.888-.332-1.744-.741-2.56-1.222,.215-.156,.425-.316,.628-.472,4.806,2.26,10.37,2.26,15.177,0,.205,.168,.415,.328,.628,.472-.817,.483-1.676,.892-2.565,1.225,.467,.918,1.011,1.794,1.626,2.619,2.732-.824,5.301-2.112,7.596-3.808h0c.623-6.461-1.064-12.06-4.46-17.025Zm-15.396,13.596c-1.479,0-2.702-1.343-2.702-2.994s1.18-3.006,2.697-3.006,2.73,1.354,2.704,3.006-1.192,2.994-2.699,2.994Zm9.967,0c-1.482,0-2.699-1.343-2.699-2.994s1.18-3.006,2.699-3.006,2.723,1.354,2.697,3.006-1.189,2.994-2.697,2.994Z"/>
            </g>
        </svg>
    );
}
