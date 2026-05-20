export interface Point {
    x: number;
    y: number;
}


export interface Line {
    points: Point[];
    color: string;
    width: number;
    bounds?: BoundingBox;
}


export interface BoundingBox {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}