import React, { useEffect, useState } from "react";
import { useImageGalleryStore } from '@/stores/useImageGalleryStore';
import { ProjectsApi } from '@/apis/beiboot-api/api';
import { useSession } from "next-auth/react";

// Helper to merge tags from multiple images
function mergeTags(imagesMetadata) {
    if (!imagesMetadata.length) return {};
    const allKeys = new Set();
    imagesMetadata.forEach(meta => {
        Object.keys(meta.tags || {}).forEach(k => allKeys.add(k));
    });
    const merged = {};
    for (const key of allKeys) {
        const values = imagesMetadata.map(meta => (meta.tags || {})[key]);
        const first = values[0];
        if (values.every(v => v === first)) {
            merged[key] = first;
        } else {
            merged[key] = "mixed";
        }
    }
    return merged;
}

const MultiImageEditor = () => {
    const { currentProjectId, selectedImages } = useImageGalleryStore(); // selectedImages: array of image objects
    const { data: session } = useSession();
    const [metadatas, setMetadatas] = useState([]);
    const [mergedTags, setMergedTags] = useState({});
    const [editingKey, setEditingKey] = useState(null);
    const [editValue, setEditValue] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch metadata for all selected images
    useEffect(() => {
        setMetadatas([]);
        setMergedTags({});
        setEditingKey(null);
        setEditValue(null);
        if (!selectedImages || selectedImages.length === 0) return;
        const api = new ProjectsApi();
        Promise.all(
            selectedImages.map(img =>
                api.projectsControllerGetImageMetadata(
                    currentProjectId,
                    img.id,
                    { headers: { Authorization: `Bearer ${session.accessToken}` } }
                ).then(async res => (typeof res.json === "function" ? await res.json() : res))
            )
        ).then(metas => {
            setMetadatas(metas);
            setMergedTags(mergeTags(metas));
        }).catch(err => {
            console.error("Failed to load image metadata", err);
        });
    }, [selectedImages, currentProjectId, session]);

    // Helper to render value input
    const renderValueInput = (value, onChange) => {
        if (typeof value === "object" && value !== null && value !== "mixed") {
            return (
                <textarea
                    className="border rounded px-1 py-0.5 w-full text-xs"
                    value={typeof onChange === "function" ? JSON.stringify(value, null, 2) : value}
                    onChange={e => {
                        try {
                            onChange(JSON.parse(e.target.value));
                        } catch {
                            onChange(e.target.value);
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

    // Save a single metadata field for all images (skip if value is "mixed")
    const handleSaveField = async (key) => {
        if (!selectedImages?.length || editValue === undefined) return;
        setIsSaving(true);
        const api = new ProjectsApi();
        try {
            await Promise.all(selectedImages.map((img, idx) => {
                // Only update if not "mixed" or if the value is being changed
                if (mergedTags[key] === "mixed" && editValue === "mixed") return Promise.resolve();
                return api.projectsControllerSetImageMetadata(
                    currentProjectId,
                    img.id,
                    {
                        body: JSON.stringify({ tags: { [key]: editValue } }),
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.accessToken}`
                        }
                    }
                );
            }));
            // Update local mergedTags
            setMergedTags(prev => ({
                ...prev,
                [key]: editValue
            }));
            setEditingKey(null);
            setEditValue(null);
        } catch (err) {
            try {
                console.error("Failed to save image metadata", await err.json?.());
            } catch (e) {
                console.error("Failed to save image metadata", err);
            }
        }
        setIsSaving(false);
    };

    // Add new metadata field to all images
    const handleAddField = async () => {
        if (!selectedImages?.length || !editingKey || editValue === undefined) return;
        setIsSaving(true);
        const api = new ProjectsApi();
        try {
            await Promise.all(selectedImages.map(img =>
                api.projectsControllerSetImageMetadata(
                    currentProjectId,
                    img.id,
                    {
                        body: JSON.stringify({ tags: { [editingKey]: editValue } }),
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.accessToken}`
                        }
                    }
                )
            ));
            setMergedTags(prev => ({
                ...prev,
                [editingKey]: editValue
            }));
            setEditingKey(null);
            setEditValue(null);
        } catch (err) {
            try {
                console.error("Failed to add image metadata", await err.json?.());
            } catch (e) {
                console.error("Failed to add image metadata", err);
            }
        }
        setIsSaving(false);
    };

    if (!selectedImages || selectedImages.length === 0) {
        return <div className="p-4 border bg-white text-gray-500">No images selected.</div>;
    }

    return (
        <div className="flex-1 flex flex-col border p-4">
            <div className="mb-4">
                <strong>Editing {selectedImages.length} images</strong>
            </div>
            <ul className="mb-4">
                {Object.keys(mergedTags).length > 0 ? (
                    <>
                        {Object.entries(mergedTags).map(([key, value]) => (
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
                                        {value === "mixed" ? (
                                            <span className="italic text-gray-400">mixed</span>
                                        ) : (
                                            typeof value === "object" && value !== null ?
                                                <pre className="inline text-xs bg-gray-100 px-1 py-0.5 rounded">{JSON.stringify(value, null, 2)}</pre>
                                                : String(value)
                                        )}
                                        {value !== "mixed" && (
                                            <button
                                                className="ml-2 px-2 py-0.5 bg-blue-500 text-white rounded text-xs"
                                                onClick={() => { setEditingKey(key); setEditValue(value); }}
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {value === "mixed" && (
                                            <button
                                                className="ml-2 px-2 py-0.5 bg-blue-500 text-white rounded text-xs"
                                                onClick={() => { setEditingKey(key); setEditValue(""); }}
                                            >
                                                Edit All
                                            </button>
                                        )}
                                    </>
                                )}
                            </li>
                        ))}
                        {/* Add new field */}
                        <li className="flex items-center gap-2 mt-2">
                            <input
                                className="border rounded px-1 py-0.5 text-xs"
                                placeholder="New key"
                                value={editingKey && !(editingKey in mergedTags) ? editingKey : ''}
                                onChange={e => { setEditingKey(e.target.value); setEditValue(''); }}
                                disabled={isSaving}
                            />
                            {editingKey && !(editingKey in mergedTags) && (
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
            </ul>
        </div>
    );
};

export default MultiImageEditor;