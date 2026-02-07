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
		<div className="w-full justify-center ">
			<label className="mb-2 block text-sm font-medium text-slate-900">
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
				className={`flex min-h-[140px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
					isDragActive ? 'border-slate-900 bg-slate-50' : 'border-slate-300 bg-white'
				} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-slate-900'}`}
			>
				<p className="text-sm font-semibold text-slate-900">{statusText}</p>
				{selectedFiles.length > 0 && (
					<ul className="mt-3 space-y-1 text-xs text-slate-600">
						{selectedFiles.map((file) => (
							<li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
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
					className="mt-4 rounded-full border border-slate-900 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white disabled:border-slate-400 disabled:text-slate-400 disabled:hover:bg-transparent"
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

