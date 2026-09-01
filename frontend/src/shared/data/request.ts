/**
 * 
 * REQUEST TYPES
 * 
 */

export type RequestProperty = {
    title: string
    caption: string
    price: string
    size: string
    images: RequestImages
    boundaries: RequestBoundaries
}

export type RequestBoundaries = {
    polygon: string
}

export type RequestImages = {
    position: number
    isPrimary: boolean
    imageAttributes: RequestImageAttributes
}

export type RequestImageAttributes = {
    caption: string
    alt: string
    brightness: number
    gamma: number
    contrast: number
    saturation: number
}
