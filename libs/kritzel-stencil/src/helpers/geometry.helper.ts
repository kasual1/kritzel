import { KritzelPoint } from "../interfaces/point.interface";
import { KritzelPolygon } from "../interfaces/polygon.interface";

export class KritzelGeometryHelper {
	static doPolygonsIntersect(polygon1: KritzelPolygon, polygon2: KritzelPolygon): boolean {
		// 1. Convert polygons to array of points for easier processing
		const points1 = [polygon1.bottomLeft, polygon1.bottomRight, polygon1.topRight, polygon1.topLeft];
		const points2 = [polygon2.bottomLeft, polygon2.bottomRight, polygon2.topRight, polygon2.topLeft];

		// 2. Check if any point of polygon1 is inside polygon2
		for (const point of points1) {
			if (this.isPointInPolygon(point, points2)) {
				return true;
			}
		}

		// 3. Check if any point of polygon2 is inside polygon1
		for (const point of points2) {
			if (this.isPointInPolygon(point, points1)) {
				return true;
			}
		}

		// 4. Check for edge intersections (more complex)
		for (let i = 0; i < points1.length; i++) {
			const p1a = points1[i];
			const p1b = points1[(i + 1) % points1.length]; // Wrap around to the first point

			for (let j = 0; j < points2.length; j++) {
				const p2a = points2[j];
				const p2b = points2[(j + 1) % points2.length];

				if (this.intersectLines(p1a, p1b, p2a, p2b)) {
					return true;
				}
			}
		}

		return false; // No intersection found
	}

	static isPointInPolygon(point: KritzelPoint, polygon: KritzelPoint[]): boolean {
		let inside = false;
		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const xi = polygon[i].x,
				yi = polygon[i].y;
			const xj = polygon[j].x,
				yj = polygon[j].y;

			const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
			if (intersect) inside = !inside;
		}
		return inside;
	}

	static intersectLines(p1a: KritzelPoint, p1b: KritzelPoint, p2a: KritzelPoint, p2b: KritzelPoint): boolean {
		const det = (p1b.x - p1a.x) * (p2b.y - p2a.y) - (p1b.y - p1a.y) * (p2b.x - p2a.x);
		if (det === 0) {
			return false; // Lines are parallel
		}

		const t = ((p2a.x - p1a.x) * (p2b.y - p2a.y) - (p2a.y - p1a.y) * (p2b.x - p2a.x)) / det;
		const u = -((p1a.x - p2a.x) * (p1b.y - p1a.y) - (p1a.y - p2a.y) * (p1b.x - p1a.x)) / det;

		return t >= 0 && t <= 1 && u >= 0 && u <= 1;
	}

	/**
	 * Finds the intersection point between a line segment and a line segment.
	 * Returns the intersection point or null if no intersection.
	 */
	static getLineIntersectionPoint(p1a: KritzelPoint, p1b: KritzelPoint, p2a: KritzelPoint, p2b: KritzelPoint): KritzelPoint | null {
		const det = (p1b.x - p1a.x) * (p2b.y - p2a.y) - (p1b.y - p1a.y) * (p2b.x - p2a.x);
		if (det === 0) {
			return null; // Lines are parallel
		}

		const t = ((p2a.x - p1a.x) * (p2b.y - p2a.y) - (p2a.y - p1a.y) * (p2b.x - p2a.x)) / det;
		const u = -((p1a.x - p2a.x) * (p1b.y - p1a.y) - (p1a.y - p2a.y) * (p1b.x - p1a.x)) / det;

		if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
			return {
				x: p1a.x + t * (p1b.x - p1a.x),
				y: p1a.y + t * (p1b.y - p1a.y)
			};
		}
		return null;
	}

	/**
	 * Finds the closest intersection point between a line segment (from lineStart to lineEnd)
	 * and a polygon. Returns the intersection point closest to lineStart, or null if no intersection.
	 */
	static getLinePolygonIntersection(lineStart: KritzelPoint, lineEnd: KritzelPoint, polygon: KritzelPolygon): KritzelPoint | null {
		const points = [polygon.topLeft, polygon.topRight, polygon.bottomRight, polygon.bottomLeft];
		let closestIntersection: KritzelPoint | null = null;
		let closestDistance = Infinity;

		for (let i = 0; i < points.length; i++) {
			const edgeStart = points[i];
			const edgeEnd = points[(i + 1) % points.length];

			const intersection = this.getLineIntersectionPoint(lineStart, lineEnd, edgeStart, edgeEnd);
			if (intersection) {
				const distance = Math.sqrt(
					Math.pow(intersection.x - lineStart.x, 2) +
					Math.pow(intersection.y - lineStart.y, 2)
				);
				if (distance < closestDistance) {
					closestDistance = distance;
					closestIntersection = intersection;
				}
			}
		}

		return closestIntersection;
	}

	/**
	 * Generates a polygon approximation of an ellipse.
	 * @param centerX - X coordinate of ellipse center
	 * @param centerY - Y coordinate of ellipse center  
	 * @param rx - Horizontal radius
	 * @param ry - Vertical radius
	 * @param segments - Number of segments (more = smoother approximation)
	 * @param rotation - Optional rotation angle in radians
	 */
	static getEllipsePolygonApproximation(
		centerX: number,
		centerY: number,
		rx: number,
		ry: number,
		segments: number = 32,
		rotation: number = 0
	): KritzelPoint[] {
		const points: KritzelPoint[] = [];
		const cos = Math.cos(rotation);
		const sin = Math.sin(rotation);

		for (let i = 0; i < segments; i++) {
			const angle = (2 * Math.PI * i) / segments;
			// Point on unrotated ellipse
			const px = rx * Math.cos(angle);
			const py = ry * Math.sin(angle);
			// Apply rotation around center
			const rotatedX = centerX + px * cos - py * sin;
			const rotatedY = centerY + px * sin + py * cos;
			points.push({ x: rotatedX, y: rotatedY });
		}

		return points;
	}

	/**
	 * Finds the closest intersection point between a line segment and a polygon 
	 * defined as an array of points. Returns the intersection closest to lineStart,
	 * or null if no intersection.
	 */
	static getLinePointsArrayIntersection(
		lineStart: KritzelPoint,
		lineEnd: KritzelPoint,
		polygonPoints: KritzelPoint[]
	): KritzelPoint | null {
		let closestIntersection: KritzelPoint | null = null;
		let closestDistance = Infinity;

		for (let i = 0; i < polygonPoints.length; i++) {
			const edgeStart = polygonPoints[i];
			const edgeEnd = polygonPoints[(i + 1) % polygonPoints.length];

			const intersection = this.getLineIntersectionPoint(lineStart, lineEnd, edgeStart, edgeEnd);
			if (intersection) {
				const distance = Math.sqrt(
					Math.pow(intersection.x - lineStart.x, 2) +
					Math.pow(intersection.y - lineStart.y, 2)
				);
				if (distance < closestDistance) {
					closestDistance = distance;
					closestIntersection = intersection;
				}
			}
		}

		return closestIntersection;
	}

	/**
	 * Checks if a point is inside a polygon defined as an array of points.
	 * This is a convenience wrapper that works with arbitrary polygon point arrays.
	 */
	static isPointInPolygonPoints(point: KritzelPoint, polygonPoints: KritzelPoint[]): boolean {
		return this.isPointInPolygon(point, polygonPoints);
	}
}

