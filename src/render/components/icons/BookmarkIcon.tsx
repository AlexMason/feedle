import * as React from "react";

export type BookmarkIconProps = {
	fillColor?: string;
	strokeColor?: string;
};

export default function BookmarkIcon({
	strokeColor = "currentColor",
	fillColor = "currentColor",
}: BookmarkIconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={1.5}
			stroke={strokeColor}
			className="w-6 h-6"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				fill={fillColor}
				d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
			/>
		</svg>
	);
}
