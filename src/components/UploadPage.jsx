import { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import axios from "axios";
import PieChartComponent from "./PieChartComponent";
import { useNavigate } from 'react-router-dom';

const fileTypes = ["xls"];

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const navigate = useNavigate(); 

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
  const handleViewChart = () => {
    navigate('/bar-chart', { state: { data: monthlyData } });
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

      {monthlyData.length > 0 && (
        <div className="button-div">
          <button className="button-54" onClick={handleViewChart}>View Monthly Spending Bar Chart</button>
        <div className="monthly-charts">
          {monthlyData.map((monthData, index) => (
            <div key={index} className="month-chart">
              <h2>{monthData.month} {monthData.year}</h2>
              <PieChartComponent monthData={monthData} />
            </div>
          ))}
        </div>
        </div>
      )}

    </div>
    
  );
}