import { Path } from "./path.class";

export interface Drawing {
	id: string;
	releaseDate: Date;
	paths: Path[];
	translateX: number;
	translateY: number;
}