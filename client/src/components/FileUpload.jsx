import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, Loader } from 'lucide-react'
import './FileUpload.css'

export default function FileUpload({ onUpload, uploading }) {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            onUpload(acceptedFiles[0])
        }
    }, [onUpload])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        maxFiles: 1,
        disabled: uploading,
        maxSize: 50 * 1024 * 1024
    })

    return (
        <div
            {...getRootProps()}
            className={`upload-zone glass-card ${isDragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
            id="csv-upload-zone"
        >
            <input {...getInputProps()} id="csv-file-input" />
            <div className="upload-content">
                {uploading ? (
                    <>
                        <div className="upload-icon uploading-icon">
                            <Loader size={32} className="spin-icon" />
                        </div>
                        <h3 className="upload-title">Processing your data...</h3>
                        <p className="upload-description">AI agents are working on your file</p>
                    </>
                ) : isDragActive ? (
                    <>
                        <div className="upload-icon drag-icon">
                            <FileSpreadsheet size={32} />
                        </div>
                        <h3 className="upload-title">Drop your CSV file here</h3>
                    </>
                ) : (
                    <>
                        <div className="upload-icon">
                            <Upload size={32} />
                        </div>
                        <h3 className="upload-title">Upload Business Data</h3>
                        <p className="upload-description">
                            Drag & drop your CSV file here, or <span className="upload-browse">browse files</span>
                        </p>
                        <p className="upload-hint">Supports CSV files up to 50MB</p>
                    </>
                )}
            </div>
        </div>
    )
}
