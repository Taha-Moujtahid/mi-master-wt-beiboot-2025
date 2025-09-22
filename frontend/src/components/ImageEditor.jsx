import React, { useEffect } from "react";
import { useImageGalleryStore } from '@/stores/useImageGalleryStore';
import { ProjectsApi } from '@/apis/beiboot-api/api';
import { useSession } from "next-auth/react";

const ImageEditor = () => {
    
    const {selectedImage, clearSelectedImage} = useImageGalleryStore();
    const { data: session, status } = useSession();
    const [metadata, setMetadata] = React.useState(null);

    useEffect(() => {
        setMetadata(null);
        //load metadata when selected image changes
        if(selectedImage && selectedImage.id){
            //fetch metadata
            const api = new ProjectsApi();
            api.projectsControllerGetImageMetadata(1,selectedImage.id,{
                headers: { Authorization: `Bearer ${session.accessToken}` },
            })
                .then(async res => {
                    const data = typeof res.json === 'function' ? await res.json() : res;
                    console.log("Fetched image metadata",  data);
                    setMetadata(data);
                })
                .catch(err => {
                    console.error("Failed to load image metadata", err);
                });
        }
    }, [selectedImage]);

    if(!selectedImage) return <div className="p-4 border bg-white text-gray-500">No image selected.</div>;

    return( 
    <div className="flex-1 flex flex-col border">
        
        <img 
            src={selectedImage.url}
            alt={selectedImage.alt}
            className="w-[100%] max-w-[500px] aspect-square mb-4 bg-darker object-contain border-2 border-brand-primary"
        />

        <ul className="mb-4">
            <li><strong>Filename:</strong> {selectedImage.filename}</li>
            {selectedImage.createdAt && (
                <li><strong>Created At:</strong> {new Date(selectedImage.createdAt).toLocaleDateString()}</li>
            )}
            {selectedImage.alt && (
                <li><strong>Alt Text:</strong> {selectedImage.alt}</li>
            )}
            {selectedImage.width && selectedImage.height && (
                <li><strong>Dimensions:</strong> {selectedImage.width} x {selectedImage.height}</li>
            )}


            {selectedImage.id && (
                <ul className="ml-4">
                    {metadata === null ? (
                        <li className="text-gray-400">Loading...</li>
                    ) : metadata.tags && Object.keys(metadata.tags).length > 0 ? (
                        Object.entries(metadata.tags).map(([key, value]) => (
                            <li key={key}>
                                <strong>{key}:</strong> {String(value)}
                            </li>
                        ))
                    ) : (
                        <li className="text-gray-400">No metadata found.</li>
                    )}
                </ul>
            )}

        </ul>
    </div>)
    
};

export default ImageEditor;