import Image from "next/image";

export default function ImageList({ files, onImageClick }) {
  return (
    <ul
      role="list"
      className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8"
    >
      {files.map((file) => (
        <li key={file.source} className="relative">
          <div
            className="group overflow-hidden rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 dark:focus-within:ring-offset-gray-900 cursor-pointer w-full aspect-[10/12] flex flex-col"
            onClick={() => onImageClick && onImageClick(file)}
            tabIndex={0}
            role="button"
            style={{ minHeight: 0 }}
          >
            <Image
              src={file.source}
              width={300}
              height={300}
              quality={25}
              alt={file.title}
            />
            <button type="button" className="absolute inset-0 focus:outline-hidden">
              <span className="sr-only">View details for {file.title}</span>
            </button>
          </div>
          <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {file.title}
          </p>
          <p className="pointer-events-none block text-sm font-medium text-gray-500 dark:text-gray-400">
            {file.size}
          </p>
        </li>
      ))}
    </ul>
  );
}
