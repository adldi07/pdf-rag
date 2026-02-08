'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react';

type FileUploadProps = {
	label?: string;
	helperText?: string;
	accept?: string;
	multiple?: boolean;
	disabled?: boolean;
	onFilesSelected?: (files: File[]) => void;
};

export function FileUpload({
	label = 'Upload files',
	helperText = 'Drag and drop files here, or click to browse',
	accept,
	multiple = false,
	disabled = false,
	onFilesSelected,
}: FileUploadProps) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [isDragActive, setIsDragActive] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

	const statusText = useMemo(() => {
		if (selectedFiles.length === 0) {
			return helperText;
		}
		if (selectedFiles.length === 1) {
			return selectedFiles[0].name;
		}
		return `${selectedFiles.length} files selected`;
	}, [helperText, selectedFiles]);

	const handleFiles = useCallback(
		(files: FileList | null) => {
			if (!files || files.length === 0) {
				return;
			}
			const fileArray = Array.from(files);
			setSelectedFiles(fileArray);
			onFilesSelected?.(fileArray);
		},
		[onFilesSelected]
	);

	const handleInputChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			handleFiles(event.target.files);
		},
		[handleFiles]
	);

	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			event.stopPropagation();
			setIsDragActive(false);
			if (disabled) {
				return;
			}
			handleFiles(event.dataTransfer.files);
		},
		[disabled, handleFiles]
	);

	const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (!disabled) {
			setIsDragActive(true);
		}
	}, [disabled]);

	const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragActive(false);
	}, []);

	const openFileDialog = useCallback(() => {
		if (!disabled) {
			inputRef.current?.click();
		}
	}, [disabled]);

	return (
		<div className="w-full">
			<label className="mb-3 block text-sm font-semibold text-slate-900">
				{label}
			</label>
			<div
				role="button"
				tabIndex={0}
				onClick={openFileDialog}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						openFileDialog();
					}
				}}
				aria-disabled={disabled}
				className={`flex min-h-[180px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all ${
					isDragActive ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
				} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
			>
				<div className="mb-3">
					<svg className="w-10 h-10 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
				</div>
				<p className="text-sm font-semibold text-slate-900 mb-1">{statusText}</p>
				<p className="text-xs text-slate-500">{helperText}</p>
				{selectedFiles.length > 0 && (
					<ul className="mt-4 space-y-2 w-full">
						{selectedFiles.map((file) => (
							<li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
								<svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6-3a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" clipRule="evenodd" />
									<path d="M8 6a4 4 0 110 8H2.5A2.5 2.5 0 010 11.5V4a2 2 0 012-2h8a2 2 0 012 2v.5" />
								</svg>
								{file.name}
							</li>
						))}
					</ul>
				)}
				<button
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						openFileDialog();
					}}
					disabled={disabled}
					className="mt-6 rounded-full bg-blue-600 text-white px-6 py-2 text-sm font-semibold transition-all hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
				>
					Choose file{multiple ? 's' : ''}
				</button>
			</div>
			<input
				ref={inputRef}
				type="file"
				accept={accept}
				multiple={multiple}
				disabled={disabled}
				onChange={handleInputChange}
				className="sr-only"
			/>
		</div>
	);
}

