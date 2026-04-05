import * as React from "react";

export type DownloadIconProps = {
	fillColor?: string;
	strokeColor?: string;
};

export default function DownloadIcon({
	strokeColor = "currentColor",
	fillColor = "currentColor",
}: DownloadIconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={1.5}
			stroke={strokeColor}
			className="w-6 h-6"
		>
			<path d="M12 15V3" />
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<path d="m7 10 5 5 5-5" />
		</svg>
	);
}
