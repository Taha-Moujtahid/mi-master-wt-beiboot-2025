'use client'

export default function myImageLoader({ src, width, quality }) {
    const isLocal = !src.startsWith('http');
    const query = new URLSearchParams();

    const imageOptimizationApi = 'http://transformation.37.120.175.2.sslip.io';
    // Your NextJS application URL
    const baseUrl = 'localhost:3000/';

    const fullSrc = `${baseUrl}${src}`;

    if (width) query.set('width', width);
    if (quality) query.set('quality', quality);

    console.log('Image Loader:', {
        src,
        width,
        quality,
        isLocal,
        fullSrc,
        query: query.toString(),
    });

    if (isLocal && process.env.NODE_ENV === 'development') {
        return src;
    }
    if (isLocal) {
        return `${imageOptimizationApi}/image/${fullSrc}?${query.toString()}`;
    }
    return `${imageOptimizationApi}/image/${src}?${query.toString()}`;
}