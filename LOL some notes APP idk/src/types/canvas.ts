import { SkImage } from '@shopify/react-native-skia';

export interface ImageAsset {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scale: number;
    uri: string,
    image: SkImage;
}

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