'use client'

import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import { HeartIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import { PencilIcon, PlusIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'


const IPTC_TAGS = [
    // IPTC Core
    "ObjectName",
    "EditStatus",
    "EditorialUpdate",
    "Urgency",
    "SubjectReference",
    "Category",
    "SupplementalCategories",
    "FixtureIdentifier",
    "Keywords",
    "ContentLocationCode",
    "ContentLocationName",
    "ReleaseDate",
    "ReleaseTime",
    "ExpirationDate",
    "ExpirationTime",
    "SpecialInstructions",
    "ActionAdvised",
    "ReferenceService",
    "ReferenceDate",
    "ReferenceNumber",
    "DateCreated",
    "TimeCreated",
    "DigitalCreationDate",
    "DigitalCreationTime",
    "OriginatingProgram",
    "ProgramVersion",
    "ObjectCycle",
    "Byline",
    "BylineTitle",
    "City",
    "SubLocation",
    "ProvinceState",
    "CountryPrimaryLocationCode",
    "CountryPrimaryLocationName",
    "OriginalTransmissionReference",
    "Headline",
    "Credit",
    "Source",
    "CopyrightNotice",
    "Contact",
    "Caption",
    "CaptionWriter",
    "ImageType",
    "ImageOrientation",
    "LanguageIdentifier",
    "JobID",
    "MasterDocumentID",
    "ShortDocumentID",
    "UniqueDocumentID",
    "OwnerID",
    "EnvelopeNumber",
    "ProductID",
    "ARMIdentifier",
    "ARMVersion",

    // EXIF/GPS tags commonly found in metadata editors
    "GPSLatitude",
    "GPSLongitude",
    "GPSAltitude",
    "GPSLatitudeRef",
    "GPSLongitudeRef",
    "GPSAltitudeRef",
    "GPSDateStamp",
    "GPSTimeStamp",
    "GPSProcessingMethod",
    "GPSMapDatum",
    "GPSMeasureMode",
    "GPSDOP",
    "GPSImgDirection",
    "GPSImgDirectionRef",
    "GPSDestLatitude",
    "GPSDestLongitude",
    "GPSDestBearing",
    "GPSDestDistance",
    "GPSHPositioningError",

    // Additional EXIF tags (for completeness)
    "Make",
    "Model",
    "Orientation",
    "XResolution",
    "YResolution",
    "ResolutionUnit",
    "Software",
    "DateTime",
    "Artist",
    "Copyright",
    "ExposureTime",
    "FNumber",
    "ExposureProgram",
    "ISOSpeedRatings",
    "ExifVersion",
    "DateTimeOriginal",
    "DateTimeDigitized",
    "ShutterSpeedValue",
    "ApertureValue",
    "BrightnessValue",
    "ExposureBiasValue",
    "MaxApertureValue",
    "MeteringMode",
    "LightSource",
    "Flash",
    "FocalLength",
    "UserComment",
    "SubSecTimeOriginal",
    "SubSecTimeDigitized",
    "ColorSpace",
    "PixelXDimension",
    "PixelYDimension",
    "SensingMethod",
    "FileSource",
    "SceneType",
    "CustomRendered",
    "ExposureMode",
    "WhiteBalance",
    "DigitalZoomRatio",
    "FocalLengthIn35mmFilm",
    "SceneCaptureType",
    "GainControl",
    "Contrast",
    "Saturation",
    "Sharpness",
    "SubjectDistanceRange",

    // XMP tags (commonly mapped to IPTC)
    "Creator",
    "Title",
    "Description",
    "Rights",
    "Publisher",
    "Contributor",
    "Date",
    "Type",
    "Format",
    "Identifier",
    "Source",
    "Language",
    "Coverage",
    "Relation",
    "Location",
    "Region",

    // Add more as needed from the IPTC Core, EXIF, and XMP specs
]

export default function IPTCEditor({ file, onClose, onDeleteSuccess, onSaveSuccess }) {
  if (!file) return null;

  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [newValue, setNewValue] = useState("")

  useEffect(() => {
    if (!file) return
    setLoading(true)
    setError(null)
    setMetadata(null)
    fetch(`/api/metadata/${file.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch metadata')
        return res.json()
      })
      .then(data => setMetadata(data.tags || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [file])

  // Download image
  const handleDownload = async () => {
    const response = await fetch(file.source)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.title
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  // Delete image
  const handleDelete = async () => {
    setDeleting(true)
    await fetch(`/api/images/${file.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (onDeleteSuccess) onDeleteSuccess()
    onClose()
  }

  // Save (overwrite) image with new IPTC data
  const handleSave = async () => {
    console.log('Saving metadata:', metadata)
    setSaving(true)
    await fetch(`/api/metadata/${file.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: metadata }),
    })
    setSaving(false)
    if (onSaveSuccess) onSaveSuccess()
    onClose()
  }

  const handleAddTag = () => {
    if (!newTag || newTag in (metadata || {})) return
    setMetadata(prev => ({ ...prev, [newTag]: newValue }))
    setNewTag("")
    setNewValue("")
  }

  return (
    <Dialog open={!!file} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity duration-500 ease-in-out data-closed:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <DialogPanel
              transition
              className="pointer-events-auto relative w-96 transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
            >
              <TransitionChild>
                <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:pr-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="relative rounded-md text-gray-300 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden dark:text-gray-400 dark:hover:text-white"
                  >
                    <span className="absolute -inset-2.5" />
                    <span className="sr-only">Close panel</span>
                    <XMarkIcon aria-hidden="true" className="size-6" />
                  </button>
                </div>
              </TransitionChild>
              <div className="h-full overflow-y-auto bg-white dark:bg-gray-900 p-8">
                <div className="space-y-6 pb-16">
                  <div>
                    <img
                      alt={file.title}
                      src={file.source}
                      className="block aspect-10/7 w-full rounded-lg object-cover"
                    />
                    <div className="mt-4 flex items-start justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          <span className="sr-only">Details for </span>{file.title}
                        </h2>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{file.size || "Unbekannt"}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">IPTC Metadata</h3>
                    <div className="mt-2">
                      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading metadata...</p>}
                      {error && <p className="text-sm text-red-500">{error}</p>}
                      {!loading && !error && metadata && (
                        <>
                          <form className="space-y-2">
                            {Object.entries(metadata)
                              .filter(([_, value]) => value !== null)
                              .map(([key, value]) => (
                                <div key={key} className="flex flex-col py-1">
                                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">{key}</label>
                                  <div className="flex gap-2">
                                    <input
                                      className="rounded border px-2 py-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 flex-1"
                                      value={
                                        typeof value === "object"
                                          ? JSON.stringify(value)
                                          : value !== undefined && value !== null
                                          ? value
                                          : ""
                                      }
                                      onChange={e => {
                                        let newValue = e.target.value;
                                        // Keep the type of the previous value
                                        if (typeof value === "number") {
                                          newValue = e.target.value === "" ? "" : Number(e.target.value);
                                          if (isNaN(newValue)) newValue = value; // fallback if not a number
                                        } else if (typeof value === "boolean") {
                                          newValue = e.target.value === "true";
                                        } else if (Array.isArray(value)) {
                                          try {
                                            newValue = JSON.parse(e.target.value);
                                            if (!Array.isArray(newValue)) throw new Error();
                                          } catch {
                                            newValue = value;
                                          }
                                        } else if (typeof value === "object") {
                                          try {
                                            newValue = JSON.parse(e.target.value);
                                          } catch {
                                            newValue = value;
                                          }
                                        }
                                        setMetadata(prev => ({ ...prev, [key]: newValue }));
                                      }}
                                      type={typeof value === "number" ? "number" : "text"}
                                    />
                                    <button
                                      type="button"
                                      className="ml-1 px-2 py-1 rounded text-xs bg-red-500 hover:bg-red-600 text-white dark:bg-red-700 dark:hover:bg-red-800 flex items-center"
                                      title={`Delete ${key}`}
                                      onClick={() => {
                                        setMetadata(prev => {
                                          const copy = { ...prev };
                                          copy[key] = null; // Mark for deletion in API
                                          return copy;
                                        });
                                      }}
                                    >
                                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </form>
                          {/* Add new tag section */}
                          <div className="flex gap-2 mt-4 items-end">
                            <div className="flex-1">
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Add Tag</label>
                              <select
                                className="w-full rounded border px-2 py-1 text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                              >
                                <option value="">Select tag…</option>
                                {IPTC_TAGS.filter(tag => !(metadata && tag in metadata)).map(tag => (
                                  <option key={tag} value={tag}>{tag}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Value</label>
                              <input
                                className="w-full rounded border px-2 py-1 text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                                value={newValue}
                                onChange={e => setNewValue(e.target.value)}
                                disabled={!newTag}
                                placeholder="Enter value"
                              />
                            </div>
                            <button
                              type="button"
                              className="rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:bg-gray-300 dark:disabled:bg-gray-700"
                              onClick={handleAddTag}
                              disabled={!newTag}
                            >
                              Add
                            </button>
                          </div>
                        </>
                      )}
                      {!loading && !error && !metadata && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No metadata found.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                      onClick={handleDownload}
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:ring-gray-700"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 dark:bg-green-700 dark:hover:bg-green-600"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Metadata"}
                    </button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
