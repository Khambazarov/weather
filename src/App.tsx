import { FC } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import { Weather } from "./Weather";

export const App: FC = () => {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const afterTomorrow = new Date(Date.now() + 2 * 86400000)
    .toISOString()
    .split("T")[0];

  return (
    <Router>
      <nav>
        <NavLink to={`/weather/${today}`} style={{ marginRight: "10px" }}>
          Today
        </NavLink>
        <NavLink to={`/weather/${tomorrow}`} style={{ marginRight: "10px" }}>
          Tomorrow
        </NavLink>
        <NavLink
          to={`/weather/${afterTomorrow}`}
          style={{ marginRight: "10px" }}
        >
          After Tomorrow
        </NavLink>
      </nav>
      <Routes>
        <Route path="/weather/:date" element={<Weather />} />
        <Route path="*" element={<Navigate to={`/weather/${today}`} />} />
      </Routes>
    </Router>
  );
};
