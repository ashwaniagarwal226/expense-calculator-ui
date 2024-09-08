import { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import axios from "axios";

const fileTypes = ["xls"];

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);

  const uploadFileToServer = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http:///192.168.1.3:8081/api/expense/v1/hdfc/transactionupload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage(response.data.status);
      return true; 
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("Failed to upload file.");
      return false; 
    }

  };

  const getGraphData = async () => {
    try {
      const response = await axios.get("http:///192.168.1.3:8081/api/expense/v1/hdfc/graphdata");
      setMonthlyData(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error calling API:", error);
    }
  };

  const handleChange = async (file) => {
    setFile(file);
    const uploadSuccess = await uploadFileToServer(file);
    if (uploadSuccess) {
      await getGraphData();
    }

  };

  const getPieChartData = (transSummary) => {
    // Initialize chart data with headers for Google Charts
    const chartData = [["Transaction Type", "Total Amount"]];
    
    // Loop through the transaction summary and push the data
    transSummary.forEach((transaction) => {
      if (transaction.totalAmount !== null) {
        chartData.push([transaction.transactionType, transaction.totalAmount]);
      }
    });
    
    return chartData;
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
      <p>{message ? `${file.name} ` + message : null}</p>
    </div>
    
  );
}