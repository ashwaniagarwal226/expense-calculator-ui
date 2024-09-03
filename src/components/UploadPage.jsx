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
      <h1>Hello To Drag & Drop Files</h1>
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