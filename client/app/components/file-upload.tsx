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
				className={`flex min-h-[140px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all ${isDragActive ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
					} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
			>
				<div className="mb-2">
					<svg className="w-8 h-8 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
				</div>
				<p className="text-xs font-bold text-slate-900 mb-1">{statusText}</p>
				{selectedFiles.length === 0 && <p className="text-[10px] text-slate-500">{helperText}</p>}

				<button
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						openFileDialog();
					}}
					disabled={disabled}
					className="mt-4 rounded-lg bg-blue-600 text-white px-5 py-2 text-xs font-bold transition-all hover:bg-blue-700 disabled:bg-slate-300 shadow-sm"
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

