import React, { useEffect } from "react";
import { useImageGalleryStore } from '@/stores/useImageGalleryStore';
import { ProjectsApi } from '@/apis/beiboot-api/api';
import { useSession } from "next-auth/react";

const ImageEditor = () => {
    
    const {currentProjectId, selectedImages , clearSelectedImages} = useImageGalleryStore();
    const { data: session, status } = useSession();
    const [metadata, setMetadata] = React.useState(null);
    const [editMetadata, setEditMetadata] = React.useState(null);
    const [editingKey, setEditingKey] = React.useState(null); // key of the field being edited
    const [editValue, setEditValue] = React.useState(null); // value being edited
    const [isSaving, setIsSaving] = React.useState(false);
    const [selectedImage, setSelectedImage] = React.useState(null);

    useEffect(() => {
        console.log("Selected images changed", selectedImages);
    if(selectedImages.length > 0){
        setSelectedImage(selectedImages[0]);
    }
    setMetadata(null);
    setEditMetadata(null);
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
                    setEditMetadata(data ? JSON.parse(JSON.stringify(data)) : null);
                })
                .catch(err => {
                    console.error("Failed to load image metadata", err);
                });
        }
    }, [selectedImages]);
    // Helper to render value for editing
    const renderValueInput = (value, onChange) => {
        if (typeof value === 'object' && value !== null) {
            return (
                <textarea
                    className="border rounded px-1 py-0.5 w-full text-xs"
                    value={typeof onChange === 'function' ? JSON.stringify(value, null, 2) : value}
                    onChange={e => {
                        try {
                            onChange(JSON.parse(e.target.value));
                        } catch {
                            onChange(e.target.value); // fallback to raw string if invalid JSON
                        }
                    }}
                    rows={Math.max(2, JSON.stringify(value, null, 2).split('\n').length)}
                />
            );
        }
        return (
            <input
                className="border rounded px-1 py-0.5 w-full text-xs"
                value={value === undefined || value === null ? '' : value}
                onChange={e => onChange(e.target.value)}
            />
        );
    };

    // Save a single metadata field
    const handleSaveField = async (key) => {
        if (!selectedImage?.id || editValue === undefined) return;
        setIsSaving(true);
        try {
            const api = new ProjectsApi();
            await api.projectsControllerSetImageMetadata(
                currentProjectId,
                selectedImage.id,
                {
                    body: JSON.stringify({ tags: { [key]: editValue } }),
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.accessToken}`
                    }
                }
            );
            setMetadata(prev => ({
                ...prev,
                tags: {
                    ...prev.tags,
                    [key]: editValue
                }
            }));
            setEditingKey(null);
            setEditValue(null);
        } catch (err) {
            try {
                console.error("Failed to save image metadata", await err.json());
            } catch (e) {
                console.error("Failed to save image metadata", err);
            }
        }
        setIsSaving(false);
    };

    // Add new metadata field
    const handleAddField = async () => {
        if (!selectedImage?.id || !editingKey || editValue === undefined) return;
        setIsSaving(true);
        try {
            const api = new ProjectsApi();
            await api.projectsControllerSetImageMetadata(
                currentProjectId,
                selectedImage.id,
                {
                    body: JSON.stringify({ tags: { [editingKey]: editValue } }),
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.accessToken}`
                    }
                }
            );
            setMetadata(prev => ({
                ...prev,
                tags: {
                    ...prev.tags,
                    [editingKey]: editValue
                }
            }));
            setEditingKey(null);
            setEditValue(null);
        } catch (err) {
            try {
                console.error("Failed to add image metadata", await err.json());
            } catch (e) {
                console.error("Failed to add image metadata", err);
            }
        }
        setIsSaving(false);
    };

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
                <div className="ml-4">
                    {metadata === null ? (
                        <li className="text-gray-400">Loading...</li>
                    ) : metadata.tags && Object.keys(metadata.tags).length > 0 ? (
                        <>
                            {Object.entries(metadata.tags).map(([key, value]) => (
                                <li key={key} className="flex items-center gap-2 mb-1">
                                    <strong>{key}:</strong>
                                    {editingKey === key ? (
                                        <>
                                            <div className="flex-1">
                                                {renderValueInput(editValue, v => setEditValue(v))}
                                            </div>
                                            <button
                                                className="px-2 py-0.5 bg-green-600 text-white rounded text-xs disabled:opacity-50"
                                                disabled={isSaving}
                                                onClick={() => handleSaveField(key)}
                                            >
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                className="px-2 py-0.5 bg-gray-400 text-white rounded text-xs"
                                                onClick={() => { setEditingKey(null); setEditValue(null); }}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {typeof value === 'object' && value !== null ? (
                                                <pre className="inline text-xs bg-gray-100 px-1 py-0.5 rounded">{JSON.stringify(value, null, 2)}</pre>
                                            ) : String(value)}
                                            <button
                                                className="ml-2 px-2 py-0.5 bg-blue-500 text-white rounded text-xs"
                                                onClick={() => { setEditingKey(key); setEditValue(value); }}
                                            >
                                                Edit
                                            </button>
                                        </>
                                    )}
                                </li>
                            ))}
                            {/* Add new field */}
                            <li className="flex items-center gap-2 mt-2">
                                <input
                                    className="border rounded px-1 py-0.5 text-xs"
                                    placeholder="New key"
                                    value={editingKey && !(editingKey in (metadata.tags || {})) ? editingKey : ''}
                                    onChange={e => { setEditingKey(e.target.value); setEditValue(''); }}
                                    disabled={isSaving}
                                />
                                {editingKey && !(editingKey in (metadata.tags || {})) && (
                                    <>
                                        {renderValueInput(editValue, v => setEditValue(v))}
                                        <button
                                            className="px-2 py-0.5 bg-green-600 text-white rounded text-xs disabled:opacity-50"
                                            disabled={isSaving || !editingKey}
                                            onClick={handleAddField}
                                        >
                                            Add
                                        </button>
                                        <button
                                            className="px-2 py-0.5 bg-gray-400 text-white rounded text-xs"
                                            onClick={() => { setEditingKey(null); setEditValue(null); }}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </li>
                        </>
                    ) : (
                        <li className="text-gray-400">No metadata found.</li>
                    )}
                </div>
            )}
        </ul>
    </div>)
};

export default ImageEditor;