import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="card empty">
    <h1>404 - Not Found</h1>
    <p>The page you are looking for does not exist. <Link to="/">Back to the dashboard</Link></p>
  </div>
);

export default NotFound;
