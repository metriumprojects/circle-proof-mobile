import React from "react";
import Svg, { Path, Circle } from "react-native-svg";

type Props = {
    size?: number;
    color?: string;
};

const HiddenEyeIcon: React.FC<Props> = ({ size = 24, color = "#000" }) => {
    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
        >
            <Path
                d="M22 12C22 12 19 18 12 18C5 18 2 12 2 12C2 12 5 6 12 6C19 6 22 12 22 12Z"
                stroke={color}
                strokeWidth={1}
                strokeLinecap="square"
                strokeLinejoin="miter"
            />
            <Circle
                cx="12"
                cy="12"
                r="3"
                stroke={color}
                strokeWidth={1}
            />
            <Path
                d="M3 21L20 4"
                stroke={color}
                strokeWidth={1}
                strokeLinecap="square"
            />
        </Svg>
    );
};

export default HiddenEyeIcon;