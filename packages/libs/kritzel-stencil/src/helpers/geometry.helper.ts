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
}
