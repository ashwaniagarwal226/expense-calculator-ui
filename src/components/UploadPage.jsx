import { useState } from "react";
import { FileUploader } from "react-drag-drop-files";

const fileTypes = ["xls"];

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const handleChange = (file) => {
    setFile(file);
  };
  return (
    <div className="upload-page">
      <h1>Upload Bank Statement</h1>
      <FileUploader
        multiple={false}
        handleChange={handleChange}
        name="file"
        types={fileTypes}
      />
      <p>{file ? `File name: ${file.name}` : "No Files"}</p>
    </div>
  );
}